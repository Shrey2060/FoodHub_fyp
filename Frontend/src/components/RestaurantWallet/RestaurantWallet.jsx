import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosConfig';
import './RestaurantWallet.css';
import { toast } from 'react-hot-toast';

const RestaurantWallet = () => {
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const response = await axiosInstance.get('/wallet/admin/balance');

      if (response.data.success) {
        setWalletData(response.data.data);
      } else {
        toast.error('Failed to fetch wallet data');
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast.error('Error loading wallet information');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `Rs. ${parseFloat(amount).toFixed(2)}`;
  };

  if (loading) {
    return <div className="wallet-loading">Loading wallet information...</div>;
  }

  return (
    <div className="restaurant-wallet">
      <div className="wallet-header">
        <h2>Restaurant Wallet</h2>
      </div>

      {walletData && (
        <div className="wallet-overview">
          <div className="stats-grid">
            <div className="stat-card total-balance">
              <h3>Total Balance</h3>
              <p className="amount">{formatCurrency(walletData.balance.total)}</p>
            </div>
            <div className="stat-card online-payments">
              <h3>Online Payments</h3>
              <p className="amount">{formatCurrency(walletData.balance.onlinePayments)}</p>
            </div>
            <div className="stat-card cash-payments">
              <h3>Cash Payments</h3>
              <p className="amount">{formatCurrency(walletData.balance.cashPayments)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantWallet;
