import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import "./Subscription.css";
import SubscriptionPage from '../SubscriptionPage/SubscriptionPage';

const Subscription = () => {
    const [showModal, setShowModal] = useState(false);
    const [activeSubscription, setActiveSubscription] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSubscription();
    }, []);

    const fetchSubscription = async () => {
        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) {
                setLoading(false);
                return;
            }

            const response = await axios.get('http://localhost:5000/api/subscriptions/my-subscription', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                setActiveSubscription(response.data.subscription);
            }
        } catch (error) {
            console.error('Error fetching subscription:', error);
            toast.error('Failed to fetch subscription status');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelSubscription = async () => {
        try {
            const token = sessionStorage.getItem('authToken');
            if (!token) {
                toast.error('Please log in to cancel your subscription');
                return;
            }

            const response = await axios.post(
                'http://localhost:5000/api/subscriptions/cancel',
                {},
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (response.data.success) {
                toast.success('Subscription cancelled successfully');
                setActiveSubscription(null);
            }
        } catch (error) {
            console.error('Error cancelling subscription:', error);
            toast.error('Failed to cancel subscription');
        }
    };

    if (loading) {
        return <div className="loading">Loading subscription status...</div>;
    }

    return (
        <div className='sub-container'>
            {activeSubscription ? (
                <div className="active-subscription">
                    <h3>Active Subscription</h3>
                    <div className="subscription-details">
                        <p><strong>Plan:</strong> {activeSubscription.plan_name}</p>
                        <p><strong>Status:</strong> {activeSubscription.status}</p>
                        <p><strong>Start Date:</strong> {new Date(activeSubscription.start_date).toLocaleDateString()}</p>
                        <p><strong>Next Billing:</strong> {new Date(activeSubscription.next_billing_date).toLocaleDateString()}</p>
                        <p><strong>Price:</strong> Rs. {activeSubscription.plan_price}</p>
                        <div className="features">
                            <strong>Features:</strong>
                            <ul>
                                {activeSubscription.features.map((feature, index) => (
                                    <li key={index}>{feature}</li>
                                ))}
                            </ul>
                        </div>
                        <button 
                            className="cancel-subscription" 
                            onClick={handleCancelSubscription}
                        >
                            Cancel Subscription
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <button className='subscription-btn' onClick={() => setShowModal(true)}>
                        Subscribe Now
                    </button>
                    {showModal && (
                        <SubscriptionPage 
                            onClose={() => setShowModal(false)} 
                            onSubscribe={fetchSubscription}
                        />
                    )}
                </>
            )}
        </div>
    );
}

export default Subscription;
