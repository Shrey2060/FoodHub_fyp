import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaCoins, FaHistory, FaSpinner } from 'react-icons/fa';


const RewardPoints = () => {
    const [pointsData, setPointsData] = useState({
        points_balance: 0,
        total_points_earned: 0
    });
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [redeeming, setRedeeming] = useState(false);

    useEffect(() => {
        fetchRewardData();
    }, []);

    const fetchRewardData = async () => {
        try {
            const token = sessionStorage.getItem('authToken');
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            const [pointsRes, historyRes] = await Promise.all([
                axios.get('http://localhost:5000/api/rewards/points', config),
                axios.get('http://localhost:5000/api/rewards/history', config)
            ]);

            if (pointsRes.data.success && historyRes.data.success) {
                setPointsData(pointsRes.data.data);
                setHistory(historyRes.data.data);
            } else {
                toast.error('Failed to fetch reward data');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error fetching reward data');
            console.error('Error fetching reward data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRedeem = async (points) => {
        if (points > pointsData.points_balance) {
            toast.error('Insufficient points balance');
            return;
        }

        try {
            setRedeeming(true);
            const token = sessionStorage.getItem('authToken');
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            const response = await axios.post('http://localhost:5000/api/rewards/redeem', 
                { points_to_redeem: points },
                config
            );

            if (response.data.success) {
                toast.success(`Successfully redeemed ${points} points!`);
                await fetchRewardData();
            } else {
                toast.error('Failed to redeem points');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error redeeming points');
            console.error('Error redeeming points:', error);
        } finally {
            setRedeeming(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <FaSpinner className="spinner" />
                <p>Loading your rewards...</p>
            </div>
        );
    }

    return (
        <div className="rewards-container">
            <div className="rewards-summary">
                <h1><FaCoins className="icon" /> Your Reward Points</h1>
                <div className="points-card">
                    <div className="points-info">
                        <h2>Current Balance</h2>
                        <p className="points-balance">{pointsData.points_balance}</p>
                        <p className="total-earned">
                            Total Earned: {pointsData.total_points_earned}
                        </p>
                    </div>
                    <div className="redeem-section">
                        <h3>Redeem Points</h3>
                        <div className="redeem-buttons">
                            <button 
                                className="redeem-btn"
                                onClick={() => handleRedeem(100)}
                                disabled={redeeming || pointsData.points_balance < 100}
                            >
                                {redeeming ? <FaSpinner className="spinner" /> : 'Redeem 100 Points'}
                            </button>
                            <button 
                                className="redeem-btn"
                                onClick={() => handleRedeem(500)}
                                disabled={redeeming || pointsData.points_balance < 500}
                            >
                                {redeeming ? <FaSpinner className="spinner" /> : 'Redeem 500 Points'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rewards-history">
                <h2><FaHistory className="icon" /> Points History</h2>
                {history.length === 0 ? (
                    <p className="no-history">No transaction history available</p>
                ) : (
                    <div className="history-list">
                        {history.map((transaction) => (
                            <div key={transaction.id} className="history-item">
                                <div className="transaction-info">
                                    <span className={`transaction-type ${transaction.transaction_type.toLowerCase()}`}>
                                        {transaction.transaction_type}
                                    </span>
                                    <span className="transaction-date">
                                        {new Date(transaction.transaction_date).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                                <span className={`points ${transaction.transaction_type.toLowerCase()}`}>
                                    {transaction.transaction_type === 'EARNED' 
                                        ? `+${transaction.points_earned}` 
                                        : `-${transaction.points_redeemed}`}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RewardPoints;