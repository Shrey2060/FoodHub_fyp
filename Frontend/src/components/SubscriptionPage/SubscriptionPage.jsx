import React, { useState, useEffect, useRef } from 'react';
import "./SubscriptionPage.css";
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// Success Dialog Component
const SuccessDialog = ({ isOpen, message, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog-content">
        <h2>Success!</h2>
        <p>{message}</p>
        <div className="dialog-buttons">
          <button className="dialog-button confirm" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

const SubscriptionPage = ({ onClose }) => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [plans, setPlans] = useState([]);
  const [successDialog, setSuccessDialog] = useState({ isOpen: false, message: '' });
  const navigate = useNavigate();
  const processingRef = useRef(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  // Update useEffect to handle return from Khalti payment
  useEffect(() => {
    const handleKhaltiReturn = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const subscriptionType = urlParams.get('subscription_type');
      const amount = urlParams.get('amount');
      const paymentStatus = urlParams.get('payment_status');
      const pidx = urlParams.get('pidx');

      // Check if we've already processed this payment
      const processedPayment = sessionStorage.getItem(`processed_payment_${pidx}`);
      if (processedPayment) {
        console.log("Payment already processed, skipping...");
        // Navigate to invoice if payment was processed but page was refreshed
        navigate(`/invoice?subscription_type=${encodeURIComponent(subscriptionType)}&amount=${amount}&pidx=${pidx}&payment_status=paid&transaction_id=${pidx}`);
        return;
      }

      // Check if we're currently processing
      if (processingRef.current) {
        console.log("Already processing a payment, skipping...");
        return;
      }

      // Set processing flag
      processingRef.current = true;

      console.log("Handling Khalti return with params:", { subscriptionType, amount, paymentStatus, pidx });

      if (subscriptionType && amount && paymentStatus === 'paid') {
        const loadingToast = toast.loading('Verifying payment...');
        try {
          const token = sessionStorage.getItem('authToken');
          const storedSubscription = JSON.parse(sessionStorage.getItem('currentKhaltiSubscription') || '{}');
          
          console.log("Stored subscription details:", storedSubscription);

          if (!storedSubscription.plan_name || storedSubscription.plan_name !== subscriptionType) {
            toast.dismiss(loadingToast);
            toast.error('Invalid subscription details');
            return;
          }

          // First verify payment with Khalti
          const verifyResponse = await axios.post(
            `http://localhost:5000/api/payment/khalti/verify`,
            {
              pidx: pidx,
              amount: storedSubscription.amount,
              orderId: `sub_${storedSubscription.plan_id}`
            },
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          console.log("Payment verification response:", verifyResponse.data);

          if (!verifyResponse.data.success) {
            toast.dismiss(loadingToast);
            toast.error('Payment verification failed');
            return;
          }

          // Mark this payment as processed before confirming subscription
          sessionStorage.setItem(`processed_payment_${pidx}`, 'true');

          // Confirm subscription
          const confirmResponse = await axios.post(
            'http://localhost:5000/api/subscriptions/confirm',
            {
              plan_id: storedSubscription.plan_id,
              payment_method: 'khalti'
            },
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          console.log("Subscription confirmation response:", confirmResponse.data);

          if (!confirmResponse.data.success) {
            toast.dismiss(loadingToast);
            toast.error('Subscription confirmation failed');
            return;
          }

          // Clear the stored subscription
          sessionStorage.removeItem('currentKhaltiSubscription');
          
          // Try to get user data from the correct endpoint
          try {
            const userData = await axios.get('http://localhost:5000/api/auth/profile', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (userData.data) {
              sessionStorage.setItem('userData', JSON.stringify(userData.data));
            }
          } catch (userError) {
            console.warn('Could not fetch user data:', userError);
            // Continue with navigation even if user data fetch fails
          }

          // Navigate to invoice page
          navigate(`/invoice?subscription_type=${encodeURIComponent(subscriptionType)}&amount=${amount}&pidx=${pidx}&payment_status=paid&transaction_id=${pidx}`);
          
          toast.dismiss(loadingToast);
          toast.success('Payment successful! Generating invoice...');

        } catch (error) {
          toast.dismiss(loadingToast);
          console.error('Error processing payment:', error.response || error);
          toast.error(error.response?.data?.message || 'Payment processing failed');
        } finally {
          // Reset processing flag
          processingRef.current = false;
        }
      }
    };

    // Only run if we have the required URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const subscriptionType = urlParams.get('subscription_type');
    const paymentStatus = urlParams.get('payment_status');
    
    if (subscriptionType && paymentStatus === 'paid') {
      handleKhaltiReturn();
    }

    // Cleanup function
    return () => {
      processingRef.current = false;
    };
  }, [navigate]);

  const fetchPlans = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/subscriptions/plans');
      if (Array.isArray(response.data)) {
        setPlans(response.data);
      } else {
        console.error('Invalid plans data received:', response.data);
        toast.error('Failed to load subscription plans');
        setPlans([]);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to load subscription plans');
      setPlans([]);
    }
  };

  const handleKhaltiPayment = async () => {
    if (!selectedPlan) {
      toast.error('Please select a plan first');
      return;
    }

    try {
      setProcessing(true);
      const amount = selectedPlan.price * 100; // Convert to paisa
      
      if (!amount) {
        toast.error('Invalid subscription amount');
        return;
      }

      // Store complete subscription details in sessionStorage
      const subscriptionDetails = {
        plan_id: selectedPlan.id,
        amount: amount,
        plan_name: selectedPlan.name,
        price: selectedPlan.price,
        duration: selectedPlan.duration,
        features: selectedPlan.features
      };
      sessionStorage.setItem('currentKhaltiSubscription', JSON.stringify(subscriptionDetails));

      const payload = {
        return_url: `http://localhost:5173/subscriptionPage?subscription_type=${encodeURIComponent(selectedPlan.name)}&amount=${amount}&payment_status=paid`,
        website_url: "http://localhost:5173",
        amount: amount,
        purchase_order_id: `sub_${selectedPlan.id}_${Date.now()}`,
        purchase_order_name: `Subscription: ${selectedPlan.name}`,
        customer_info: {
          name: sessionStorage.getItem('userName') || "Customer",
          email: sessionStorage.getItem('userEmail') || "",
          phone: "9800000000"
        },
        amount_breakdown: [
          {
            label: "Subscription Amount",
            amount: amount
          }
        ],
        product_details: [
          {
            identity: selectedPlan.id,
            name: selectedPlan.name,
            total_price: amount,
            quantity: 1,
            unit_price: amount
          }
        ]
      };

      console.log("Initiating Khalti payment with payload:", payload);

      const token = sessionStorage.getItem('authToken');
      const response = await axios.post(
        "http://localhost:5000/api/payment/khalti/initiate",
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log("Khalti initiation response:", response.data);

      if (response.data && response.data.payment_url) {
        toast.success('Redirecting to Khalti payment page...');
        // Redirect to Khalti payment page
        window.location.href = response.data.payment_url;
      } else {
        toast.error('Failed to initiate payment: ' + (response.data?.message || 'Unknown error'));
        setProcessing(false);
      }
    } catch (error) {
      console.error('Error initiating Khalti payment:', error.response || error);
      toast.error(error.response?.data?.message || 'Failed to initiate payment');
      setProcessing(false);
    }
  };

  return (
    <div className="subscription-modal">
      <div className="subscription-content">
        <h2>Choose Your Subscription Plan</h2>
        <div className="subscription-plans">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`subscription-plan ${selectedPlan?.id === plan.id ? 'selected' : ''}`}
              onClick={() => setSelectedPlan(plan)}
            >
              <h3>{plan.name}</h3>
              <p className="price">Rs. {plan.price}</p>
              <p className="duration">{plan.duration}</p>
              <ul className="features">
                {plan.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="subscription-actions">
          <button 
            className="subscribe-button" 
            onClick={handleKhaltiPayment}
            disabled={!selectedPlan || processing}
          >
            {processing ? 'Processing...' : 'Pay with Khalti'}
          </button>
          <button className="close-modal-button" onClick={onClose}>Close</button>
        </div>
      </div>

      {/* Success Dialog */}
      <SuccessDialog
        isOpen={successDialog.isOpen}
        message={successDialog.message}
        onClose={() => {
          setSuccessDialog({ isOpen: false, message: '' });
          onClose();
        }}
      />
    </div>
  );
};

export default SubscriptionPage;