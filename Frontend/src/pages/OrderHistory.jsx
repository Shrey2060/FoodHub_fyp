import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import { toast } from 'react-toastify';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = sessionStorage.getItem('authToken');
      const response = await axios.get('http://localhost:5000/api/orders/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(response.data.orders);
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;

    try {
      const token = sessionStorage.getItem('authToken');
      await axios.delete(`http://localhost:5000/api/orders/delete/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Order deleted successfully");
      fetchOrders();
    } catch (error) {
      toast.error("Failed to delete order");
    }
  };

  return (
    <>
      <Header />
      <div className="order-history" style={{ padding: '20px' }}>
        <h1>My Orders</h1>
        {loading ? (
          <p>Loading...</p>
        ) : orders.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          orders.map((order) => (
            <div key={order.order_id} style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '10px' }}>
              <h3>Order #{order.order_id}</h3>
              <p>Total: ${order.total_amount}</p>
              <p>Placed on: {new Date(order.created_at).toLocaleString()}</p>
              <button
                onClick={() => handleDelete(order.order_id)}
                style={{ backgroundColor: 'red', color: 'white', border: 'none', padding: '5px 10px' }}
              >
                Delete Order
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );
};

export default OrderHistory;
