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
    fetchNotifications();
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const token = sessionStorage.getItem('authToken');
      if (!token) return;

      const response = await axios.get(
        'http://localhost:5000/api/orders/notifications',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
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
    // Ensure we have valid items
    if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
      console.warn('Order has no valid items for total calculation:', order.id);
      setOrderTotals(prev => ({
        ...prev,
        [order.id]: {
          subtotal: 0,
          vat: 0,
          total: 0
        }
      }));
      return;
    }

    // Log raw items for debugging
    console.log(`Calculating totals for order #${order.id}:`, order.items);

    // Calculate subtotal with exact decimal handling
    let subtotal = 0;
    order.items.forEach(item => {
      const price = Number(item.price || 0);
      const quantity = Number(item.quantity || 1);
      const itemTotal = price * quantity;
      console.log(`Item: ${item.name}, Price: ${price}, Quantity: ${quantity}, Total: ${itemTotal}`);
      subtotal += itemTotal;
    });
    
    // Ensure subtotal is properly rounded to 2 decimal places
    subtotal = Math.round(subtotal * 100) / 100;
    
    // Calculate VAT with exact decimal handling
    const vat = Math.round(subtotal * 0.13 * 100) / 100;
    
    // Calculate total with exact decimal handling
    const total = Math.round((subtotal + vat) * 100) / 100;

    console.log(`Order #${order.id} totals - Subtotal: ${subtotal}, VAT: ${vat}, Total: ${total}`);

    // Store with exact decimal places
    setOrderTotals(prev => ({
      ...prev,
      [order.id]: {
        subtotal: subtotal,
        vat: vat,
        total: total
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
        // Process orders to ensure proper status flags
        const processedOrders = response.data.orders.map(order => {
          // Ensure is_confirmed is properly set for paid orders
          const isConfirmed = 
            order.is_confirmed || 
            order.payment_status === 'paid' || 
            order.status !== 'pending';
          
          return {
            ...order,
            is_confirmed: isConfirmed,
            // Ensure status is at least 'processing' if paid
            status: order.payment_status === 'paid' && order.status === 'pending' 
              ? 'processing' 
              : order.status
          };
        });
        
        setOrders(processedOrders);
        // Calculate totals for each order
        processedOrders.forEach(order => calculateOrderTotals(order));
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

  // Add this function after handleKhaltiPayment
  const awardRewardPoints = async (orderId, orderAmount) => {
    try {
        const token = sessionStorage.getItem('authToken');
        if (!token) {
            console.error('No auth token found');
            return;
        }

        // Calculate reward points (1 point for every 10 rupees spent)
        const pointsToAward = Math.floor(orderAmount / 10);
        
        console.log('Awarding points:', {
            orderId,
            orderAmount,
            pointsToAward,
            token: token ? 'Token exists' : 'No token'
        });

        const response = await axios.post(
            'http://localhost:5000/api/rewards/add-points',
            {
                order_id: orderId,
                points_earned: pointsToAward
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('Reward points response:', response.data);

        if (response.data.success) {
            toast.success(`🎉 Earned ${pointsToAward} reward points!`);
            // Update the reward points display in the Greeting component
            const rewardEvent = new CustomEvent('rewardPointsUpdated');
            window.dispatchEvent(rewardEvent);
        }
    } catch (error) {
        console.error('Error awarding reward points:', error.response || error);
        toast.error('Failed to award reward points');
    }
};

  // Update the useEffect that handles Khalti return
  useEffect(() => {
    const handleKhaltiReturn = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('order_id');
        const pidx = urlParams.get('pidx') || sessionStorage.getItem('khalti_pidx');
        const paymentStatus = urlParams.get('status') || urlParams.get('payment_status');
        const type = urlParams.get('type');

        // Log all URL parameters for debugging
        console.log('URL parameters from Khalti return:', Object.fromEntries(urlParams.entries()));

        if (type !== 'order' || !orderId || !pidx || paymentStatus !== 'Completed') {
            console.log('Skipping Khalti return processing - missing required parameters');
            return;
        }

        // Get stored payment info
        const paymentInfoStr = sessionStorage.getItem('khalti_payment_info');
        console.log('Stored payment info:', paymentInfoStr);
        
        const paymentInfo = JSON.parse(paymentInfoStr || '{}');
        if (!paymentInfo.orderId || paymentInfo.orderId !== parseInt(orderId)) {
            toast.error('Invalid order information');
            console.error('Order ID mismatch:', { 
                storedOrderId: paymentInfo.orderId, 
                returnedOrderId: orderId 
            });
            return;
        }

        try {
            const token = sessionStorage.getItem('authToken');
            const loadingToast = toast.loading('Verifying payment...');

            console.log('Verifying Khalti payment:', {
                orderId,
                pidx,
                amount: paymentInfo.amount,
                storedRupees: paymentInfo.rupees,
                paymentInfo
            });

            // Verify payment with Khalti
            const verifyResponse = await axios.post(
                `http://localhost:5000/api/payment/khalti/verify`,
                {
                    pidx: pidx,
                    amount: paymentInfo.amount,
                    orderId: orderId
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('Khalti verification response:', verifyResponse.data);

            if (verifyResponse.data.success) {
                // Update order status
                const updateResponse = await axios.put(
                    `http://localhost:5000/api/orders/${orderId}/confirm`,
                    {
                        payment_method: 'khalti',
                        payment_status: 'paid',
                        status: 'processing',
                        transaction_id: pidx,
                        khalti_payment_idx: pidx,
                        amount_paid: paymentInfo.rupees,
                        is_confirmed: true
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                console.log('Order update response:', updateResponse.data);

                if (updateResponse.data.success) {
                    // Award reward points
                    await awardRewardPoints(orderId, paymentInfo.rupees);

                    // Update the order in local state to reflect the payment
                    setOrders(prevOrders => 
                        prevOrders.map(order => 
                            order.id === parseInt(orderId) 
                                ? { 
                                    ...order, 
                                    status: 'processing', 
                                    is_confirmed: true,
                                    payment_status: 'paid',
                                    payment_method: 'khalti',
                                    transaction_id: pidx,
                                    khalti_payment_idx: pidx 
                                } 
                                : order
                        )
                    );

                    // Clear all Khalti session data
                    sessionStorage.removeItem('khalti_payment_info');
                    sessionStorage.removeItem('khalti_pidx');
                    sessionStorage.removeItem('khalti_payment_amount');

                    // Navigate to invoice
                    navigate(`/invoice?order_id=${orderId}&pidx=${pidx}&payment_status=paid&transaction_id=${pidx}&type=order&amount=${paymentInfo.amount}`);
                    toast.dismiss(loadingToast);
                    toast.success('Payment successful! Generating invoice...');
                    
                    // Refresh orders
                    await fetchOrders();
                } else {
                    toast.dismiss(loadingToast);
                    toast.error('Failed to update order status');
                    console.error('Order update failed:', updateResponse.data);
                }
            } else {
                toast.dismiss(loadingToast);
                toast.error('Payment verification failed');
                console.error('Payment verification failed:', verifyResponse.data);
            }
        } catch (error) {
            console.error('Payment verification error:', error);
            console.error('Error details:', error.response?.data || 'No response data');
            toast.error('Payment verification failed. Please contact support if payment was deducted.');
        }
    };

    handleKhaltiReturn();
}, [navigate]);

  // Update handleConfirmOrder to include reward points for cash payments
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

            // If it's cash on delivery, show success dialog and award points
            if (paymentMethod === 'cash') {
                const order = orders.find(o => o.id === orderId);
                if (order) {
                    const orderTotal = orderTotals[orderId]?.total || 0;
                    await awardRewardPoints(orderId, orderTotal);
                }
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
        // Get exact amount from order total with proper decimal handling
        const orderTotal = orderTotals[order.id];
        
        if (!orderTotal || !orderTotal.total) {
            toast.error('Invalid order amount');
            console.error('Missing order total for order:', order.id);
            return;
        }
        
        // Get exact amount in rupees, properly rounded
        const orderAmount = Math.round(orderTotal.total * 100) / 100;
        
        console.log(`Order #${order.id} amount for payment:`, {
            orderTotal: orderTotal,
            roundedAmount: orderAmount
        });
        
        if (!orderAmount || isNaN(orderAmount) || orderAmount <= 0) {
            toast.error('Invalid order amount');
            console.error('Invalid order amount:', orderAmount);
            return;
        }

        // Convert to paisa (Khalti requires amount in paisa)
        const paisaAmount = Math.round(orderAmount * 100);

        // Log for detailed debugging
        console.log('Payment amounts:', {
            orderNumber: order.id,
            orderAmountRupees: orderAmount,
            paisaAmount: paisaAmount,
            rawOrderTotal: orderTotal.total
        });

        // Create payload - IMPORTANT: Khalti API expects amount in PAISA (not rupees)
        const payload = {
            return_url: `http://localhost:5173/payment/success?order_id=${order.id}&type=order`,
            website_url: "http://localhost:5173",
            amount: paisaAmount, // Send the amount in PAISA (not rupees)
            purchase_order_id: `order_${order.id}_${Date.now()}`,
            purchase_order_name: `Order #${order.id}`,
            customer_info: {
                name: sessionStorage.getItem('userName') || "Customer",
                email: sessionStorage.getItem('userEmail') || "",
                phone: order.contact_number || "9800000000"
            },
            amount_breakdown: [
                {
                    label: "Order Amount",
                    amount: paisaAmount // Send the amount in PAISA (not rupees)
                }
            ],
            product_details: order.items.map(item => {
                const itemPrice = Number(item.price || 0);
                const quantity = Number(item.quantity || 1);
                const itemTotal = itemPrice * quantity;
                
                // Convert to paisa for API
                const itemPricePaisa = Math.round(itemPrice * 100);
                const itemTotalPaisa = Math.round(itemTotal * 100);
                
                return {
                    identity: item.id || `item_${Date.now()}`,
                    name: item.name,
                    total_price: itemTotalPaisa, // Send the amount in PAISA (not rupees)
                    quantity: quantity,
                    unit_price: itemPricePaisa // Send the amount in PAISA (not rupees)
                };
            })
        };

        // Store payment info (in rupees for UI display)
        const paymentInfo = {
            orderId: order.id,
            amount: paisaAmount, // Store in paisa for verification
            rupees: orderAmount, // Store in rupees for display
            items: order.items.map(item => ({
                name: item.name,
                quantity: Number(item.quantity || 1),
                price: Number(item.price || 0)
            }))
        };

        // Store payment info in session storage
        sessionStorage.setItem('khalti_payment_info', JSON.stringify(paymentInfo));
        sessionStorage.setItem('khalti_payment_amount', orderAmount.toString());

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

        if (response.data?.data?.payment_url) {
            if (response.data.data.pidx) {
                sessionStorage.setItem('khalti_pidx', response.data.data.pidx);
            }
            toast.success(`Initiating payment for Rs. ${orderAmount.toFixed(2)}`);
            window.location.href = response.data.data.payment_url;
        } else {
            console.error('Invalid Khalti response:', response.data);
            toast.error('Failed to initiate payment. Please try again.');
        }
    } catch (error) {
        console.error('Error initiating Khalti payment:', error);
        console.error('Error details:', error.response?.data || 'No response data');
        toast.error('Failed to initiate payment. Please try again.');
    }
  };

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
            const cancelledPoints = cancelResponse.data.cancelledPoints || 0;
            const pointsMessage = cancelledPoints > 0 
                ? `\n${cancelledPoints} reward points earned from this order have been cancelled.`
                : '\nNo reward points were earned from this order.';

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
                        // Show success dialog with refund and reward points information
                        setSuccessDialog({
                            isOpen: true,
                            message: `Order #${order.id} has been cancelled. A refund of ${formatCurrency(orderTotals[order.id]?.total)} will be processed to your Khalti account within 3-5 business days.${pointsMessage}`
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
                            message: `Order #${order.id} has been cancelled. However, there was an issue processing your refund. Our team will contact you shortly.${pointsMessage}`
                        });
                        toast.dismiss(loadingToastId);
                    }
                } catch (refundError) {
                    console.error('Refund error:', refundError);
                    setSuccessDialog({
                        isOpen: true,
                        message: `Order #${order.id} has been cancelled. There was an error processing your refund. Our support team has been notified and will assist you shortly.${pointsMessage}`
                    });
                    toast.dismiss(loadingToastId);
                }
            } else {
                // For non-Khalti payments or pending payments
                if (order.payment_method === 'khalti' && order.payment_status === 'pending') {
                    setSuccessDialog({
                        isOpen: true,
                        message: `Order cancelled successfully. Refund will be sent to your Khalti account within 3-5 days.${pointsMessage}`
                    });
                    toast.success('Order cancelled successfully', { id: loadingToastId });
                } else if (order.payment_method === 'cash') {
                    setSuccessDialog({
                        isOpen: true,
                        message: `Order cancelled successfully.${pointsMessage}`
                    });
                    toast.success('Order cancelled successfully', { id: loadingToastId });
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
    // First check if payment is already completed or order is confirmed
    const isPaymentCompleted = order.payment_status === 'paid';
    const isOrderConfirmed = order.is_confirmed || order.status !== 'pending';
    
    // Log for debugging
    console.log('Order action checks:', {
      orderId: order.id,
      status: order.status,
      payment_status: order.payment_status,
      is_confirmed: order.is_confirmed,
      shouldShowConfirmButton: order.status === 'pending' && !isOrderConfirmed && !isPaymentCompleted
    });
    
    return (
        <div className="order-actions">
            {/* Only show confirm button if order is pending, not confirmed and not paid */}
            {order.status === 'pending' && !isOrderConfirmed && !isPaymentCompleted && (
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
            {/* Only show delete button if order is pending, not confirmed and not paid */}
            {order.status === 'pending' && !isOrderConfirmed && !isPaymentCompleted && (
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
        
        {/* Notifications Section */}
        <div className="notifications-section">
          <h2>Notifications</h2>
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <p className="no-notifications">No notifications</p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}
                  onClick={() => markNotificationAsRead(notification.id)}
                >
                  <div className="notification-icon">
                    {getStatusIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <p className="notification-message">{notification.message}</p>
                    <p className="notification-time">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

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
                        
                        {/* Show bundle items if this is a bundle */}
                        {item.is_bundle && Array.isArray(item.bundle_items) && item.bundle_items.length > 0 && (
                          <div className="bundle-items-container">
                            <div className="bundle-items-label">Included Items:</div>
                            {item.bundle_items.map((bundleItem, bidx) => (
                              <div key={`bundle-${index}-${bidx}`} className="bundle-item">
                                <span>{bundleItem.name}</span>
                                <span>x{bundleItem.quantity}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* If there's a description, show it */}
                        {item.description && (
                          <div className="item-description">
                            {item.description}
                          </div>
                        )}
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
              preOrders.length === 0 ? (
                <div className="no-orders-container">
                  <h2>No Pre-Orders Found</h2>
                  <p className="no-orders-subtitle">You haven't scheduled any pre-orders yet.</p>
                </div>
              ) : (
                preOrders.map((order) => {
                  // Robust parsing for items
                  let parsedItems = [];
                  try {
                    if (typeof order.items === 'string' && order.items.trim() !== '') {
                      parsedItems = JSON.parse('[' + order.items + ']');
                    } else if (Array.isArray(order.items)) {
                      parsedItems = order.items;
                    }
                  } catch (e) {
                    console.error('Failed to parse items for order', order.id, order.items, e);
                    parsedItems = [];
                  }

                  return (
                    <div key={order.id} className="order-card">
                      <div className="order-header">
                        <h3>Pre-Order #{order.id}</h3>
                        <span className={`status-badge ${getStatusColor(order.order_status || 'pending')}`}>
                          {(order.order_status || 'pending').charAt(0).toUpperCase() + (order.order_status || 'pending').slice(1)}
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
                        {Array.isArray(parsedItems) && parsedItems.length > 0 ? (
                          parsedItems.map((item, index) => (
                            <div key={index} className="order-item">
                              <div className="item-info">
                                <span className="item-name">{item.name}</span>
                                <span className="item-quantity">x{item.quantity}</span>
                              </div>
                              <span className="item-price">Rs. {item.price * item.quantity}</span>
                            </div>
                          ))
                        ) : (
                          <p className="no-items">No items found in this order</p>
                        )}
                      </div>

                      <div className="order-summary">
                        <div className="summary-row total">
                          <span>Total Amount:</span>
                          <span>
                            {Array.isArray(parsedItems)
                              ? `Rs. ${parsedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}`
                              : 'Rs. 0.00'}
                          </span>
                        </div>
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
              )
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
const getStatusIcon = (type) => {
  switch (type) {
    case 'order_status':
      return '📦';
    case 'order_confirmation':
      return '✅';
    case 'order_cancelled':
      return '❌';
    case 'delivery':
      return '🚚';
    default:
      return '📢';
  }
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
