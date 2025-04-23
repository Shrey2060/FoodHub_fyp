const { addRewardPoints } = require('./rewardController');

const completeOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id;

        // Get order details
        const [order] = await pool.query(
            'SELECT * FROM orders WHERE id = ? AND user_id = ?',
            [orderId, userId]
        );

        if (!order[0]) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Update order status
        await pool.query(
            'UPDATE orders SET status = ? WHERE id = ?',
            ['COMPLETED', orderId]
        );

        // Calculate and add reward points
        const orderAmount = order[0].total_amount;
        const orderType = order[0].order_type; // Assuming you have order_type in orders table
        await addRewardPoints(userId, orderId, orderAmount, orderType);

        res.json({ message: 'Order completed successfully' });
    } catch (error) {
        console.error('Error completing order:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}; 