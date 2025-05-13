import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import "./Subscription.css";
import SubscriptionPage from '../SubscriptionPage/SubscriptionPage';

const Subscription = () => {
    const [showModal, setShowModal] = useState(false);
    const [activeSubscription, setActiveSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

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
        if (!confirm('Are you sure you want to cancel your subscription?')) {
            return;
        }
        
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
            toast.error(error.response?.data?.message || 'Failed to cancel subscription');
        }
    };

    const handleSubscribeClick = () => {
        const token = sessionStorage.getItem('authToken');
        if (!token) {
            toast.error('Please log in to subscribe');
            navigate('/login');
            return;
        }
        setShowModal(true);
    };

    if (loading) {
        return null; // Don't show anything while loading
    }

    return (
        <div className="subscription-container">
            {activeSubscription ? (
                <div className="active-subscription-badge">
                    <span className="plan-name">{activeSubscription.plan_name}</span>
                    <button 
                        className="cancel-subscription-btn" 
                        onClick={handleCancelSubscription}
                        title="Cancel Subscription"
                    >
                        ✕
                    </button>
                </div>
            ) : (
                <button className='subscription-btn' onClick={handleSubscribeClick}>
                    Subscribe Now
                </button>
            )}
            {showModal && (
                <SubscriptionPage 
                    onClose={() => setShowModal(false)} 
                    onSubscribe={fetchSubscription}
                />
            )}
        </div>
    );
}

export default Subscription;