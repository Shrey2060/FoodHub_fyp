import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import axios from 'axios';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import './PreOrder.css';

const PreOrder = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [scheduledDate, setScheduledDate] = useState(new Date());
    const [deliveryTime, setDeliveryTime] = useState('12:00');
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cartItems, setCartItems] = useState([]);
    const [formData, setFormData] = useState({
        scheduled_date: '',
        delivery_time: '',
        special_instructions: '',
        delivery_address: ''
    });

    useEffect(() => {
        // Fetch cart items when component mounts
        fetchCartItems();
    }, []);

    const fetchCartItems = async () => {
        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) {
                toast.error('Please log in to access your cart');
                navigate('/login');
                return;
            }

            const response = await axios.get('http://localhost:5000/api/cart', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setCartItems(response.data.cartItems);
            }
        } catch (error) {
            console.error('Error fetching cart items:', error);
            toast.error('Failed to fetch cart items');
        }
    };

    // Calculate minimum date (tomorrow)
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 1);

    // Calculate maximum date (30 days from now)
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleDateChange = (date) => {
        setScheduledDate(date);
        setFormData(prev => ({
            ...prev,
            scheduled_date: formatDate(date)
        }));
    };

    const handleTimeChange = (e) => {
        const time = e.target.value;
        setDeliveryTime(time);
        setFormData(prev => ({
            ...prev,
            delivery_time: time
        }));
    };

    const handleSpecialInstructionsChange = (e) => {
        const instructions = e.target.value;
        setSpecialInstructions(instructions);
        setFormData(prev => ({
            ...prev,
            special_instructions: instructions
        }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.scheduled_date || !formData.delivery_time || !formData.delivery_address) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) {
                toast.error('Please log in to place a pre-order');
                navigate('/login');
                return;
            }

            if (!cartItems || cartItems.length === 0) {
                toast.error('Your cart is empty');
                return;
            }

            // Format the items array
            const formattedItems = cartItems.map(item => ({
                product_id: parseInt(item.product_id),
                quantity: parseInt(item.quantity),
                price: parseFloat(item.price)
            }));

            const preOrderData = {
                items: formattedItems,
                scheduled_date: formData.scheduled_date,
                delivery_time: formData.delivery_time,
                special_instructions: formData.special_instructions,
                delivery_address: formData.delivery_address
            };

            console.log('Sending pre-order data:', preOrderData);

            const response = await axios.post(
                'http://localhost:5000/api/pre-orders',
                preOrderData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                toast.success('Pre-order scheduled successfully!');
                navigate('/orders');
            }
        } catch (error) {
            console.error('Error scheduling pre-order:', error);
            const errorMessage = error.response?.data?.message || 
                               error.response?.data?.error || 
                               'Failed to schedule pre-order';
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Header />
            <div className="pre-order-container">
                <div className="pre-order-form">
                    <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
                        Schedule Your Order
                    </h2>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="form-section">
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Delivery Date
                                </label>
                                <DatePicker
                                    selected={scheduledDate}
                                    onChange={handleDateChange}
                                    minDate={minDate}
                                    maxDate={maxDate}
                                    dateFormat="MMMM d, yyyy"
                                />
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Delivery Time
                                </label>
                                <input
                                    type="time"
                                    value={deliveryTime}
                                    onChange={handleTimeChange}
                                    className="time-input"
                                    min="09:00"
                                    max="21:00"
                                    required
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    Available between 9:00 AM and 9:00 PM
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Special Instructions
                                </label>
                                <textarea
                                    value={specialInstructions}
                                    onChange={handleSpecialInstructionsChange}
                                    placeholder="Any special instructions for your order..."
                                    className="instructions-textarea"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="delivery_address">Delivery Address *</label>
                                <textarea
                                    id="delivery_address"
                                    name="delivery_address"
                                    value={formData.delivery_address}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Enter your delivery address"
                                />
                            </div>
                        </div>

                        {cartItems.length > 0 ? (
                            <div className="cart-items-container">
                                <h3 className="text-lg font-medium text-gray-800 mb-4">Order Items</h3>
                                <div className="space-y-3">
                                    {cartItems.map((item, index) => (
                                        <div key={index} className="cart-item">
                                            <div className="item-details">
                                                <h4>{item.name}</h4>
                                                <p className="item-quantity">Quantity: {item.quantity}</p>
                                            </div>
                                            <p className="item-price">Rs. {item.price * item.quantity}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="empty-cart">
                                <p>Your cart is empty</p>
                                <button
                                    type="button"
                                    onClick={() => navigate('/products')}
                                    className="browse-button"
                                >
                                    Browse Products
                                </button>
                            </div>
                        )}

                        <div className="button-container">
                            <button
                                type="button"
                                onClick={() => navigate('/cart')}
                                className="back-button"
                            >
                                Back to Cart
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || cartItems.length === 0}
                                className="submit-button"
                            >
                                {isSubmitting ? 'Scheduling...' : 'Schedule Order'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default PreOrder;