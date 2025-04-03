import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer/Footer';

const PreOrder = () => {
    const navigate = useNavigate();
    const [scheduledTime, setScheduledTime] = useState(new Date());
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [error, setError] = useState('');
    const [cartItems, setCartItems] = useState([]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/api/pre-orders', {
                scheduledTime,
                items: cartItems,
                specialInstructions
            }, {
                headers: {
                    Authorization: `Bearer ${sessionStorage.getItem('authToken')}`
                }
            });

            if (response.data.success) {
                navigate('/order-confirmation', { 
                    state: { 
                        orderId: response.data.orderId,
                        isPreOrder: true,
                        scheduledTime 
                    }
                });
            }
        } catch (err) {
            setError('Failed to create pre-order');
        }
    };

    return (
        <>
        <Header />
        <div className="pre-order-container">
            <h1>Schedule Your Order</h1>
            
            <form onSubmit={handleSubmit} className="pre-order-form">
                <div className="form-group">
                    <label>Select Date and Time</label>
                    <DatePicker
                        selected={scheduledTime}
                        onChange={(date) => setScheduledTime(date)}
                        showTimeSelect
                        dateFormat="MMMM d, yyyy h:mm aa"
                        minDate={new Date()}
                        className="date-picker"
                    />
                </div>

                <div className="form-group">
                    <label>Special Instructions</label>
                    <textarea
                        value={specialInstructions}
                        onChange={(e) => setSpecialInstructions(e.target.value)}
                        placeholder="Any special instructions for your order?"
                    />
                </div>

                {error && <div className="error-message">{error}</div>}

                <button type="submit" className="submit-button">
                    Schedule Order
                </button>
            </form>
        </div>
        <Footer />
        </>
    );
};

export default PreOrder;