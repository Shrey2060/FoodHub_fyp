import React, { useState } from 'react';
import "./Subscription.css";
import SubscriptionPage from '../SubscriptionPage/SubscriptionPage';

const Subscription = () => {
    const [showModal, setShowModal] = useState(false);

    return (
        <div className='sub-container'>
            <button className='subscription-btn' onClick={() => setShowModal(true)}>Subscribe</button>
            {showModal && <SubscriptionPage onClose={() => setShowModal(false)} />}
        </div>
    );
}

export default Subscription;
