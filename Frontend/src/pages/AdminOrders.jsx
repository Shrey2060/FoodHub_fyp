import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaSearch, FaFilter } from 'react-icons/fa';

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const token = sessionStorage.getItem('authToken');
            const response = await axios.get('http://localhost:5000/api/admin/orders', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(response.data.orders);
        } catch (error) {
            toast.error('Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId, status) => {
        try {
            const token = sessionStorage.getItem('authToken');
            await axios.put(`http://localhost:5000/api/admin/orders/${orderId}`, 
                { status },
                { headers: { Authorization: `Bearer ${token}` }}
            );
            toast.success('Order status updated');
            fetchOrders();
        } catch (error) {
            toast.error('Failed to update order status');
        }
    };

    const filteredOrders = orders
        .filter(order => {
            if (filter === 'all') return true;
            return order.status === filter;
        })
        .filter(order => 
            order.order_id.toString().includes(searchTerm) ||
            order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
        );

    return (
        <div className="admin-orders">
            <h1>Order Management</h1>
            
            <div className="orders-controls">
                <div className="search-bar">
                    <FaSearch />
                    <input
                        type="text"
                        placeholder="Search orders..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="filter-controls">
                    <FaFilter />
                    <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                        <option value="all">All Orders</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="loading">Loading orders...</div>
            ) : (
                <div className="orders-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map(order => (
                                <tr key={order.order_id}>
                                    <td>#{order.order_id}</td>
                                    <td>{order.customer_name}</td>
                                    <td>{order.items.length} items</td>
                                    <td>£{order.total.toFixed(2)}</td>
                                    <td>
                                        <span className={`status ${order.status}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <select
                                            value={order.status}
                                            onChange={(e) => updateOrderStatus(order.order_id, e.target.value)}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="processing">Processing</option>
                                            <option value="completed">Completed</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminOrders;