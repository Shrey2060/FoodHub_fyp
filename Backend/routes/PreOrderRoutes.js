const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const auth = require('../middleware/auth');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'your_password',
    database: 'foodhub'
});

// Create pre-order
router.post('/', auth, async (req, res) => {
    const { scheduledTime, items, specialInstructions } = req.body;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Create pre-order
        const [order] = await connection.query(
            'INSERT INTO pre_orders (user_id, scheduled_time, special_instructions) VALUES (?, ?, ?)',
            [req.user.id, scheduledTime, specialInstructions]
        );

        // Add order items
        for (const item of items) {
            await connection.query(
                'INSERT INTO pre_order_items (pre_order_id, product_id, quantity) VALUES (?, ?, ?)',
                [order.insertId, item.productId, item.quantity]
            );
        }

        await connection.commit();
        res.json({ success: true, orderId: order.insertId });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, message: 'Error creating pre-order' });
    } finally {
        connection.release();
    }
});

// Get user's pre-orders
router.get('/', auth, async (req, res) => {
    try {
        const [orders] = await pool.query(
            `SELECT po.*, GROUP_CONCAT(p.name) as items
             FROM pre_orders po
             LEFT JOIN pre_order_items poi ON po.id = poi.pre_order_id
             LEFT JOIN products p ON poi.product_id = p.id
             WHERE po.user_id = ?
             GROUP BY po.id
             ORDER BY po.scheduled_time DESC`,
            [req.user.id]
        );
        res.json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching pre-orders' });
    }
});

module.exports = router;