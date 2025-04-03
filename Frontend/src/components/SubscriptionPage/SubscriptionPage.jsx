import React, { useState } from 'react';
import "./SubscriptionPage.css";

const SubscriptionPage = ({ onClose }) => {
  const [subscription, setSubscription] = useState('weekly');

  const handleSubscriptionChange = (event) => {
    setSubscription(event.target.value);
  };

  const handleSubscribe = async () => {
    const amount = subscription === 'weekly' ? 1000 : 4000; // Amount in paisa (1 NPR = 100 paisa)

    const payload = {
      return_url: "http://localhost:5173/Invoice",
      website_url: "http://localhost:5173/",
      amount: amount, 
      purchase_order_id: `sub-${subscription}-${Date.now()}`,
      purchase_order_name: `${subscription} Subscription`,
      customer_info: {
          name: "Shrey Dahal",
          email: "dahalshrey07@gmail.com",
          phone: "9844000510"
      },
      amount_breakdown: [
          { label: "Subscription Fee", amount: amount }
      ],
      product_details: [
          {
              identity: subscription,
              name: `${subscription} Plan`,
              total_price: amount,
              quantity: 1,
              unit_price: amount
          }
      ]
    };

    try {
      const response = await fetch("http://localhost:5000/api/payment/khalti/initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.payment_url) {
          window.location.href = data.payment_url; // Redirect to Khalti Payment Page
      }
  } catch (error) {
      console.error("Payment Error:", error);
  }

  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>&times;</button>
        <div className="subscription-container">
          <h2>Choose Your Subscription Plan</h2>
          <div className="subscription-options">
            <label>
              <input 
                type="radio" 
                value="weekly" 
                checked={subscription === 'weekly'} 
                onChange={handleSubscriptionChange} 
              />
              Weekly - NPR 1000
            </label>
            <label>
              <input 
                type="radio" 
                value="monthly" 
                checked={subscription === 'monthly'} 
                onChange={handleSubscriptionChange} 
              />
              Monthly - NPR 4000
            </label>
          </div>
          <button className="subscribe-button" onClick={handleSubscribe}>Pay with Khalti</button>
          <button className="close-modal-button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;