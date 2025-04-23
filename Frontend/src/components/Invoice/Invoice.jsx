import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from 'axios';
import "./Invoice.css";
import Header from "../Header";
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

const Invoice = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);
  const redirectTimer = useRef(null);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const generateInvoice = async () => {
      try {
        // Get URL parameters for Khalti payment
        const params = new URLSearchParams(location.search);
        const pidx = params.get("pidx");
        const transactionId = params.get("transaction_id");
        const amount = params.get("amount");
        const purchaseOrderName = params.get("purchase_order_name");
        const status = params.get("status");
        const redirectTo = params.get("redirect_to");
        
        // Log all URL parameters for debugging
        console.log('Invoice URL parameters:', Object.fromEntries(params.entries()));
        
        if (amount) {
          console.log('Amount received in URL:', {
            rawAmount: amount,
            parsedAmount: parseFloat(amount),
            assumingInPaisa: true // Assuming all amounts from Khalti are in paisa
          });
        }

        // If this is a subscription payment with redirect parameter, set a timer to redirect after viewing invoice
        if (redirectTo && (status === "Completed" || params.get("payment_status") === "paid")) {
          // Show redirecting message
          setRedirecting(true);
          
          // Set a timer to redirect after 5 seconds
          redirectTimer.current = setTimeout(() => {
            if (isMounted.current) {
              navigate(redirectTo);
            }
          }, 5000);
        }

        // Check if this is a Khalti payment success callback
        if (pidx && transactionId && status === "Completed") {
          // Always convert from paisa to rupees for display
          const parsedAmount = parseFloat(amount);
          const amountInRupees = parsedAmount / 100;
          
          console.log('Converting Khalti amount from paisa to rupees:', {
            originalPaisa: parsedAmount,
            convertedRupees: amountInRupees
          });
          
          // Generate invoice for Khalti payment
          const subscriptionInvoiceData = {
            type: 'subscription',
            transactionId: transactionId,
            date: new Date().toISOString(),
            customer: {
              name: user?.name || "Customer",
              email: user?.email || "N/A",
              phone: user?.phone || "N/A",
              address: user?.address || "N/A"
            },
            payment_method: "Khalti",
            payment_status: status,
            subscription: {
              name: purchaseOrderName,
              amount: amountInRupees,
            }
          };

          // Calculate totals
          const subtotal = subscriptionInvoiceData.subscription.amount;
          const vat = subtotal * 0.13;
          const total = subtotal + vat;

          subscriptionInvoiceData.subtotal = subtotal;
          subscriptionInvoiceData.vat = vat;
          subscriptionInvoiceData.total = total;
          
          console.log('Generated subscription invoice with amounts:', {
            subtotal,
            vat,
            total
          });

          if (isMounted.current) {
            setInvoiceData(subscriptionInvoiceData);
            setLoading(false);
          }
          return;
        }

        // Check for order-specific URL parameters that might have an amount
        const orderId = params.get("order_id");
        const orderAmount = params.get("amount");
        const paymentStatus = params.get("payment_status");
        
        // Handle direct order payment confirmation from Khalti return URL
        if (orderId && orderAmount && paymentStatus === "paid") {
          console.log('Processing direct order payment from URL params');
          
          // Always convert from paisa to rupees for display
          const parsedAmount = parseFloat(orderAmount);
          const amountInRupees = parsedAmount / 100;
          
          console.log('Converting Khalti order amount from paisa to rupees:', {
            originalPaisa: parsedAmount,
            convertedRupees: amountInRupees
          });
          
          // Try to get the token from correct storage
          const token = localStorage.getItem("token") || sessionStorage.getItem("authToken");
          
          if (!token) {
            setError("Authentication required");
            setLoading(false);
            return;
          }
          
          try {
            // Fetch order details
            const response = await axios.get(`http://localhost:5000/api/orders/${orderId}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (!response.data.success || !response.data.order) {
              throw new Error('Failed to fetch order details or order not found');
            }
            
            const order = response.data.order;
            
            // Calculate totals, but use the amount from URL if available (already converted if needed)
            const subtotal = amountInRupees ? amountInRupees / 1.13 : // Reverse-calculate from total with tax
              order.items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
              
            const vat = subtotal * 0.13;
            const total = amountInRupees || (subtotal + vat);
            
            console.log('Order invoice amounts:', { subtotal, vat, total, amountFromURL: amountInRupees });
            
            const invoiceData = {
              type: 'order',
              orderId: order.id,
              transactionId: pidx || transactionId || order.transaction_id || "N/A",
              date: order.created_at || new Date().toISOString(),
              items: order.items.map(item => ({
                ...item,
                price: parseFloat(item.price)
              })),
              subtotal: subtotal,
              vat: vat,
              total: total,
              customer: {
                name: order.user_name || "Customer",
                email: order.user_email || "N/A",
                phone: order.contact_number || "N/A",
                address: order.delivery_address || "N/A"
              },
              payment_method: order.payment_method || "Khalti",
              payment_status: paymentStatus || order.payment_status || "paid"
            };
            
            if (isMounted.current) {
              setInvoiceData(invoiceData);
              setLoading(false);
            }
            return;
          } catch (err) {
            console.error('Error processing order from URL params:', err);
            // Continue to try other methods
          }
        }

        // If not a direct URL payment, try to get order details using orderId parameter
        const orderIdParam = params.get("orderId");
        
        // Try to get the token from correct storage
        const token = localStorage.getItem("token") || sessionStorage.getItem("authToken");
        
        if (!token) {
          setError("Authentication required");
          setLoading(false);
          return;
        }

        if (orderIdParam) {
          try {
            console.log('Fetching order details for ID:', orderIdParam);
            // Fetch order details from the backend
            const response = await axios.get(`http://localhost:5000/api/orders/${orderIdParam}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            console.log('Order details response:', response.data);

            if (!response.data.success) {
              throw new Error('Failed to fetch order details');
            }

            const order = response.data.order;
            if (!order) {
              throw new Error('Order not found');
            }

            // Calculate totals
            const subtotal = order.items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
            const vat = subtotal * 0.13;
            const total = subtotal + vat;
            
            console.log('Order invoice totals:', {subtotal, vat, total});

            const invoiceData = {
              type: 'order',
              orderId: order.id,
              transactionId: pidx || transactionId || order.transaction_id || "N/A",
              date: order.created_at || new Date().toISOString(),
              items: order.items.map(item => ({
                ...item,
                price: parseFloat(item.price)
              })),
              subtotal: subtotal,
              vat: vat,
              total: total,
              customer: {
                name: order.user_name || "Customer",
                email: order.user_email || "N/A",
                phone: order.contact_number || "N/A",
                address: order.delivery_address || "N/A"
              },
              payment_method: order.payment_method || "N/A",
              payment_status: order.payment_status || "N/A"
            };

            console.log('Generated invoice data:', invoiceData);

            if (isMounted.current) {
              setInvoiceData(invoiceData);
              setLoading(false);
            }
            return;
          } catch (err) {
            console.error('Error fetching order details:', err);
            throw new Error('Failed to fetch order details');
          }
        }

        if (isMounted.current) {
          setError("Invalid invoice parameters");
          setLoading(false);
        }

      } catch (err) {
        console.error('Invoice generation error:', err);
        if (isMounted.current) {
          setError(err.message || "Failed to generate invoice");
          setLoading(false);
        }
      }
    };

    generateInvoice();

    return () => {
      isMounted.current = false;
      // Clear any active redirect timer
      if (redirectTimer.current) {
        clearTimeout(redirectTimer.current);
      }
    };
  }, [location.search, navigate, user]);

  const renderInvoiceContent = () => {
    if (invoiceData.type === 'subscription') {
      return (
        <div className="invoice-subscription">
          <h2>Subscription Details</h2>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{invoiceData.subscription.name}</td>
                <td>Rs. {invoiceData.subscription.amount.toFixed(2)}</td>
              </tr>
              <tr>
                <td>VAT (13%)</td>
                <td>Rs. {invoiceData.vat.toFixed(2)}</td>
              </tr>
              <tr className="total">
                <td>Total</td>
                <td>Rs. {invoiceData.total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    // Regular order invoice
    return (
      <div className="invoice-items">
        <h2>Order Details</h2>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {invoiceData.items?.map((item, index) => (
              <tr key={index}>
                <td>{item.name}</td>
                <td>{item.quantity}</td>
                <td>Rs. {item.price.toFixed(2)}</td>
                <td>Rs. {(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
            <tr>
              <td colSpan="3">Subtotal</td>
              <td>Rs. {invoiceData.subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan="3">VAT (13%)</td>
              <td>Rs. {invoiceData.vat.toFixed(2)}</td>
            </tr>
            <tr className="total">
              <td colSpan="3">Total</td>
              <td>Rs. {invoiceData.total.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="invoice-container">
        <Header />
        <div className="invoice-loading">
          <div className="spinner"></div>
          <p>Generating invoice...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="invoice-container">
        <Header />
        <div className="invoice-error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (!invoiceData) {
    return (
      <div className="invoice-container">
        <Header />
        <div className="invoice-error">
          <h2>No Invoice Data</h2>
          <p>Unable to generate invoice. Please try again.</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="invoice-container">
      <Header />
      <div className="invoice">
        {invoiceData && (
          <>
            <div className="invoice-header">
              <h1>Invoice</h1>
              <div className="invoice-date">
                <p>Date: {new Date(invoiceData.date).toLocaleDateString()}</p>
                {invoiceData.type === 'order' && (
                  <p>Order ID: {invoiceData.orderId}</p>
                )}
                <p>Transaction ID: {invoiceData.transactionId}</p>
              </div>
            </div>

            <div className="customer-info">
              <h2>Customer Information</h2>
              <p>Name: {invoiceData.customer.name}</p>
              <p>Email: {invoiceData.customer.email}</p>
              <p>Phone: {invoiceData.customer.phone}</p>
              {invoiceData.type === 'order' && (
                <p>Delivery Address: {invoiceData.customer.address}</p>
              )}
            </div>

            <div className="payment-info">
              <h2>Payment Information</h2>
              <p>Method: {invoiceData.payment_method}</p>
              <p>Status: {invoiceData.payment_status}</p>
            </div>

            {renderInvoiceContent()}

            {redirecting && (
              <div className="redirect-notification">
                <p>You will be redirected to your subscription details in 5 seconds...</p>
              </div>
            )}

            <div className="invoice-actions">
              <button className="print-button" onClick={() => window.print()}>
                Print Invoice
              </button>
              <button className="home-button" onClick={() => navigate('/')}>
                Return to Home
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Invoice;
