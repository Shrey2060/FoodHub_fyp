import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('products');
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [orderFilter, setOrderFilter] = useState('all');
    const navigate = useNavigate();

    const [newProduct, setNewProduct] = useState({
        name: '',
        description: '',
        image_url: '',
        price: '',
        category_id: ''
    });

    const [editingProductId, setEditingProductId] = useState(null);
    const [editingUser, setEditingUser] = useState(null); // New state for user editing

    useEffect(() => {
        const userRole = sessionStorage.getItem('userRole');
        if (userRole !== 'admin') {
            navigate('/login');
            return;
        }
        fetchData();
    }, [navigate, activeTab]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = sessionStorage.getItem('authToken');
            const headers = { Authorization: `Bearer ${token}` };

            if (activeTab === 'products') {
                const response = await axios.get('http://localhost:5000/api/products', { headers });
                setProducts(response.data.products || response.data);
            } else if (activeTab === 'orders') {
                const response = await axios.get('http://localhost:5000/api/admin/orders', { headers });
                setOrders(response.data.orders);
            } else if (activeTab === 'users') {
                const response = await axios.get('http://localhost:5000/api/admin/users', { headers });
                setUsers(response.data.users || response.data);
            }
        } catch (error) {
            toast.error('Error fetching data');
            console.error('Error fetching data:', error);
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
        setNewProduct({ ...newProduct, [name]: value });
    };

    const saveProduct = async () => {
        if (!newProduct.name || !newProduct.price) {
            toast.error('Name and Price are required!');
            return;
        }
        try {
            const token = sessionStorage.getItem('authToken');
            const headers = { Authorization: `Bearer ${token}` };

            const payload = {
                ...newProduct,
                price: parseFloat(newProduct.price),
                category_id: parseInt(newProduct.category_id) || null
            };

            if (editingProductId) {
                await axios.put(`http://localhost:5000/api/admin/products/${editingProductId}`, payload, { headers });
                toast.success('Product updated successfully');
            } else {
                await axios.post('http://localhost:5000/api/admin/products', payload, { headers });
                toast.success('Product added successfully');
            }
            setNewProduct({ name: '', description: '', image_url: '', price: '', category_id: '' });
            setEditingProductId(null);
            fetchData();
        } catch (error) {
            toast.error('Failed to save product');
            console.error('Product error:', error);
        }
    };

    const editProduct = (product) => {
        setNewProduct(product);
        setEditingProductId(product.id);
    };

    const deleteProduct = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                const token = sessionStorage.getItem('authToken');
                await axios.delete(`http://localhost:5000/api/admin/products/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Product deleted');
                fetchData();
            } catch (error) {
                toast.error('Delete failed');
                console.error('Delete error:', error);
            }
        }
    };

    const handleLogout = () => {
        sessionStorage.clear();
        navigate('/login');
    };

    const editUser = async (id) => {
        try {
            const token = sessionStorage.getItem('authToken');
            const headers = { Authorization: `Bearer ${token}` };
            const response = await axios.get(`http://localhost:5000/api/admin/users/${id}`, { headers });
            setEditingUser(response.data.user);
            toast.info(`Editing user: ${response.data.user.name}`);
            // Optional: show a form/modal with editingUser data
        } catch (error) {
            toast.error("Failed to fetch user details");
            console.error(error);
        }
    };

    const filteredOrders = orders.filter(order => {
        if (orderFilter === 'all') return true;
        return order.status === orderFilter;
    });

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
                <button className={`nav-button ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Users</button>
            </nav>

            <main className="admin-content">
                {loading ? (
                    <div className="loading">Loading...</div>
                ) : (
                    <>
                        {/* Products Tab */}
                        {activeTab === 'products' && (
                            <div className="products-section">
                                <h2>Manage Products</h2>
                                <div className="product-form">
                                    <input name="name" value={newProduct.name} onChange={handleProductChange} placeholder="Name" />
                                    <input name="description" value={newProduct.description} onChange={handleProductChange} placeholder="Description" />
                                    <input name="image_url" value={newProduct.image_url} onChange={handleProductChange} placeholder="Image URL" />
                                    <input name="price" value={newProduct.price} onChange={handleProductChange} placeholder="Price" />
                                    <input name="category_id" value={newProduct.category_id} onChange={handleProductChange} placeholder="Category ID" />
                                    <button onClick={saveProduct}>{editingProductId ? 'Update' : 'Add'} Product</button>
                                </div>
                                <div className="products-grid">
                                    {products.map(product => (
                                        <div key={product.id} className="product-card">
                                            <img src={product.image_url || '/default.jpg'} alt={product.name} />
                                            <h3>{product.name}</h3>
                                            <p>£{parseFloat(product.price).toFixed(2)}</p>
                                            <div className="product-actions">
                                                <button onClick={() => editProduct(product)}>Edit</button>
                                                <button onClick={() => deleteProduct(product.id)}>Delete</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Orders Tab */}
                        {activeTab === 'orders' && (
                            <div className="orders-section">
                                <div className="orders-header">
                                    <h2>Order Management</h2>
                                    <select value={orderFilter} onChange={(e) => setOrderFilter(e.target.value)} className="order-filter">
                                        <option value="all">All Orders</option>
                                        <option value="pending">Pending</option>
                                        <option value="processing">Processing</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                                <div className="orders-list">
                                    {filteredOrders.map(order => (
                                        <div key={order.order_id} className="order-card">
                                            <div className="order-header">
                                                <h3>Order #{order.order_id}</h3>
                                                <span className={`status-badge ${order.status}`}>{order.status}</span>
                                            </div>
                                            <div className="order-details">
                                                <p><strong>Customer:</strong> {order.customer_name}</p>
                                                <p><strong>Date:</strong> {new Date(order.created_at).toLocaleDateString()}</p>
                                                <p><strong>Total:</strong> £{order.total_amount.toFixed(2)}</p>
                                                <p><strong>Items:</strong> {order.items.length}</p>
                                            </div>
                                            <div className="order-items">
                                                {order.items.map((item, index) => (
                                                    <div key={index} className="order-item">
                                                        <span>{item.name}</span>
                                                        <span>x{item.quantity}</span>
                                                        <span>£{item.price.toFixed(2)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="order-actions">
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => updateOrderStatus(order.order_id, e.target.value)}
                                                    className="status-select"
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="processing">Processing</option>
                                                    <option value="completed">Completed</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Users Tab */}
                        {activeTab === 'users' && (
                            <div className="users-section">
                                <h2>User Management</h2>
                                <div className="users-list">
                                    {users.map(user => (
                                        <div key={user.id} className="user-card">
                                            <h3>{user.name}</h3>
                                            <p>Email: {user.email}</p>
                                            <p>Role: {user.role}</p>
                                            <div className="user-actions">
                                                <button className="edit-button" onClick={() => editUser(user.id)}>Edit</button>
                                                <button className="delete-button">Delete</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
