import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Invoice.css";
import Header from "../Header";
import Footer from "../Footer/Footer";

const Invoice = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    const generateInvoice = () => {
      try {
        // Get URL parameters
        const params = new URLSearchParams(location.search);
        const subscriptionType = params.get("subscription_type");
        const amount = params.get("amount");
        const pidx = params.get("pidx");
        const transactionId = params.get("transaction_id");

        // Check auth token
        const token = sessionStorage.getItem("authToken");
        if (!token) {
          console.log("No auth token found");
          navigate('/login');
          return;
        }

        // Get user data from session storage
        const userDataStr = sessionStorage.getItem('userData');
        console.log("User data from sessionStorage:", userDataStr);
        
        let userData;
        try {
          userData = userDataStr ? JSON.parse(userDataStr) : null;
        } catch (e) {
          console.error("Error parsing user data:", e);
          userData = null;
        }

        if (!userData) {
          // Try to get user data from localStorage as fallback
          const localStorageUserData = localStorage.getItem('userData');
          if (localStorageUserData) {
            try {
              userData = JSON.parse(localStorageUserData);
              console.log("Using user data from localStorage");
            } catch (e) {
              console.error("Error parsing localStorage user data:", e);
            }
          }
        }

        if (!userData) {
          console.log("No user data found in sessionStorage or localStorage");
          // Instead of throwing error, use default values
          userData = {
            name: "Customer",
            email: "N/A",
            phone: "N/A"
          };
        }

        // Handle subscription invoice
        if (subscriptionType && amount) {
          const amountInRupees = parseInt(amount) / 100;
          const invoiceData = {
            type: 'subscription',
            orderId: `SUB-${Date.now()}`,
            transactionId: pidx || transactionId || "N/A",
            date: new Date().toISOString(),
            subscriptionType: subscriptionType,
            subtotal: amountInRupees,
            vat: amountInRupees * 0.13,
            total: amountInRupees * 1.13,
            customer: {
              name: userData.name || "Customer",
              email: userData.email || "N/A",
              phone: userData.phone || "N/A"
            }
          };

          // Verify all required data is present
          if (!invoiceData.customer.name || !invoiceData.customer.email || !invoiceData.subscriptionType || !invoiceData.total) {
            throw new Error('Incomplete invoice data');
          }

          if (isMounted.current) {
            setInvoiceData(invoiceData);
            setLoading(false);
          }
          return;
        }

        if (isMounted.current) {
          setError("Invalid invoice parameters");
          setLoading(false);
        }

      } catch (err) {
        if (!isMounted.current) return;

        console.error('Invoice loading error:', err);
        if (isMounted.current) {
          setError(err.message || "Failed to load invoice. Please try again.");
          setLoading(false);
        }
      }
    };

    isMounted.current = true;
    generateInvoice();

    return () => {
      isMounted.current = false;
    };
  }, [location.search, navigate]);

  if (loading) {
    return (
      <div className="invoice-container">
        <Header />
        <div className="invoice-loading">
          <div className="spinner"></div>
          <p>Loading invoice...</p>
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
    <>
      <div className="invoice-container">
        <Header />
        <div className="invoice">
          <div className="invoice-header">
            <h1>Invoice</h1>
            <div className="invoice-details">
              <p>Order ID: {invoiceData.orderId}</p>
              <p>Date: {new Date(invoiceData.date).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="invoice-customer">
            <h2>Customer Details</h2>
            <p>Name: {invoiceData.customer.name}</p>
            <p>Email: {invoiceData.customer.email}</p>
            <p>Phone: {invoiceData.customer.phone}</p>
          </div>

          <div className="invoice-items">
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
                  <td>{invoiceData.subscriptionType} Subscription</td>
                  <td>Rs. {invoiceData.subtotal.toFixed(2)}</td>
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

          <div className="invoice-footer">
            <p>Transaction ID: {invoiceData.transactionId}</p>
            <div className="invoice-actions">
              <button onClick={() => window.print()} className="btn-primary">
                Print Invoice
              </button>
              <button onClick={() => navigate('/')} className="btn-secondary">
                Return to Home
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Invoice;
