import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const PreOrderList = () => {
    const [preOrders, setPreOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPreOrders();
    }, []);

    const fetchPreOrders = async () => {
        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) return;

            const response = await axios.get('http://localhost:5000/api/pre-orders', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setPreOrders(response.data.pre_orders);
            }
        } catch (error) {
            console.error('Error fetching pre-orders:', error);
            toast.error('Failed to fetch pre-orders');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelPreOrder = async (orderId) => {
        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) return;

            const response = await axios.delete(
                `http://localhost:5000/api/pre-orders/${orderId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                toast.success('Pre-order cancelled successfully');
                fetchPreOrders(); // Refresh the list
            }
        } catch (error) {
            console.error('Error cancelling pre-order:', error);
            toast.error(error.response?.data?.message || 'Failed to cancel pre-order');
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            confirmed: 'bg-blue-100 text-blue-800',
            preparing: 'bg-purple-100 text-purple-800',
            ready: 'bg-green-100 text-green-800',
            delivered: 'bg-gray-100 text-gray-800',
            cancelled: 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (preOrders.length === 0) {
        return (
            <div className="text-center py-8">
                <h3 className="text-xl font-medium text-gray-700">No Pre-orders Found</h3>
                <p className="text-gray-500 mt-2">You haven't scheduled any orders yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Your Pre-orders</h2>
            
            {preOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-lg font-semibold">
                                Order #{order.id}
                            </h3>
                            <p className="text-gray-600">
                                Scheduled for: {new Date(order.scheduled_date).toLocaleDateString()} at {order.delivery_time}
                            </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                    </div>

                    <div className="space-y-3">
                        {JSON.parse(order.items).map((item, index) => (
                            <div key={index} className="flex justify-between items-center">
                                <div className="flex items-center">
                                    <img 
                                        src={item.image_url || '/default-food.png'} 
                                        alt={item.name}
                                        className="w-12 h-12 object-cover rounded-md mr-3"
                                    />
                                    <div>
                                        <p className="font-medium">{item.name}</p>
                                        <p className="text-gray-500">Quantity: {item.quantity}</p>
                                    </div>
                                </div>
                                <p className="font-medium">Rs. {item.price * item.quantity}</p>
                            </div>
                        ))}
                    </div>

                    {order.special_instructions && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-md">
                            <p className="text-sm font-medium text-gray-700">Special Instructions:</p>
                            <p className="text-gray-600">{order.special_instructions}</p>
                        </div>
                    )}

                    {order.status === 'pending' && (
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={() => handleCancelPreOrder(order.id)}
                                className="px-4 py-2 text-red-600 hover:text-red-800 font-medium"
                            >
                                Cancel Order
                            </button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default PreOrderList; 