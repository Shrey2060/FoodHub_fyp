import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import './OrderHistory.css';
import toast from 'react-hot-toast';
import KhaltiCheckout from 'khalti-checkout-web';

// Delete Confirmation Dialog Component
const DeleteConfirmDialog = ({ isOpen, orderId, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog-content">
        <h2>Delete Order</h2>
        <p>Are you sure you want to delete Order #{orderId}?</p>
        <p className="dialog-subtitle">This action cannot be undone.</p>
        <div className="dialog-buttons">
          <button className="dialog-button cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="dialog-button confirm" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Modify the ConfirmOrderDialog component
const ConfirmOrderDialog = ({ isOpen, orderId, order, onConfirm, onCancel, onKhaltiPayment }) => {
    if (!isOpen) return null;

    return (
        <div className="dialog-overlay">
            <div className="dialog-content payment-selection">
                <h2>Select Payment Method</h2>
                <p>Please select your preferred payment method for Order #{orderId}</p>
                <div className="payment-options">
                    <button 
                        className="payment-button khalti"
                        onClick={() => onKhaltiPayment(order)}
                    >
                        <img src="/khalti-logo.png" alt="Khalti" />
                        Pay with Khalti
                    </button>
                    <button 
                        className="payment-button cod"
                        onClick={() => onConfirm(orderId, 'cash')}
                    >
                        <span className="cod-icon">💵</span>
                        Cash on Delivery
                    </button>
                </div>
                <button className="dialog-button cancel" onClick={onCancel}>
                    Cancel
                </button>
            </div>
        </div>
    );
};

const CancelOrderDialog = ({ isOpen, orderId, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="dialog-overlay">
            <div className="dialog-content">
                <h2>Cancel Order</h2>
                <p>Are you sure you want to cancel Order #{orderId}?</p>
                <p className="dialog-subtitle">This action cannot be undone.</p>
                <div className="dialog-buttons">
                    <button className="dialog-button cancel" onClick={onCancel}>
                        No, Keep Order
                    </button>
                    <button className="dialog-button confirm" onClick={onConfirm}>
                        Yes, Cancel Order
                    </button>
                </div>
            </div>
        </div>
    );
};

// Add state for remove dialog
const RemoveOrderDialog = ({ isOpen, orderId, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="dialog-overlay">
            <div className="dialog-content">
                <h2>Remove Order</h2>
                <p>Are you sure you want to remove Order #{orderId} from your history?</p>
                <p className="dialog-subtitle">This action cannot be undone.</p>
                <div className="dialog-buttons">
                    <button className="dialog-button cancel" onClick={onCancel}>
                        No, Keep Order
                    </button>
                    <button className="dialog-button confirm" onClick={onConfirm}>
                        Yes, Remove Order
                    </button>
                </div>
            </div>
        </div>
    );
};

// Add SuccessDialog component after RemoveOrderDialog component
const SuccessDialog = ({ isOpen, message, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="dialog-overlay">
            <div className="dialog-content">
                <h2>Success!</h2>
                <p>{message}</p>
                <div className="dialog-buttons">
                    <button className="dialog-button confirm" onClick={onClose}>
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [preOrders, setPreOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('regular'); // 'regular' or 'pre'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, orderId: null });
  const [notifications, setNotifications] = useState([]);
  const [cancelDialog, setCancelDialog] = useState({ isOpen: false, orderId: null });
  const [removeDialog, setRemoveDialog] = useState({ isOpen: false, orderId: null });
  const [orderTotals, setOrderTotals] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, orderId: null });
  const [successDialog, setSuccessDialog] = useState({ isOpen: false, message: '' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
    fetchPreOrders();
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    // This will be implemented later when backend is ready
    return;
  };

  // Mark notification as read
  const markNotificationAsRead = async (notificationId) => {
    try {
      const token = sessionStorage.getItem('authToken');
      await axios.put(
        `http://localhost:5000/api/orders/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Update notifications list
      setNotifications(prevNotifications =>
        prevNotifications.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Calculate totals for an order
  const calculateOrderTotals = (order) => {
    const subtotal = order.items.reduce(
      (acc, item) => acc + (parseFloat(item.price || 0) * parseInt(item.quantity || 1)),
      0
    );
    const vat = Math.round(subtotal * 0.13 * 100) / 100;
    const total = Math.round((subtotal + vat) * 100) / 100;
    
    setOrderTotals(prev => ({
      ...prev,
      [order.id]: { 
        subtotal: Math.round(subtotal * 100) / 100,
        vat,
        total
      }
    }));
  };

  // Fetch pre-orders
  const fetchPreOrders = async () => {
    try {
      const token = sessionStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found');
        setError('Authentication token missing');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await axios.get('http://localhost:5000/api/pre-orders', { headers });
      console.log('Pre-orders response:', response.data);
      if (response.data.success) {
        setPreOrders(response.data.pre_orders || []);
      } else {
        setError('Failed to fetch pre-orders');
      }
    } catch (error) {
      console.error('Error fetching pre-orders:', error);
      setError('Failed to fetch pre-orders');
    }
  };

  // READ - Fetch all orders
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage('');
    
    const token = sessionStorage.getItem('authToken');
    console.log('Current token from sessionStorage:', token);

    if (!token) {
      console.log('No auth token found, redirecting to login');
      navigate('/login');
      return;
    }

    try {
      console.log('Making request to /api/orders/history');
      const response = await axios.get('http://localhost:5000/api/orders/history', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Full orders response:', JSON.stringify(response.data, null, 2));
      
      if (response.data && response.data.success && Array.isArray(response.data.orders)) {
        console.log('Processing orders:', response.data.orders);
        const orders = response.data.orders;
        setOrders(orders);
        // Calculate totals for each order
        orders.forEach(order => calculateOrderTotals(order));
      } else {
        console.error('Invalid orders data format:', response.data);
        setError('Invalid data format received from server');
      }
    } catch (err) {
      console.error('Error fetching orders:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      if (err.response?.status === 401) {
        console.log('Unauthorized access, redirecting to login');
        sessionStorage.removeItem('authToken');
        navigate('/login');
        return;
      }
      setError(err.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  // DELETE - Delete an order
  const handleDeleteClick = (orderId) => {
    setDeleteDialog({ isOpen: true, orderId });
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, orderId: null });
  };

  const handleDeleteConfirm = async () => {
    const orderId = deleteDialog.orderId;
    setDeleteDialog({ isOpen: false, orderId: null });

    try {
      setLoading(true);
      const token = sessionStorage.getItem('authToken');
      const response = await axios.delete(`http://localhost:5000/api/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setSuccessMessage('Order deleted successfully');
        setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
      } else {
        setError('Failed to delete order');
      }
    } catch (err) {
      console.error('Error deleting order:', err.response || err);
      setError(err.response?.data?.message || 'Failed to delete order');
    } finally {
      setLoading(false);
    }
  };

  // Modify handleConfirmOrder function
  const handleConfirmOrder = async (orderId, paymentMethod) => {
    try {
        setLoading(true);
        const token = sessionStorage.getItem('authToken');
        const response = await axios.put(
            `http://localhost:5000/api/orders/${orderId}/confirm`,
            {
                payment_method: paymentMethod,
                payment_status: paymentMethod === 'cash' ? 'pending' : 'paid'
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.data.success) {
            // Update the order status in the local state
            setOrders(prevOrders =>
                prevOrders.map(order =>
                    order.id === orderId
                        ? { 
                            ...order, 
                            status: 'confirmed', 
                            is_confirmed: true,
                            payment_method: paymentMethod,
                            payment_status: paymentMethod === 'cash' ? 'pending' : 'paid'
                          }
                        : order
                )
            );

            // If it's cash on delivery, show success dialog
            if (paymentMethod === 'cash') {
                setSuccessDialog({
                    isOpen: true,
                    message: 'Your order has been confirmed! Our team will process it shortly. Payment status: Pending'
                });
            } else if (paymentMethod === 'khalti') {
                // For Khalti, initiate payment
                handleKhaltiPayment(orders.find(order => order.id === orderId));
            }
        } else {
            setError('Failed to confirm order');
        }
    } catch (err) {
        console.error('Error confirming order:', err.response || err);
        setError(err.response?.data?.message || 'Failed to confirm order');
    } finally {
        setLoading(false);
        setConfirmDialog({ isOpen: false, orderId: null });
    }
  };

  // Update handleKhaltiPayment function
  const handleKhaltiPayment = async (order) => {
    try {
        const amount = Math.round(orderTotals[order.id]?.total * 100); // Convert to paisa
        
        if (!amount) {
            toast.error('Invalid order amount');
            return;
        }

        // Store complete order details in sessionStorage
        const orderDetails = {
            id: order.id,
            amount: amount,
            items: order.items,
            total_amount: orderTotals[order.id]?.total,
            contact_number: order.contact_number,
            delivery_address: order.delivery_address,
            payment_method: 'khalti',
            status: order.status,
            is_confirmed: order.is_confirmed
        };
        sessionStorage.setItem('currentKhaltiOrder', JSON.stringify(orderDetails));

        const payload = {
            return_url: `http://localhost:5173/orders?order_id=${order.id}&payment_status=paid`,
            website_url: "http://localhost:5173",
            amount: amount,
            purchase_order_id: `order_${order.id}_${Date.now()}`,
            purchase_order_name: `Order #${order.id}`,
            customer_info: {
                name: sessionStorage.getItem('userName') || "Customer",
                email: sessionStorage.getItem('userEmail') || "",
                phone: order.contact_number || ""
            },
            amount_breakdown: [
                {
                    label: "Order Amount",
                    amount: amount
                }
            ],
            product_details: order.items.map(item => ({
                identity: item.id,
                name: item.name,
                total_price: item.price * item.quantity * 100,
                quantity: item.quantity,
                unit_price: item.price * 100
            }))
        };

        console.log("Initiating Khalti payment with payload:", payload);

        const token = sessionStorage.getItem('authToken');
        const response = await axios.post(
            "http://localhost:5000/api/payment/khalti/initiate",
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log("Khalti initiation response:", response.data);

        if (response.data && response.data.payment_url) {
            toast.success('Redirecting to Khalti payment page...');
            // Redirect to Khalti payment page
            window.location.href = response.data.payment_url;
        } else {
            toast.error('Failed to initiate payment: ' + (response.data?.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error initiating Khalti payment:', error.response || error);
        toast.error(error.response?.data?.message || 'Failed to initiate payment');
    }
  };

  // Update useEffect to handle return from Khalti payment
  useEffect(() => {
    const handleKhaltiReturn = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const orderId = urlParams.get('order_id');
      const pidx = urlParams.get('pidx');
      const paymentStatus = urlParams.get('payment_status');

      console.log("Handling Khalti return with params:", { orderId, pidx, paymentStatus });

      if (orderId && paymentStatus === 'paid') {
        try {
          const token = sessionStorage.getItem('authToken');
          const storedOrder = JSON.parse(sessionStorage.getItem('currentKhaltiOrder') || '{}');
          
          console.log("Stored order details:", storedOrder);

          if (storedOrder.id === parseInt(orderId)) {
            const loadingToast = toast.loading('Verifying payment...');

            try {
              // First verify payment with Khalti
              const verifyResponse = await axios.post(
                `http://localhost:5000/api/khalti/verify`,
                {
                  pidx: pidx,
                  amount: storedOrder.amount,
                  orderId: orderId
                },
                {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                }
              );

              console.log("Payment verification response:", verifyResponse.data);

              if (verifyResponse.data.success) {
                // If payment is verified, update order status
                const updateResponse = await axios.put(
                  `http://localhost:5000/api/orders/${orderId}/confirm`,
                  {
                    payment_method: 'khalti',
                    payment_status: 'paid',
                    status: 'processing',
                    transaction_id: pidx,
                    khalti_payment_idx: pidx
                  },
                  {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    }
                  }
                );

                if (updateResponse.data.success) {
                  // Navigate to invoice page immediately after verification
                  navigate(`/invoice?order_id=${orderId}&pidx=${pidx}&payment_status=paid&transaction_id=${pidx}`);
                  
                  // Show success message after navigation
                  toast.dismiss(loadingToast);
                  toast.success('Payment successful! Generating invoice...');
                  
                  // Clear the stored order
                  sessionStorage.removeItem('currentKhaltiOrder');
                  
                  // Refresh orders to get the latest status
                  await fetchOrders();
                } else {
                  toast.dismiss(loadingToast);
                  toast.error('Order status update failed');
                }
              } else {
                toast.dismiss(loadingToast);
                toast.error('Payment verification failed');
              }
            } catch (error) {
              toast.dismiss(loadingToast);
              console.error('Error in payment verification:', error.response || error);
              toast.error('Payment verification failed: ' + (error.response?.data?.message || 'Unknown error'));
            }
          } else {
            console.error("Order ID mismatch:", { stored: storedOrder.id, received: orderId });
            toast.error('Order verification failed');
          }
        } catch (error) {
          console.error('Error in payment verification:', error.response || error);
          toast.error('Payment verification failed: ' + (error.response?.data?.message || 'Unknown error'));
        }
      }
    };

    handleKhaltiReturn();
  }, [navigate]);

  // Helper function to format dates
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper function to format currency in Nepali Rupees
  const formatCurrency = (amount) => {
    return `Rs. ${Number(amount || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  // Update the handleCancelClick function
  const handleCancelClick = (orderId) => {
    const orderToCancel = orders.find(order => order.id === orderId);
    if (orderToCancel) {
        setCancelDialog({ isOpen: true, orderId, order: orderToCancel });
    }
  };

  // Update handleCancelConfirm function
  const handleCancelConfirm = async (order) => {
    try {
        const loadingToastId = toast.loading('Processing cancellation...');
        const token = sessionStorage.getItem('authToken');
        
        // First, cancel the order
        const cancelResponse = await axios.put(
            `http://localhost:5000/api/orders/${order.id}/cancel`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (cancelResponse.data.success) {
            // Check if the order was paid with Khalti and is in 'paid' status
            if (order.payment_method === 'khalti' && order.payment_status === 'paid') {
                toast.loading('Your order is cancelled. Processing refund through Khalti...', { id: loadingToastId });
                try {
                    // Get the total amount in paisa
                    const refundAmount = Math.round(orderTotals[order.id]?.total * 100);
                    
                    // Initiate refund for Khalti payment
                    const refundResponse = await axios.post(
                        `http://localhost:5000/api/payment/khalti/refund`,
                        {
                            orderId: order.id,
                            amount: refundAmount,
                            pidx: order.khalti_payment_idx,
                            remarks: `Refund for order #${order.id}`
                        },
                        { 
                            headers: { 
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            } 
                        }
                    );

                    if (refundResponse.data.success) {
                        // Show success dialog with refund information
                        setSuccessDialog({
                            isOpen: true,
                            message: `Order #${order.id} has been cancelled. A refund of ${formatCurrency(orderTotals[order.id]?.total)} will be processed to your Khalti account within 3-5 business days.`
                        });
                        toast.dismiss(loadingToastId);
                        
                        // Update order status to include refund status
                        setOrders(prevOrders =>
                            prevOrders.map(o =>
                                o.id === order.id
                                    ? { ...o, status: 'cancelled', payment_status: 'refund_initiated' }
                                    : o
                            )
                        );
                    } else {
                        setSuccessDialog({
                            isOpen: true,
                            message: `Order #${order.id} has been cancelled. However, there was an issue processing your refund. Our team will contact you shortly.`
                        });
                        toast.dismiss(loadingToastId);
                    }
                } catch (refundError) {
                    console.error('Refund error:', refundError);
                    setSuccessDialog({
                        isOpen: true,
                        message: `Order #${order.id} has been cancelled. There was an error processing your refund. Our support team has been notified and will assist you shortly.`
                    });
                    toast.dismiss(loadingToastId);
                }
            } else {
                // For non-Khalti payments or pending payments
                if (order.payment_method === 'khalti' && order.payment_status === 'pending') {
                    toast.success('Order cancelled successfully. Refund will be sent to your Khalti account within 3-5 days.', { id: loadingToastId });
                } else if (order.payment_method === 'cash') {
                    toast.success('Order cancelled successfully.', { id: loadingToastId });
                }
            }

            // Update local state
            setOrders(prevOrders =>
                prevOrders.map(o =>
                    o.id === order.id
                        ? { ...o, status: 'cancelled' }
                        : o
                )
            );

            // Close the cancel dialog
            setCancelDialog({ isOpen: false, orderId: null, order: null });
            
            // Refresh orders after all operations
            await fetchOrders();
        } else {
            toast.error(cancelResponse.data.message || 'Failed to cancel order', { id: loadingToastId });
        }
    } catch (error) {
        console.error('Error:', error);
        toast.error(error.response?.data?.message || 'Error cancelling order');
        // Close the dialog even if there's an error
        setCancelDialog({ isOpen: false, orderId: null, order: null });
    }
  };

  // Add handleRemoveClick function
  const handleRemoveClick = (orderId) => {
    setRemoveDialog({ isOpen: true, orderId });
  };

  // Update handleRemoveConfirm function
  const handleRemoveConfirm = async () => {
    const orderId = removeDialog.orderId;
    setRemoveDialog({ isOpen: false, orderId: null });

    try {
        const loadingToastId = toast.loading('Removing order...');
        const token = sessionStorage.getItem('authToken');
        
        const response = await axios.delete(
            `http://localhost:5000/api/orders/${orderId}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        if (response.data.success) {
            toast.success('Order removed successfully', { id: loadingToastId });
            // Remove the order from local state
            setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
            // Refresh orders to get the latest status
            await fetchOrders();
        } else {
            toast.error(response.data.message || 'Failed to remove order', { id: loadingToastId });
        }
    } catch (err) {
        console.error('Error removing order:', err);
        toast.error(err.response?.data?.message || 'Failed to remove order');
    }
  };

  // Add handleRemoveCancel function
  const handleRemoveCancel = () => {
    setRemoveDialog({ isOpen: false, orderId: null });
  };

  // Add handleCancelPreOrder function
  const handleCancelPreOrder = async (orderId) => {
    try {
      const token = sessionStorage.getItem('authToken');
      const response = await axios.delete(
        `http://localhost:5000/api/pre-orders/${orderId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Pre-order cancelled successfully');
        // Update the pre-order status in the local state
        setPreOrders(prevPreOrders =>
          prevPreOrders.map(order =>
            order.id === orderId
              ? { ...order, order_status: 'cancelled' }
              : order
          )
        );
        // Refresh pre-orders
        await fetchPreOrders();
      } else {
        toast.error(response.data.message || 'Failed to cancel pre-order');
      }
    } catch (error) {
      console.error('Error cancelling pre-order:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel pre-order');
    }
  };

  // Update the renderOrderActions function
  const renderOrderActions = (order) => {
    return (
        <div className="order-actions">
            {order.status === 'pending' && !order.is_confirmed && order.payment_status !== 'paid' && (
                <button
                    className="btn-confirm-order"
                    onClick={() => setConfirmDialog({ 
                        isOpen: true, 
                        orderId: order.id,
                        order: order
                    })}
                >
                    Confirm Order
                </button>
            )}
            {(order.status === 'pending' || order.status === 'processing') && (
                <button
                    className="btn-cancel"
                    onClick={() => handleCancelClick(order.id)}
                >
                    Cancel Order
                </button>
            )}
            {order.status === 'cancelled' && (
                <button
                    className="btn-remove"
                    onClick={() => handleRemoveClick(order.id)}
                >
                    Remove
                </button>
            )}
            {order.status === 'pending' && !order.is_confirmed && order.payment_status !== 'paid' && (
                <button
                    className="btn-delete"
                    onClick={() => handleDeleteClick(order.id)}
                >
                    Delete
                </button>
            )}
        </div>
    );
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-blue-100 text-blue-800',
      'preparing': 'bg-purple-100 text-purple-800',
      'ready': 'bg-green-100 text-green-800',
      'delivered': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleRemovePreOrder = async (orderId) => {
    try {
      const token = sessionStorage.getItem('authToken');
      if (!token) {
        toast.error('Authentication token missing');
        return;
      }

      // Disable the remove button to prevent multiple clicks
      const removeButton = document.querySelector(`[data-order-id="${orderId}"]`);
      if (removeButton) {
        removeButton.disabled = true;
      }

      const response = await axios.delete(
        `http://localhost:5000/api/pre-orders/${orderId}`,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success('Pre-order removed successfully');
        // Fetch fresh data from the backend
        await fetchPreOrders();
      } else {
        toast.error(response.data.message || 'Failed to remove pre-order');
      }
    } catch (error) {
      console.error('Error removing pre-order:', error);
      toast.error(error.response?.data?.message || 'Failed to remove pre-order');
    } finally {
      // Re-enable the remove button
      const removeButton = document.querySelector(`[data-order-id="${orderId}"]`);
      if (removeButton) {
        removeButton.disabled = false;
      }
    }
  };

  if (loading) {
    return (
      <div className="order-history-container">
        <Header />
        <div className="loading-container">
          <h2>Loading orders...</h2>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="order-history-container">
        <h1 className="page-title">Order History</h1>
        
        {/* Tab Navigation */}
        <div className="tabs-container">
          <button
            className={`tab-button ${activeTab === 'regular' ? 'active' : ''}`}
            onClick={() => setActiveTab('regular')}
          >
            Regular Orders
          </button>
          <button
            className={`tab-button ${activeTab === 'pre' ? 'active' : ''}`}
            onClick={() => setActiveTab('pre')}
          >
            Pre-Orders
          </button>
        </div>

        {/* Total Amount Display */}
        {!error && (
          <div className="total-amount-display">
            <div className="total-amount-card">
              <h3>Total Amount</h3>
              <div className="total-amount">
                {activeTab === 'regular' ? (
                  formatCurrency(
                    Object.values(orderTotals).reduce(
                      (sum, order) => sum + order.total,
                      0
                    )
                  )
                ) : (
                  formatCurrency(
                    preOrders.reduce(
                      (sum, order) => {
                        const orderTotal = order.items.reduce(
                          (itemSum, item) => itemSum + (item.price * item.quantity),
                          0
                        );
                        return sum + orderTotal;
                      },
                      0
                    )
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmDialog
          isOpen={deleteDialog.isOpen}
          orderId={deleteDialog.orderId}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />

        {/* Success Message */}
        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-container">
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={fetchOrders} className="retry-button">
              Retry
            </button>
          </div>
        )}
        
        {/* Orders List */}
        {!error && orders.length === 0 ? (
          <div className="no-orders-container">
            <h2>No Orders Found</h2>
            <p className="no-orders-subtitle">You haven't placed any orders yet.</p>
          </div>
        ) : (
          <div className="orders-list">
            {activeTab === 'regular' ? (
              orders.map((order) => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <h2>Order #{order.id}</h2>
                    <span className={`status-badge ${order.status}`}>
                      {order.status}
                    </span>
                  </div>
                  
                  <div className="order-details">
                    <p><strong>Date:</strong> {new Date(order.created_at).toLocaleString()}</p>
                    <p><strong>Delivery Address:</strong> {order.delivery_address}</p>
                    <p><strong>Contact:</strong> {order.contact_number}</p>
                    <p><strong>Payment Method:</strong> {order.payment_method}</p>
                  </div>
                  
                  <div className="order-items">
                    <h3>Items:</h3>
                    {order.items && order.items.map((item, index) => (
                      <div key={index} className="order-item">
                        <span>{item.name}</span>
                        <span>x{item.quantity}</span>
                        <span>{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="order-summary">
                    <div className="summary-row">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(orderTotals[order.id]?.subtotal || 0)}</span>
                    </div>
                    <div className="summary-row">
                      <span>VAT (13%):</span>
                      <span>{formatCurrency(orderTotals[order.id]?.vat || 0)}</span>
                    </div>
                    <div className="summary-row total">
                      <span>Total:</span>
                      <span>{formatCurrency(orderTotals[order.id]?.total || 0)}</span>
                    </div>
                  </div>
                  
                  {renderOrderActions(order)}
                </div>
              ))
            ) : (
              preOrders.map((order) => {
                // Safely parse items with error handling
                let parsedItems = [];
                try {
                  parsedItems = typeof order.items === 'string' 
                    ? JSON.parse(order.items)
                    : Array.isArray(order.items) 
                      ? order.items 
                      : [];
                } catch (error) {
                  console.error('Error parsing order items:', error);
                  parsedItems = [];
                }

                return (
                  <div key={order.id} className="order-card">
                    <div className="order-header">
                      <h3>Pre-Order #{order.id}</h3>
                      <span className={`status-badge ${getStatusColor(order.order_status)}`}>
                        {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
                      </span>
                    </div>

                    <div className="order-details">
                      <p><strong>Scheduled Date:</strong> {new Date(order.scheduled_date).toLocaleDateString()}</p>
                      <p><strong>Delivery Time:</strong> {order.delivery_time}</p>
                      <p><strong>Delivery Address:</strong> {order.delivery_address}</p>
                      {order.special_instructions && (
                        <p><strong>Special Instructions:</strong> {order.special_instructions}</p>
                      )}
                    </div>

                    <div className="order-items">
                      <h4>Items:</h4>
                      {parsedItems.map((item, index) => (
                        <div key={index} className="order-item">
                          <div className="item-info">
                            <span className="item-name">{item.name}</span>
                            <span className="item-quantity">x{item.quantity}</span>
                          </div>
                          <span className="item-price">Rs. {item.price * item.quantity}</span>
                        </div>
                      ))}
                      {parsedItems.length === 0 && (
                        <p className="no-items">No items found in this order</p>
                      )}
                    </div>

                    <div className="order-actions">
                      {order.order_status === 'pending' && (
                        <button
                          onClick={() => handleCancelPreOrder(order.id)}
                          className="cancel-button"
                        >
                          Cancel Pre-Order
                        </button>
                      )}
                      {order.order_status === 'cancelled' && (
                        <button
                          onClick={() => handleRemovePreOrder(order.id)}
                          className="remove-button"
                          data-order-id={order.id}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Update Confirm Order Dialog */}
        <ConfirmOrderDialog
            isOpen={confirmDialog.isOpen}
            orderId={confirmDialog.orderId}
            order={orders.find(o => o.id === confirmDialog.orderId)}
            onConfirm={handleConfirmOrder}
            onCancel={() => setConfirmDialog({ isOpen: false, orderId: null })}
            onKhaltiPayment={handleKhaltiPayment}
        />

        {/* Cancel Order Dialog */}
        <CancelOrderDialog
            isOpen={cancelDialog.isOpen}
            orderId={cancelDialog.orderId}
            onConfirm={() => {
                const orderToCancel = orders.find(order => order.id === cancelDialog.orderId);
                if (orderToCancel) {
                    handleCancelConfirm(orderToCancel);
                    setCancelDialog({ isOpen: false, orderId: null, order: null });
                }
            }}
            onCancel={() => setCancelDialog({ isOpen: false, orderId: null, order: null })}
        />

        {/* Success Dialog */}
        <SuccessDialog
            isOpen={successDialog.isOpen}
            message={successDialog.message}
            onClose={() => {
                setSuccessDialog({ isOpen: false, message: '' });
                fetchOrders(); // Refresh orders after closing dialog
            }}
        />

        {/* Remove Order Dialog */}
        <RemoveOrderDialog
            isOpen={removeDialog.isOpen}
            orderId={removeDialog.orderId}
            onConfirm={handleRemoveConfirm}
            onCancel={handleRemoveCancel}
        />
      </div>
    </>
  );
};

// Helper function to get status icon
const getStatusIcon = (message) => {
  if (message.includes('processing')) return '🔄';
  if (message.includes('delivered') || message.includes('completed')) return '✅';
  if (message.includes('cancelled')) return '❌';
  return '📦';
};

// Add styles for the remove button
const styles = `
.btn-remove {
    background-color: #dc3545;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s;
}

.btn-remove:hover {
    background-color: #c82333;
}

.payment-selection .payment-options {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin: 1.5rem 0;
}

.payment-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 1rem;
    border: 2px solid #ddd;
    border-radius: 8px;
    background: white;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 1.1rem;
    width: 100%;
}

.payment-button:hover {
    border-color: #4CAF50;
    background: #f9f9f9;
}

.payment-button.khalti {
    background: #5C2D91;
    color: white;
    border: none;
}

.payment-button.khalti:hover {
    background: #4a2475;
}

.payment-button.cod {
    background: #fff;
    color: #333;
    border: 2px solid #4CAF50;
}

.payment-button.cod:hover {
    background: #4CAF50;
    color: white;
}

.cod-icon {
    font-size: 1.5rem;
}

.payment-button img {
    height: 24px;
    width: auto;
}

.dialog-content h2 {
    color: #4CAF50;
    margin-bottom: 1rem;
}

.dialog-button.confirm {
    background-color: #4CAF50;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s;
}

.dialog-button.confirm:hover {
    background-color: #45a049;
}
`;

export default OrderHistory;
