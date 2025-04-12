import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { toast } from 'react-toastify';

const PreOrder = ({ cartItems, onClose }) => {
    const navigate = useNavigate();
    const [scheduledDate, setScheduledDate] = useState(new Date());
    const [deliveryTime, setDeliveryTime] = useState('12:00');
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

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
                scheduled_date: formatDate(scheduledDate),
                delivery_time: deliveryTime,
                special_instructions: specialInstructions || null
            };

            // Log the request payload
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
                if (onClose) onClose();
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
        <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Schedule Your Order</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Delivery Date
                    </label>
                    <DatePicker
                        selected={scheduledDate}
                        onChange={date => setScheduledDate(date)}
                        minDate={minDate}
                        maxDate={maxDate}
                        dateFormat="MMMM d, yyyy"
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Delivery Time
                    </label>
                    <input
                        type="time"
                        value={deliveryTime}
                        onChange={(e) => setDeliveryTime(e.target.value)}
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
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
                        onChange={(e) => setSpecialInstructions(e.target.value)}
                        placeholder="Any special instructions for your order..."
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 h-24"
                    />
                </div>

                <div className="flex justify-between items-center mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                            ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isSubmitting ? 'Scheduling...' : 'Schedule Order'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PreOrder; 