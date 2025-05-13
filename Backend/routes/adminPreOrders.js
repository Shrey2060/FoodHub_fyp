const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authenticateToken = require('../middleware/authenticateToken');
const { isAdmin } = require('../middleware/auth');

// Get all pre-orders
router.get('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [preOrders] = await pool.query('SELECT * FROM pre_orders ORDER BY scheduled_date DESC');
        res.json({ success: true, preOrders });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// Get a single pre-order
router.get('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [preOrders] = await pool.query('SELECT * FROM pre_orders WHERE id = ?', [req.params.id]);
        if (preOrders.length === 0) return res.status(404).json({ success: false, message: 'Pre-order not found' });
        res.json({ success: true, preOrder: preOrders[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// Update a pre-order (only update provided fields)
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
    const updates = [];
    const values = [];
    if (req.body.order_status !== undefined) {
        updates.push('order_status = ?');
        values.push(req.body.order_status);
    }
    if (req.body.delivery_address !== undefined) {
        updates.push('delivery_address = ?');
        values.push(req.body.delivery_address);
    }
    if (req.body.scheduled_date !== undefined) {
        updates.push('scheduled_date = ?');
        values.push(req.body.scheduled_date);
    }
    if (req.body.delivery_time !== undefined) {
        updates.push('delivery_time = ?');
        values.push(req.body.delivery_time);
    }
    if (updates.length === 0) {
        return res.status(400).json({ success: false, message: 'No fields to update' });
    }
    values.push(req.params.id);

    try {
        console.log('Updating pre_order:', { updates, values });
        const [result] = await pool.query(
            `UPDATE pre_orders SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Pre-order not found' });
        res.json({ success: true, message: 'Pre-order updated' });
    } catch (err) {
        console.error('Error updating pre-order:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// Delete a pre-order
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM pre_orders WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Pre-order not found' });
        res.json({ success: true, message: 'Pre-order deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

module.exports = router; 