const express = require('express');
const router = express.Router();
const db = require('../config/db');
const adminRoutes = require('./adminRoutes');
const authenticateToken = adminRoutes.authenticateToken;
const isAdmin = adminRoutes.isAdmin;

// Get all orders
router.get('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [orders] = await db.promise().query('SELECT * FROM orders ORDER BY created_at DESC');
        res.json({ success: true, orders });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// Get a single order
router.get('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [orders] = await db.promise().query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
        if (orders.length === 0) return res.status(404).json({ success: false, message: 'Order not found' });
        res.json({ success: true, order: orders[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// Update an order
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
    const { status, delivery_address, payment_status } = req.body;
    try {
        const [result] = await db.promise().query(
            'UPDATE orders SET status = ?, delivery_address = ?, payment_status = ? WHERE id = ?',
            [status, delivery_address, payment_status, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Order not found' });
        res.json({ success: true, message: 'Order updated' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// Delete an order (only if completed)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        // Check if the order is completed
        const [orders] = await db.promise().query('SELECT status FROM orders WHERE id = ?', [req.params.id]);
        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        if (orders[0].status !== 'completed') {
            return res.status(400).json({ success: false, message: 'Only completed orders can be deleted' });
        }

        // Proceed to delete
        const [result] = await db.promise().query('DELETE FROM orders WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        res.json({ success: true, message: 'Order deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

module.exports = router; 