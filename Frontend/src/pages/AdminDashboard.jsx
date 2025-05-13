import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { getStatusColor } from '../utils/statusUtils';
import './AdminDashboard.css';

// Move SaveConfirmationDialog outside the main component
const SaveConfirmationDialog = ({ isOpen, orderId, orderData, onConfirm, onCancel, loading, error }) => {
    if (!isOpen) return null;

    const handleConfirmClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onConfirm();
    };

    return (
        <div className="dialog-overlay" onClick={onCancel}>
            <div className="dialog-content" onClick={e => e.stopPropagation()}>
                <div className="dialog-header">
                    <h2>Confirm Order Update</h2>
                    <button 
                        className="close-button"
                        onClick={onCancel}
                        type="button"
                    >
                        ×
                    </button>
                </div>
                <div className="dialog-body">
                    <div className="order-info">
                        <p className="order-id">Order #{orderId}</p>
                        <div className="changes-summary">
                            <h3>Changes Summary</h3>
                            <div className="changes-list">
                                <div className="change-item">
                                    <span className="change-label">Status:</span>
                                    <span className="change-value">{orderData.status}</span>
                                </div>
                                <div className="change-item">
                                    <span className="change-label">Contact Number:</span>
                                    <span className="change-value">{orderData.contact_number}</span>
                                </div>
                                <div className="change-item">
                                    <span className="change-label">Payment Method:</span>
                                    <span className="change-value">{orderData.payment_method}</span>
                                </div>
                                <div className="change-item">
                                    <span className="change-label">Delivery Address:</span>
                                    <span className="change-value">{orderData.delivery_address}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {error && <div className="dialog-error" style={{color: 'red', marginTop: 10}}>{error}</div>}
                </div>
                <div className="dialog-footer">
                    <button 
                        className="dialog-button cancel"
                        onClick={onCancel}
                        type="button"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button 
                        className="dialog-button save"
                        onClick={handleConfirmClick}
                        type="button"
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : 'Confirm Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('products');
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [users, setUsers] = useState([]);
    const [preOrders, setPreOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [orderFilter, setOrderFilter] = useState('all');
    const [filteredOrders, setFilteredOrders] = useState([]);
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

    // Add state for save confirmation dialog
    const [saveConfirmationDialog, setSaveConfirmationDialog] = useState({
        isOpen: false,
        orderId: null,
        orderData: null
    });

    const [isAddingUser, setIsAddingUser] = useState(false);

    // Add pre-order filter state
    const [preOrderFilter, setPreOrderFilter] = useState('all');
    const [selectedPreOrder, setSelectedPreOrder] = useState(null);
    const [preOrderFormData, setPreOrderFormData] = useState({
        order_status: '',
        delivery_address: '',
        scheduled_date: '',
        delivery_time: ''
    });

    // Filtered pre-orders
    const filteredPreOrders = preOrders.filter(order => {
        if (preOrderFilter === 'all') return true;
        return order.order_status === preOrderFilter;
    });

    // Add loading state for save confirmation dialog
    const [saveLoading, setSaveLoading] = useState(false);
    const [saveError, setSaveError] = useState("");

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

    useEffect(() => {
        if (orderFilter === 'all') {
            setFilteredOrders(orders);
        } else {
            setFilteredOrders(orders.filter(order => order.status === orderFilter));
        }
    }, [orders, orderFilter]);

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
            }
        } catch (error) {
            console.error('Error fetching data:', error.response || error);
            toast.error(error.response?.data?.message || 'Failed to fetch data');
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
        if (!selectedOrder) return;

        setSaveConfirmationDialog({
            isOpen: true,
            orderId: selectedOrder.id,
            orderData: orderFormData
        });
    };

    const confirmOrderUpdate = async () => {
        setSaveLoading(true);
        setSaveError("");
        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) {
                setSaveError('Authentication required');
                setSaveLoading(false);
                return;
            }
            const response = await axios.put(
                `http://localhost:5000/api/orders/admin/${saveConfirmationDialog.orderId}`,
                saveConfirmationDialog.orderData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            if (response.data.success) {
                setSelectedOrder(null);
                setOrderFormData({
                    status: '',
                    contact_number: '',
                    payment_method: '',
                    delivery_address: '',
                    payment_status: ''
                });
                toast.success('Order updated successfully');
                setSaveConfirmationDialog({
                    isOpen: false,
                    orderId: null,
                    orderData: null
                });
                await fetchOrders();
            } else {
                setSaveError(response.data.message || 'Failed to update order');
            }
        } catch (error) {
            setSaveError(error.response?.data?.message || 'Failed to update order');
        } finally {
            setSaveLoading(false);
        }
    };

    const DeleteConfirmationDialog = () => {
        if (!deleteDialog.isOpen) return null;

        const handleConfirmDelete = async () => {
            try {
                const token = sessionStorage.getItem('authToken');
                if (!token) {
                    throw new Error('Authentication required');
                }

                console.log('Starting deletion process...');
                console.log('ID to delete:', deleteDialog.orderId);
                console.log('Details:', deleteDialog.orderDetails);

                // Use the correct delete endpoint based on the active tab
                let deleteEndpoint;
                if (activeTab === 'products') {
                    deleteEndpoint = `http://localhost:5000/api/admin/products/${deleteDialog.orderId}`;
                } else if (activeTab === 'orders') {
                    deleteEndpoint = `http://localhost:5000/api/admin/orders/${deleteDialog.orderId}`;
                } else if (activeTab === 'pre-orders') {
                    deleteEndpoint = `http://localhost:5000/api/admin/pre-orders/${deleteDialog.orderId}`;
                }

                console.log('Sending delete request to:', deleteEndpoint);

                const response = await axios.delete(
                    deleteEndpoint,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                console.log('Delete response:', response);

                if (response.data && response.data.success) {
                    console.log('Deletion successful');
                    
                    // Update local state based on active tab
                    if (activeTab === 'products') {
                        setProducts(prevProducts => prevProducts.filter(product => product.id !== deleteDialog.orderId));
                    } else if (activeTab === 'orders') {
                        setOrders(prevOrders => prevOrders.filter(order => order.id !== deleteDialog.orderId));
                    } else if (activeTab === 'pre-orders') {
                        setPreOrders(prevPreOrders => prevPreOrders.filter(order => order.id !== deleteDialog.orderId));
                    }
                    
                    // Close the dialog
                    setDeleteDialog({
                        isOpen: false,
                        orderId: null,
                        orderDetails: null
                    });
                    
                    // Refresh the data
                    await fetchData();
                    console.log('Data refreshed after deletion');
                    
                    toast.success('Item deleted successfully');
                } else {
                    throw new Error(response.data?.message || 'Failed to delete item');
                }
            } catch (error) {
                console.error('Detailed error information:', {
                    message: error.message,
                    response: error.response?.data,
                    status: error.response?.status,
                    statusText: error.response?.statusText
                });

                if (error.response?.status === 403) {
                    toast.error('You do not have permission to delete this item');
                } else if (error.response?.status === 404) {
                    toast.error('Item not found in database');
                } else if (error.response?.status === 401) {
                    toast.error('Authentication failed. Please log in again.');
                } else {
                    toast.error(error.response?.data?.message || 'Failed to delete item');
                }
            }
        };

        return (
            <div className="dialog-overlay">
                <div className="dialog-content">
                    <div className="dialog-header">
                        <h2>Delete {activeTab === 'products' ? 'Product' : 'Order'}</h2>
                        <button 
                            className="close-button"
                            onClick={() => setDeleteDialog({
                                isOpen: false,
                                orderId: null,
                                orderDetails: null
                            })}
                        >
                            ×
                        </button>
                    </div>
                    <div className="dialog-body">
                        <p>Are you sure you want to delete this {activeTab === 'products' ? 'product' : 'order'}?</p>
                        {deleteDialog.orderDetails && (
                            <div className="item-summary">
                                {activeTab === 'products' ? (
                                    <p><strong>Name:</strong> {deleteDialog.orderDetails.name}</p>
                                ) : (
                                    <>
                                        <p><strong>Order ID:</strong> {deleteDialog.orderId}</p>
                                        <p><strong>Status:</strong> {deleteDialog.orderDetails.status}</p>
                                    </>
                                )}
                            </div>
                        )}
                        <p className="warning-text">This action cannot be undone!</p>
                    </div>
                    <div className="dialog-footer">
                        <button 
                            className="dialog-button cancel"
                            onClick={() => setDeleteDialog({
                                isOpen: false,
                                orderId: null,
                                orderDetails: null
                            })}
                        >
                            Cancel
                        </button>
                        <button 
                            className="dialog-button delete"
                            onClick={handleConfirmDelete}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Add or update this function for admin pre-order status update
    const handleUpdatePreOrderStatus = async (preOrderId, newStatus) => {
        try {
            const token = sessionStorage.getItem('authToken');
            await axios.put(
                `http://localhost:5000/api/admin/pre-orders/${preOrderId}`,
                { order_status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Pre-order status updated successfully');
            fetchPreOrders();
        } catch (error) {
            toast.error('Failed to update pre-order status');
            console.error('Error updating pre-order:', error);
        }
    };

    // Add or update this function for admin pre-order delete
    const handleDeletePreOrder = async (preOrderId) => {
        try {
            const token = sessionStorage.getItem('authToken');
            await axios.delete(
                `http://localhost:5000/api/admin/pre-orders/${preOrderId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Pre-order deleted successfully');
            fetchPreOrders();
        } catch (error) {
            toast.error('Failed to delete pre-order');
            console.error('Error deleting pre-order:', error);
        }
    };

    // Pre-order edit form submit
    const handlePreOrderUpdate = async (e) => {
        e.preventDefault();
        if (!selectedPreOrder) return;
        try {
            const token = sessionStorage.getItem('authToken');
            await axios.put(
                `http://localhost:5000/api/admin/pre-orders/${selectedPreOrder.id}`,
                preOrderFormData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSelectedPreOrder(null);
            setPreOrderFormData({
                order_status: '',
                delivery_address: '',
                scheduled_date: '',
                delivery_time: ''
            });
            toast.success('Pre-order updated successfully');
            fetchPreOrders();
        } catch (error) {
            toast.error('Failed to update pre-order');
            console.error('Error updating pre-order:', error);
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
            </nav>

            <main className="admin-content">
                {/* Main content */}
                {error && <div className="error-message">{error}</div>}

                {activeTab === 'pre-orders' && (
                    <div className="pre-orders-section">
                        <h2>Pre-Orders Management</h2>
                        {/* Pre-Order Filters */}
                        <div className="order-filters">
                            <select 
                                value={preOrderFilter} 
                                onChange={(e) => setPreOrderFilter(e.target.value)}
                                className="status-filter"
                            >
                                <option value="all">All Pre-Orders</option>
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="preparing">Preparing</option>
                                <option value="ready">Ready</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                        {/* Pre-Order Edit Form */}
                        {selectedPreOrder && (
                            <div className="order-edit-form-container">
                                <form onSubmit={handlePreOrderUpdate} className="order-form">
                                    <h3>Edit Pre-Order #{selectedPreOrder.id}</h3>
                                    <div className="form-group">
                                        <label>Status:</label>
                                        <select
                                            name="order_status"
                                            value={preOrderFormData.order_status}
                                            onChange={(e) => setPreOrderFormData({...preOrderFormData, order_status: e.target.value})}
                                            required
                                            className="form-control"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="confirmed">Confirmed</option>
                                            <option value="preparing">Preparing</option>
                                            <option value="ready">Ready</option>
                                            <option value="delivered">Delivered</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Delivery Address:</label>
                                        <textarea
                                            name="delivery_address"
                                            value={preOrderFormData.delivery_address}
                                            onChange={(e) => setPreOrderFormData({...preOrderFormData, delivery_address: e.target.value})}
                                            required
                                            className="form-control"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Scheduled Date:</label>
                                        <input
                                            type="date"
                                            name="scheduled_date"
                                            value={preOrderFormData.scheduled_date}
                                            onChange={(e) => setPreOrderFormData({...preOrderFormData, scheduled_date: e.target.value})}
                                            required
                                            className="form-control"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Delivery Time:</label>
                                        <input
                                            type="time"
                                            name="delivery_time"
                                            value={preOrderFormData.delivery_time}
                                            onChange={(e) => setPreOrderFormData({...preOrderFormData, delivery_time: e.target.value})}
                                            required
                                            className="form-control"
                                        />
                                    </div>
                                    <div className="form-actions">
                                        <button type="submit" className="btn-save">Save Changes</button>
                                        <button 
                                            type="button" 
                                            className="btn-cancel"
                                            onClick={() => {
                                                setSelectedPreOrder(null);
                                                setPreOrderFormData({
                                                    order_status: '',
                                                    delivery_address: '',
                                                    scheduled_date: '',
                                                    delivery_time: ''
                                                });
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                        {/* Pre-Orders List */}
                        <div className="orders-list">
                            {filteredPreOrders.length === 0 ? (
                                <div className="no-pre-orders">
                                    <p>No pre-orders found.</p>
                                </div>
                            ) : (
                                filteredPreOrders.map((order) => (
                                    <div key={`pre-order-${order.id}`} className="order-card">
                                        <div className="order-header">
                                            <h3>Pre-Order #{order.id}</h3>
                                            <span className={`status-badge ${getStatusColor(order.order_status || 'pending')}`}>
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
                                        <div className="order-items">
                                            <h4>Order Items:</h4>
                                            {order.items.map((item, index) => (
                                                <div key={`item-${order.id}-${index}`} className="order-item">
                                                    <span>{item.name}</span>
                                                    <span>x{item.quantity}</span>
                                                    <span>{formatCurrency(item.price * item.quantity)}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="order-actions">
                                            <button 
                                                className="btn-edit"
                                                onClick={() => {
                                                    setSelectedPreOrder(order);
                                                    setPreOrderFormData({
                                                        order_status: order.order_status,
                                                        delivery_address: order.delivery_address,
                                                        scheduled_date: order.scheduled_date ? order.scheduled_date.split('T')[0] : '',
                                                        delivery_time: order.delivery_time
                                                    });
                                                }}
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                className="btn-delete"
                                                onClick={() => setDeleteDialog({
                                                    isOpen: true,
                                                    orderId: order.id,
                                                    orderDetails: order
                                                })}
                                                disabled={!(order.order_status === 'delivered' || order.order_status === 'cancelled')}
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
                            <div className="order-edit-form-container">
                                <form onSubmit={handleOrderUpdate} className="order-form">
                                    <h3>Edit Order #{selectedOrder.id}</h3>
                                    <div className="form-group">
                                        <label>Status:</label>
                                        <select
                                            name="status"
                                            value={orderFormData.status}
                                            onChange={(e) => setOrderFormData({...orderFormData, status: e.target.value})}
                                            required
                                            className="form-control"
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
                                            className="form-control"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Payment Method:</label>
                                        <select
                                            name="payment_method"
                                            value={orderFormData.payment_method}
                                            onChange={(e) => setOrderFormData({...orderFormData, payment_method: e.target.value})}
                                            required
                                            className="form-control"
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
                                            className="form-control"
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
                            </div>
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
                                            onClick={() => setDeleteDialog({
                                                isOpen: true,
                                                orderId: order.id,
                                                orderDetails: order
                                            })}
                                            disabled={order.status !== 'completed'}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {deleteDialog.isOpen && <DeleteConfirmationDialog />}
            
            {/* Update the SaveConfirmationDialog usage */}
            <SaveConfirmationDialog
                isOpen={saveConfirmationDialog.isOpen}
                orderId={saveConfirmationDialog.orderId}
                orderData={saveConfirmationDialog.orderData}
                onConfirm={confirmOrderUpdate}
                onCancel={() => {
                    setSaveConfirmationDialog({
                        isOpen: false,
                        orderId: null,
                        orderData: null
                    });
                    setSaveError("");
                }}
                loading={saveLoading}
                error={saveError}
            />
        </div>
    );
};

export default AdminDashboard;
