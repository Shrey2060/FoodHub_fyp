const pool = require('../config/database');
const { calculateRewardPoints } = require('../utils/rewardUtils');

// Get user's reward points
const getUserRewardPoints = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get user's reward points
        const [rewardPoints] = await pool.query(
            'SELECT * FROM reward_points WHERE user_id = ?',
            [userId]
        );

        // Get reward settings
        const [settings] = await pool.query('SELECT * FROM reward_settings LIMIT 1');
        
        // Get recent transactions
        const [transactions] = await pool.query(
            'SELECT * FROM reward_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
            [userId]
        );

        const rewardData = {
            current_points: rewardPoints[0]?.current_points || 0,
            total_points_earned: rewardPoints[0]?.total_points_earned || 0,
            total_points_redeemed: rewardPoints[0]?.total_points_redeemed || 0,
            min_points_to_redeem: settings[0]?.min_points_to_redeem || 1000,
            redeemable_value: (rewardPoints[0]?.current_points || 0) / (settings[0]?.points_to_rupee_ratio || 100),
            transactions: transactions
        };

        res.json(rewardData);
    } catch (error) {
        console.error('Error fetching reward points:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Add reward points after purchase
const addRewardPoints = async (userId, orderId, orderAmount, orderType) => {
    try {
        // Get reward settings
        const [settings] = await pool.query('SELECT * FROM reward_settings LIMIT 1');
        
        // Calculate points based on order amount and type
        const basePoints = Math.floor(orderAmount * settings[0].points_per_rupee);
        let bonusPoints = 0;

        // Apply bonus based on order type
        switch (orderType) {
            case 'RESTAURANT':
                bonusPoints = Math.floor(basePoints * (settings[0].restaurant_bonus_percentage / 100));
                break;
            case 'CAFE':
                bonusPoints = Math.floor(basePoints * (settings[0].cafe_bonus_percentage / 100));
                break;
            case 'FAST_FOOD':
                bonusPoints = Math.floor(basePoints * (settings[0].fast_food_bonus_percentage / 100));
                break;
        }

        const totalPoints = basePoints + bonusPoints;

        // Update or insert reward points
        await pool.query(
            `INSERT INTO reward_points (user_id, current_points, total_points_earned) 
             VALUES (?, ?, ?) 
             ON DUPLICATE KEY UPDATE 
             current_points = current_points + ?, 
             total_points_earned = total_points_earned + ?`,
            [userId, totalPoints, totalPoints, totalPoints, totalPoints]
        );

        // Record transaction
        await pool.query(
            'INSERT INTO reward_transactions (user_id, points, transaction_type, description, order_id) VALUES (?, ?, ?, ?, ?)',
            [userId, totalPoints, 'EARNED', `Earned ${totalPoints} points for order #${orderId}`, orderId]
        );

        return totalPoints;
    } catch (error) {
        console.error('Error adding reward points:', error);
        throw error;
    }
};

// Redeem reward points
const redeemRewardPoints = async (userId, pointsToRedeem, orderId) => {
    try {
        // Get reward settings
        const [settings] = await pool.query('SELECT * FROM reward_settings LIMIT 1');
        
        // Get current points
        const [rewardPoints] = await pool.query(
            'SELECT current_points FROM reward_points WHERE user_id = ?',
            [userId]
        );

        if (!rewardPoints[0] || rewardPoints[0].current_points < pointsToRedeem) {
            throw new Error('Insufficient points');
        }

        // Update reward points
        await pool.query(
            'UPDATE reward_points SET current_points = current_points - ?, total_points_redeemed = total_points_redeemed + ? WHERE user_id = ?',
            [pointsToRedeem, pointsToRedeem, userId]
        );

        // Record transaction
        await pool.query(
            'INSERT INTO reward_transactions (user_id, points, transaction_type, description, order_id) VALUES (?, ?, ?, ?, ?)',
            [userId, -pointsToRedeem, 'REDEEMED', `Redeemed ${pointsToRedeem} points for order #${orderId}`, orderId]
        );

        // Calculate discount amount
        const discountAmount = pointsToRedeem / settings[0].points_to_rupee_ratio;

        return discountAmount;
    } catch (error) {
        console.error('Error redeeming reward points:', error);
        throw error;
    }
};

// Cancel reward points when order is cancelled
const cancelRewardPoints = async (userId, orderId) => {
    try {
        // Get the reward transaction for this order
        const [transaction] = await pool.query(
            'SELECT points_earned FROM reward_transactions WHERE user_id = ? AND order_id = ? AND transaction_type = ?',
            [userId, orderId, 'EARNED']
        );

        if (!transaction[0]) {
            console.log('No reward points found for this order');
            return 0;
        }

        const pointsToCancel = transaction[0].points_earned;

        // Update reward points in user_rewards table
        await pool.query(
            `UPDATE user_rewards 
             SET points_balance = points_balance - ?, 
                 total_points_earned = total_points_earned - ? 
             WHERE user_id = ?`,
            [pointsToCancel, pointsToCancel, userId]
        );

        // Record cancellation transaction
        await pool.query(
            'INSERT INTO reward_transactions (user_id, transaction_type, points_redeemed, description, order_id) VALUES (?, ?, ?, ?, ?)',
            [userId, 'CANCELLED', pointsToCancel, `Points cancelled for cancelled order #${orderId}`, orderId]
        );

        return pointsToCancel;
    } catch (error) {
        console.error('Error cancelling reward points:', error);
        throw error;
    }
};

// Clear reward history
const clearRewardHistory = async (req, res) => {
    try {
        const userId = req.user.id;

        // Delete all reward transactions for the user
        await pool.query(
            'DELETE FROM reward_transactions WHERE user_id = ?',
            [userId]
        );

        res.json({ 
            success: true, 
            message: 'Reward history cleared successfully' 
        });
    } catch (error) {
        console.error('Error clearing reward history:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error clearing reward history' 
        });
    }
};

module.exports = {
    getUserRewardPoints,
    addRewardPoints,
    redeemRewardPoints,
    cancelRewardPoints,
    clearRewardHistory
}; 