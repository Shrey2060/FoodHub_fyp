import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { getStatusColor } from '../utils/statusUtils';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('products');
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [users, setUsers] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [preOrders, setPreOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [orderFilter, setOrderFilter] = useState('all');
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        image_url: ''
    });

    const [editingProductId, setEditingProductId] = useState(null);
    const [editingUser, setEditingUser] = useState(null);
    const [productDeleteDialog, setProductDeleteDialog] = useState({
        isOpen: false,
        productId: null,
        productName: ''
    });

    const [userFormData, setUserFormData] = useState({
        name: '',
        email: '',
        role: '',
        password: ''
    });

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderFormData, setOrderFormData] = useState({
        status: '',
        contact_number: '',
        payment_method: '',
        delivery_address: '',
        payment_status: ''
    });

    // Add state for delete dialogs
    const [deleteDialog, setDeleteDialog] = useState({
        isOpen: false,
        orderId: null,
        orderDetails: null
    });

    // Add state for user delete dialog
    const [userDeleteDialog, setUserDeleteDialog] = useState({
        isOpen: false,
        userId: null,
        userDetails: null
    });

    // Add state for subscription management
    const [userSubscriptions, setUserSubscriptions] = useState({});

    // Helper function to format currency in Nepali Rupees
    const formatCurrency = (amount) => {
        return `Rs. ${Number(amount || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    };

    const fetchOrders = async () => {
        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) {
                console.error('No authentication token found');
                toast.error('Authentication required');
                return;
            }

            const response = await axios.get('http://localhost:5000/api/orders/admin/all', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('Orders response:', response.data);
            setOrders(response.data.orders || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    const fetchPreOrders = async () => {
        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) {
                console.error('No authentication token found');
                toast.error('Authentication required');
                return;
            }

            const response = await axios.get('http://localhost:5000/api/pre-orders/admin', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Pre-orders response:', response.data);

            if (response.data.success && response.data.pre_orders) {
                const formattedPreOrders = response.data.pre_orders.map(order => ({
                    ...order,
                    items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items
                }));
                setPreOrders(formattedPreOrders);
            } else {
                console.error('Invalid response format:', response.data);
                toast.error('Failed to load pre-orders');
            }
        } catch (error) {
            console.error('Error fetching pre-orders:', error);
            toast.error(error.response?.data?.message || 'Failed to fetch pre-orders');
        }
    };

    useEffect(() => {
        console.log('Component mounted, checking auth...');
        const token = sessionStorage.getItem('authToken');
        const userRole = sessionStorage.getItem('userRole');
        
        // Add detailed logging
        console.log('Auth Check Details:', {
            token: token ? 'Token exists' : 'No token',
            tokenValue: token,
            userRole: userRole,
            condition: !token || userRole !== 'admin',
        });
        
        if (!token || userRole !== 'admin') {
            console.log('Unauthorized access, redirecting to login');
            console.log('Token:', token);
            console.log('User Role:', userRole);
            sessionStorage.clear();
            navigate('/login', { replace: true });
            return;
        }
        
        console.log('Authentication successful, fetching data...');
        fetchData();
    }, [navigate]);

    useEffect(() => {
        if (activeTab === 'orders') {
            fetchOrders();
        } else if (activeTab === 'pre-orders') {
            fetchPreOrders();
        } else {
            fetchData();
        }
    }, [activeTab]);

    const fetchData = async () => {
        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) {
                console.error('No authentication token found');
                toast.error('Authentication required');
                return;
            }

            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            if (activeTab === 'products') {
                const response = await axios.get('http://localhost:5000/api/admin/products', { headers });
                console.log('Products response:', response.data);
                console.log('Products array:', response.data.products);
                const productsData = response.data.products || [];
                console.log('Setting products state with:', productsData);
                setProducts(productsData);
            } else if (activeTab === 'users') {
                const response = await axios.get('http://localhost:5000/api/auth/admin/users', { headers });
                console.log('Users response:', response.data);
                setUsers(response.data.users || []);
                
                // Fetch subscriptions for each user
                const subsResponse = await axios.get('http://localhost:5000/api/subscription/admin/subscriptions', { headers });
                console.log('Subscriptions response:', subsResponse.data);
                
                if (subsResponse.data.success) {
                    const subscriptionMap = {};
                    subsResponse.data.subscriptions.forEach(sub => {
                        subscriptionMap[sub.user_id] = sub;
                    });
                    setUserSubscriptions(subscriptionMap);
                    setSubscriptions(subsResponse.data.subscriptions);
                }
            } else if (activeTab === 'subscriptions') {
                const response = await axios.get('http://localhost:5000/api/subscriptions/admin/subscriptions', { headers });
                console.log('Subscriptions response:', response.data);
                if (response.data.success) {
                    setSubscriptions(response.data.subscriptions);
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const token = sessionStorage.getItem('authToken');
            await axios.put(
                `http://localhost:5000/api/admin/orders/${orderId}`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Order status updated successfully');
            fetchData();
        } catch (error) {
            toast.error('Failed to update order status');
            console.error('Error updating order:', error);
        }
    };

    const handleProductChange = (e) => {
        const { name, value } = e.target;
        if (name === 'price') {
            // Convert price to a number with 2 decimal places
            const numericValue = parseFloat(value).toFixed(2);
            setFormData(prev => ({
                ...prev,
                [name]: isNaN(numericValue) ? '' : Number(numericValue)
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            const productData = {
                ...formData,
                price: Number(parseFloat(formData.price).toFixed(2))
            };

            await axios.post('http://localhost:5000/api/admin/products', productData, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            fetchData();
            setFormData({
                name: '',
                description: '',
                price: '',
                category: '',
                image_url: ''
            });
            toast.success('Product created successfully');
        } catch (err) {
            console.error('Error creating product:', err);
            toast.error('Failed to create product');
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!selectedProduct) return;

        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            const productData = {
                ...formData,
                price: Number(parseFloat(formData.price).toFixed(2))
            };

            await axios.put(`http://localhost:5000/api/admin/products/${selectedProduct.id}`, productData, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            fetchData();
            setSelectedProduct(null);
            setFormData({
                name: '',
                description: '',
                price: '',
                category: '',
                image_url: ''
            });
            toast.success('Product updated successfully');
        } catch (err) {
            console.error('Error updating product:', err);
            toast.error('Failed to update product');
        }
    };

    const handleDelete = (productId, productName) => {
        console.log('handleDelete called with:', { productId, productName });
        
        if (!productId) {
            console.error('No product ID provided');
            toast.error('Cannot delete product: Invalid ID');
            return;
        }

        // Set the dialog state with the product info
        setDeleteDialog({
            isOpen: true,
            orderId: productId,
            orderDetails: { name: productName }
        });
        console.log('Delete dialog set for product:', { productId, productName });
    };

    const confirmDelete = async () => {
        const { orderId: productId } = deleteDialog;
        console.log('Confirming delete for product:', { productId });

        if (!productId) {
            console.error('Product ID is missing');
            toast.error('Cannot delete: No product selected');
            return;
        }

        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) {
                throw new Error('Authentication required');
            }

            console.log(`Deleting product ${productId}`);
            const response = await axios.delete(
                `http://localhost:5000/api/admin/products/${productId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log('Server response:', response);

            if (response.status === 200) {
                toast.success('Product deleted successfully');
                await fetchData(); // Refresh the product list
            } else {
                throw new Error('Server returned an unexpected status');
            }
        } catch (error) {
            console.error('Failed to delete product:', error);
            toast.error(error.message || 'Failed to delete product');
        } finally {
            // Close the dialog
            setDeleteDialog({
                isOpen: false,
                orderId: null,
                orderDetails: null
            });
        }
    };

    const handleEdit = (product) => {
        setSelectedProduct(product);
        setFormData({
            name: product.name,
            description: product.description,
            price: Number(parseFloat(product.price).toFixed(2)), // Ensure price is a number with 2 decimals
            category: product.category_name,
            image_url: product.image_url
        });
    };

    const handleLogout = () => {
        sessionStorage.clear();
        navigate('/login', { replace: true });
    };

    const updateUserStatus = async (userId, isActive) => {
        try {
            const token = sessionStorage.getItem('authToken');
            await axios.put(
                `http://localhost:5000/api/admin/users/${userId}`,
                { is_active: isActive },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
            fetchData();
        } catch (error) {
            toast.error('Failed to update user status');
            console.error('Error updating user:', error);
        }
    };

    const cancelSubscription = async (subscriptionId) => {
        if (window.confirm('Are you sure you want to cancel this subscription?')) {
            try {
                const token = sessionStorage.getItem('authToken');
                await axios.put(
                    `http://localhost:5000/api/admin/subscriptions/${subscriptionId}/cancel`,
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                toast.success('Subscription cancelled successfully');
                fetchData();
            } catch (error) {
                toast.error('Failed to cancel subscription');
                console.error('Error cancelling subscription:', error);
            }
        }
    };

    const filteredOrders = orders.filter(order => {
        if (orderFilter === 'all') return true;
        return order.status === orderFilter;
    });

    const handleOrderEdit = (order) => {
        setSelectedOrder(order);
        setOrderFormData({
            status: order.status,
            contact_number: order.contact_number,
            payment_method: order.payment_method,
            delivery_address: order.delivery_address,
            payment_status: order.payment_status
        });
    };

    const handleOrderUpdate = async (e) => {
        e.preventDefault();
        try {
            const token = sessionStorage.getItem('authToken');
            const response = await axios.put(
                `http://localhost:5000/api/admin/orders/${selectedOrder.id}`,
                {
                    ...orderFormData,
                    order_id: selectedOrder.id
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                toast.success('Order updated successfully');
                setSelectedOrder(null);
                setOrderFormData({
                    status: '',
                    contact_number: '',
                    payment_method: '',
                    delivery_address: '',
                    payment_status: ''
                });
                await fetchOrders();
            } else {
                toast.error(response.data.message || 'Failed to update order');
            }
        } catch (error) {
            console.error('Error updating order:', error);
            toast.error(error.response?.data?.message || 'Failed to update order');
        }
    };

    const handleOrderDelete = async (order) => {
        if (!order || !order.id) {
            toast.error('Invalid order selected');
            return;
        }
        
        setDeleteDialog({
            isOpen: true,
            orderId: order.id,
            orderDetails: order
        });
    };

    const handleOrderFormChange = (e) => {
        const { name, value } = e.target;
        setOrderFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const DeleteConfirmationDialog = () => {
        if (!deleteDialog.isOpen) return null;

        return (
            <div className="dialog-overlay">
                <div className="dialog-content">
                    <h2>Delete Order</h2>
                    <p>Are you sure you want to delete Order #{deleteDialog.orderId}?</p>
                    {deleteDialog.orderDetails && (
                        <div className="order-summary">
                            <p><strong>Status:</strong> {deleteDialog.orderDetails.status}</p>
                            <p><strong>Payment Method:</strong> {deleteDialog.orderDetails.payment_method}</p>
                            <p><strong>Total Amount:</strong> {formatCurrency(deleteDialog.orderDetails.total_amount)}</p>
                        </div>
                    )}
                    <p className="warning-text">This action cannot be undone!</p>
                    <div className="dialog-buttons">
                        <button 
                            className="dialog-button cancel"
                            onClick={() => setDeleteDialog({ isOpen: false, orderId: null, orderDetails: null })}
                        >
                            Cancel
                        </button>
                        <button 
                            className="dialog-button delete"
                            onClick={confirmDelete}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const handleUserEdit = (user) => {
        setEditingUser(user);
        setUserFormData({
            name: user.name,
            email: user.email,
            role: user.role,
            password: '' // Password field will be empty when editing
        });
    };

    const handleUserFormChange = (e) => {
        const { name, value } = e.target;
        setUserFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleUserUpdate = async (e) => {
        e.preventDefault();
        try {
            const token = sessionStorage.getItem('authToken');
            const response = await axios.put(
                `http://localhost:5000/api/admin/edit-user/${editingUser.id}`,
                {
                    name: userFormData.name,
                    email: userFormData.email,
                    role: userFormData.role,
                    password: userFormData.password || undefined // Only send password if it's not empty
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                toast.success('User updated successfully');
                setEditingUser(null);
                setUserFormData({
                    name: '',
                    email: '',
                    role: '',
                    password: ''
                });
                // Refresh the users list
                const usersResponse = await axios.get('http://localhost:5000/api/admin/users', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (usersResponse.data.success) {
                    setUsers(usersResponse.data.users);
                }
            } else {
                toast.error(response.data.message || 'Failed to update user');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            toast.error(error.response?.data?.message || 'Failed to update user');
        }
    };

    const handleUserDelete = (user) => {
        setUserDeleteDialog({
            isOpen: true,
            userId: user.id,
            userDetails: user
        });
    };

    const confirmUserDelete = async () => {
        try {
            const token = sessionStorage.getItem('authToken');
            const response = await axios.delete(
                `http://localhost:5000/api/admin/users/${userDeleteDialog.userId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                toast.success('User deleted successfully');
                setUsers(prevUsers => 
                    prevUsers.filter(user => user.id !== userDeleteDialog.userId)
                );
            } else {
                toast.error(response.data.message || 'Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            toast.error(error.response?.data?.message || 'Failed to delete user');
        } finally {
            setUserDeleteDialog({
                isOpen: false,
                userId: null,
                userDetails: null
            });
        }
    };

    const UserDeleteConfirmationDialog = () => {
        if (!userDeleteDialog.isOpen) return null;

        return (
            <div className="dialog-overlay">
                <div className="dialog-content">
                    <h2>Delete User</h2>
                    <p>Are you sure you want to delete this user?</p>
                    {userDeleteDialog.userDetails && (
                        <div className="user-summary">
                            <p><strong>Name:</strong> {userDeleteDialog.userDetails.name}</p>
                            <p><strong>Email:</strong> {userDeleteDialog.userDetails.email}</p>
                            <p><strong>Role:</strong> {userDeleteDialog.userDetails.role}</p>
                        </div>
                    )}
                    <p className="warning-text">This action cannot be undone!</p>
                    <div className="dialog-buttons">
                        <button 
                            className="dialog-button cancel"
                            onClick={() => setUserDeleteDialog({ isOpen: false, userId: null, userDetails: null })}
                        >
                            Cancel
                        </button>
                        <button 
                            className="dialog-button delete"
                            onClick={confirmUserDelete}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleCancelSubscription = async (subscriptionId) => {
        if (!subscriptionId) {
            toast.error('Invalid subscription ID');
            return;
        }

        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            console.log('Cancelling subscription with ID:', subscriptionId);

            const response = await axios.put(
                `http://localhost:5000/api/subscriptions/admin/${subscriptionId}/cancel`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                toast.success('Subscription cancelled successfully');
                fetchData(); // Refresh the subscriptions list
            } else {
                toast.error(response.data.message || 'Failed to cancel subscription');
            }
        } catch (error) {
            console.error('Error cancelling subscription:', error);
            toast.error(error.response?.data?.message || 'Failed to cancel subscription');
        }
    };

    const handleDeleteSubscription = async (subscriptionId) => {
        if (!subscriptionId) {
            toast.error('Invalid subscription ID');
            return;
        }

        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            console.log('Deleting subscription with ID:', subscriptionId);

            const response = await axios.delete(
                `http://localhost:5000/api/subscriptions/admin/${subscriptionId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                toast.success('Subscription deleted successfully');
                // Update the subscriptions list directly
                setSubscriptions(prevSubscriptions => 
                    prevSubscriptions.filter(sub => sub.id !== subscriptionId)
                );
            } else {
                toast.error(response.data.message || 'Failed to delete subscription');
            }
        } catch (error) {
            console.error('Error deleting subscription:', error);
            toast.error(error.response?.data?.message || 'Failed to delete subscription');
        }
    };

    const handleUpdatePreOrderStatus = async (orderId, newStatus) => {
        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            const response = await axios.patch(
                `http://localhost:5000/api/pre-orders/${orderId}/status`,
                { status: newStatus },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                toast.success(`Status updated to ${newStatus}`);
                fetchPreOrders();
            } else {
                toast.error(response.data.message || 'Failed to update status');
            }
        } catch (error) {
            console.error('Error updating pre-order status:', error);
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    const handleDeletePreOrder = async (orderId) => {
        if (!orderId) {
            toast.error('Invalid pre-order ID');
            return;
        }

        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            console.log('Deleting pre-order with ID:', orderId); // Debug log

            const response = await axios.delete(`http://localhost:5000/api/pre-orders/admin/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success) {
                toast.success('Pre-order deleted successfully');
                fetchPreOrders();
            } else {
                toast.error(response.data.message || 'Failed to delete pre-order');
            }
        } catch (error) {
            console.error('Error deleting pre-order:', error);
            toast.error(error.response?.data?.message || 'Failed to delete pre-order');
        }
    };

    if (loading) {
        console.log('Rendering loading state');
        return (
            <div className="admin-dashboard loading">
                <h2>Loading...</h2>
            </div>
        );
    }

    if (error) {
        console.log('Rendering error state:', error);
        return (
            <div className="admin-dashboard error">
                <h2>Error</h2>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <header className="admin-header">
                <h1>Admin Dashboard</h1>
                <div className="admin-actions">
                    <button onClick={() => navigate('/home')} className="home-button">Back to Home</button>
                    <button onClick={handleLogout} className="logout-button">Logout</button>
                </div>
            </header>

            <nav className="admin-nav">
                <button className={`nav-button ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>Products</button>
                <button className={`nav-button ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>Orders</button>
                <button className={`nav-button ${activeTab === 'pre-orders' ? 'active' : ''}`} onClick={() => setActiveTab('pre-orders')}>Pre-Orders</button>
                <button className={`nav-button ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Users</button>
                <button className={`nav-button ${activeTab === 'subscriptions' ? 'active' : ''}`} onClick={() => setActiveTab('subscriptions')}>Subscriptions</button>
            </nav>

            <main className="admin-content">
                {/* Main content */}
                {error && <div className="error-message">{error}</div>}

                {activeTab === 'pre-orders' && (
                    <div className="pre-orders-section">
                        <h2>Pre-Orders Management</h2>
                        <div className="pre-orders-list">
                            {preOrders.length === 0 ? (
                                <div className="no-pre-orders">
                                    <p>No pre-orders found.</p>
                                </div>
                            ) : (
                                preOrders.map((order) => (
                                    <div key={`pre-order-${order.id}`} className="order-card">
                                        <div className="order-header">
                                            <h3>Pre-Order #{order.id}</h3>
                                            <span className={`status ${getStatusColor(order.order_status || 'pending')}`}>
                                                {order.order_status || 'pending'}
                                            </span>
                                        </div>
                                        <div className="order-details">
                                            <p><strong>Customer:</strong> {order.customer_name}</p>
                                            <p><strong>Contact:</strong> {order.contact_number}</p>
                                            <p><strong>Scheduled Date:</strong> {new Date(order.scheduled_date).toLocaleDateString()}</p>
                                            <p><strong>Delivery Time:</strong> {order.delivery_time}</p>
                                            <p><strong>Delivery Address:</strong> {order.delivery_address}</p>
                                            {order.special_instructions && (
                                                <p><strong>Special Instructions:</strong> {order.special_instructions}</p>
                                            )}
                                        </div>
                                        <div className="pre-order-items">
                                            <h4>Order Items:</h4>
                                            {order.items.map((item, index) => (
                                                <div key={`item-${order.id}-${index}`} className="order-item">
                                                    <span>{item.name}</span>
                                                    <span>x{item.quantity}</span>
                                                    <span>{formatCurrency(item.price * item.quantity)}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="pre-order-actions">
                                            <select
                                                value={order.order_status}
                                                onChange={(e) => handleUpdatePreOrderStatus(order.id, e.target.value)}
                                                className="status-select"
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="confirmed">Confirmed</option>
                                                <option value="preparing">Preparing</option>
                                                <option value="ready">Ready</option>
                                                <option value="delivered">Delivered</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                            <button
                                                className="delete-button"
                                                onClick={() => {
                                                    console.log('Delete button clicked for order:', order); // Debug log
                                                    handleDeletePreOrder(order.id);
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'products' && (
                    <div className="products-section">
                        <h2>Manage Products</h2>
                        <div className="product-form">
                            <h2>{selectedProduct ? 'Edit Product' : 'Add New Product'}</h2>
                            <form onSubmit={selectedProduct ? handleUpdate : handleCreate}>
                                <div className="form-group">
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="Product Name"
                                        value={formData.name}
                                        onChange={handleProductChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <textarea
                                        name="description"
                                        placeholder="Product Description"
                                        value={formData.description}
                                        onChange={handleProductChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <input
                                        type="number"
                                        name="price"
                                        placeholder="Price"
                                        value={formData.price}
                                        onChange={handleProductChange}
                                        required
                                        step="0.01"
                                        min="0"
                                        className="price-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleProductChange}
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        <option value="Starters">Starters</option>
                                        <option value="Main Course">Main Course</option>
                                        <option value="Desserts">Desserts</option>
                                        <option value="Beverages">Beverages</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <input
                                        type="text"
                                        name="image_url"
                                        placeholder="Image URL"
                                        value={formData.image_url}
                                        onChange={handleProductChange}
                                        required
                                    />
                                </div>
                                <button type="submit">
                                    {selectedProduct ? 'Update Product' : 'Add Product'}
                                </button>
                                {selectedProduct && (
                                    <button type="button" onClick={() => {
                                        setSelectedProduct(null);
                                        setFormData({
                                            name: '',
                                            description: '',
                                            price: '',
                                            category: '',
                                            image_url: ''
                                        });
                                    }}>
                                        Cancel Edit
                                    </button>
                                )}
                            </form>
                        </div>
                        <div className="products-grid">
                            {console.log('Rendering products:', products)}
                            {products && products.map(product => {
                                console.log('Rendering product:', product);
                                return (
                                    <div key={product.id} className="product-card">
                                        <img src={product.image_url || '/default.jpg'} alt={product.name} />
                                        <h3>{product.name}</h3>
                                        <p>{formatCurrency(product.price)}</p>
                                        <div className="product-actions">
                                            <button onClick={() => {
                                                console.log('Edit button clicked for product:', product);
                                                handleEdit(product);
                                            }}>Edit</button>
                                            <button 
                                                className="delete-button"
                                                onClick={() => {
                                                    console.log('Delete clicked for product:', product);
                                                    handleDelete(product.id, product.name);
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {/* Product Delete Confirmation Dialog */}
                        {productDeleteDialog.isOpen && (
                            <div className="delete-dialog-overlay">
                                <div className="delete-dialog">
                                    <h3>Confirm Delete</h3>
                                    <p>Are you sure you want to delete "{productDeleteDialog.productName}"?</p>
                                    <p className="warning-text">This action cannot be undone.</p>
                                    <div className="dialog-buttons">
                                        <button 
                                            className="cancel-button"
                                            onClick={() => setProductDeleteDialog(prev => ({
                                                ...prev,
                                                isOpen: false
                                            }))}
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            className="delete-button"
                                            onClick={() => {
                                                console.log('Delete button clicked, productId:', productDeleteDialog.productId);
                                                confirmDelete();
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className="orders-section">
                        <h2>Orders Management</h2>
                        
                        {/* Order Filters */}
                        <div className="order-filters">
                            <select 
                                value={orderFilter} 
                                onChange={(e) => setOrderFilter(e.target.value)}
                                className="status-filter"
                            >
                                <option value="all">All Orders</option>
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                        
                        {/* Order Edit Form */}
                        {selectedOrder && (
                            <form onSubmit={handleOrderUpdate} className="order-form">
                                <h3>Edit Order #{selectedOrder.id}</h3>
                                <div className="form-group">
                                    <label>Status:</label>
                                    <select
                                        name="status"
                                        value={orderFormData.status}
                                        onChange={(e) => setOrderFormData({...orderFormData, status: e.target.value})}
                                        required
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="processing">Processing</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Contact Number:</label>
                                    <input
                                        type="text"
                                        name="contact_number"
                                        value={orderFormData.contact_number}
                                        onChange={(e) => setOrderFormData({...orderFormData, contact_number: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Payment Method:</label>
                                    <select
                                        name="payment_method"
                                        value={orderFormData.payment_method}
                                        onChange={(e) => setOrderFormData({...orderFormData, payment_method: e.target.value})}
                                        required
                                    >
                                        <option value="">Select Payment Method</option>
                                        <option value="cash">Cash</option>
                                        <option value="card">Card</option>
                                        <option value="khalti">Khalti</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Delivery Address:</label>
                                    <textarea
                                        name="delivery_address"
                                        value={orderFormData.delivery_address}
                                        onChange={(e) => setOrderFormData({...orderFormData, delivery_address: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-actions">
                                    <button type="submit" className="btn-save">Save Changes</button>
                                    <button 
                                        type="button" 
                                        className="btn-cancel"
                                        onClick={() => {
                                            setSelectedOrder(null);
                                            setOrderFormData({
                                                status: '',
                                                contact_number: '',
                                                payment_method: '',
                                                delivery_address: '',
                                                payment_status: ''
                                            });
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Orders List */}
                        <div className="orders-list">
                            {filteredOrders.map((order) => (
                                <div key={order.id} className={`order-card status-${order.status}`}>
                                    <div className="order-header">
                                        <h3>Order #{order.id}</h3>
                                        <span className={`status-badge ${order.status}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <div className="order-details">
                                        <p><strong>Customer:</strong> {order.customer_name}</p>
                                        <p><strong>Contact:</strong> {order.contact_number}</p>
                                        <p><strong>Payment Method:</strong> 
                                            <span className={`payment-method-badge ${order.payment_method.toLowerCase() === 'khalti' ? 'khalti' : 'cash'}`}>
                                                {order.payment_method.toLowerCase() === 'khalti' ? 'Khalti' : 'Cash on Delivery'}
                                            </span>
                                        </p>
                                        <p><strong>Address:</strong> {order.delivery_address}</p>
                                        <p><strong>Total:</strong> {formatCurrency(order.total_amount)}</p>
                                        <p><strong>Date:</strong> {new Date(order.created_at).toLocaleString()}</p>
                                    </div>
                                    <div className="order-items">
                                        <h4>Order Items:</h4>
                                        {order.items && order.items.map((item, index) => (
                                            <div key={index} className="order-item">
                                                <span>{item.name}</span>
                                                <span>x{item.quantity}</span>
                                                <span>{formatCurrency(item.price)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="order-actions">
                                        <button 
                                            className="btn-edit"
                                            onClick={() => handleOrderEdit(order)}
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            className="btn-delete"
                                            onClick={() => handleOrderDelete(order)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="users-section">
                        <h2>Manage Users</h2>
                        
                        {/* User Edit Form */}
                        {editingUser && (
                            <div className="edit-form-container">
                                <form onSubmit={handleUserUpdate} className="user-form">
                                    <h3>Edit User</h3>
                                    <div className="form-group">
                                        <label>Name:</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={userFormData.name}
                                            onChange={handleUserFormChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Email:</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={userFormData.email}
                                            onChange={handleUserFormChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Role:</label>
                                        <select
                                            name="role"
                                            value={userFormData.role}
                                            onChange={handleUserFormChange}
                                            required
                                        >
                                            <option value="">Select Role</option>
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>New Password:</label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={userFormData.password}
                                            onChange={handleUserFormChange}
                                            placeholder="Leave blank to keep current password"
                                        />
                                    </div>
                                    <div className="form-actions">
                                        <button type="submit" className="btn-save">Save Changes</button>
                                        <button 
                                            type="button" 
                                            className="btn-cancel"
                                            onClick={() => {
                                                setEditingUser(null);
                                                setUserFormData({
                                                    name: '',
                                                    email: '',
                                                    role: '',
                                                    password: ''
                                                });
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Users List */}
                        <div className="users-list">
                            {users.map(user => (
                                <div key={user.id} className="user-card">
                                    <div className="user-info">
                                        <h3>{user.name}</h3>
                                        <p>{user.email}</p>
                                        <p>Role: {user.role}</p>
                                        <p>Status: {user.is_active ? 'Active' : 'Inactive'}</p>
                                        
                                        {/* Subscription Information */}
                                        {userSubscriptions[user.id] && (
                                            <div className="subscription-info">
                                                <h4>Subscription Details</h4>
                                                <p><strong>Plan:</strong> {userSubscriptions[user.id].type}</p>
                                                <p><strong>Status:</strong> {userSubscriptions[user.id].status}</p>
                                                <p><strong>Start Date:</strong> {new Date(userSubscriptions[user.id].start_date).toLocaleDateString()}</p>
                                                <p><strong>Next Billing:</strong> {new Date(userSubscriptions[user.id].next_billing_date).toLocaleDateString()}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="user-actions">
                                        <button
                                            className="btn-edit"
                                            onClick={() => handleUserEdit(user)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="btn-delete"
                                            onClick={() => handleUserDelete(user)}
                                        >
                                            Delete
                                        </button>
                                        <button
                                            onClick={() => updateUserStatus(user.id, !user.is_active)}
                                            className={user.is_active ? 'deactivate' : 'activate'}
                                        >
                                            {user.is_active ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'subscriptions' && (
                    <div className="subscriptions-section">
                        <h2>Subscriptions Management</h2>
                        <div className="subscriptions-list">
                            {subscriptions.length === 0 ? (
                                <div className="no-subscriptions">
                                    <p>No subscriptions found.</p>
                                </div>
                            ) : (
                                subscriptions.map((subscription) => (
                                    <div key={`subscription-${subscription.id}`} className="subscription-card">
                                        <div className="subscription-header">
                                            <h3>Subscription #{subscription.id}</h3>
                                            <span className={`status ${getStatusColor(subscription.status || 'active')}`}>
                                                {subscription.status || 'active'}
                                            </span>
                                        </div>
                                        <div className="subscription-details">
                                            <p><strong>User:</strong> {subscription.user_name}</p>
                                            <p><strong>Plan:</strong> {subscription.plan_name}</p>
                                            <p><strong>Price:</strong> {formatCurrency(subscription.price)}</p>
                                            <p><strong>Start Date:</strong> {new Date(subscription.start_date).toLocaleDateString()}</p>
                                            <p><strong>Next Billing:</strong> {new Date(subscription.next_billing_date).toLocaleDateString()}</p>
                                            {subscription.end_date && (
                                                <p><strong>End Date:</strong> {new Date(subscription.end_date).toLocaleDateString()}</p>
                                            )}
                                        </div>
                                        <div className="subscription-actions">
                                            {subscription.status === 'active' && (
                                                <button
                                                    className="cancel-button"
                                                    onClick={() => handleCancelSubscription(subscription.id)}
                                                >
                                                    Cancel Subscription
                                                </button>
                                            )}
                                            <button
                                                className="delete-button"
                                                onClick={() => handleDeleteSubscription(subscription.id)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </main>

            {deleteDialog.isOpen && <DeleteConfirmationDialog />}
            {userDeleteDialog.isOpen && <UserDeleteConfirmationDialog />}
        </div>
    );
};

export default AdminDashboard;
