const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Get user's order history
router.get('/history', auth, async (req, res) => {
    try {
        const [orders] = await db.query(
            `SELECT o.*, 
                    GROUP_CONCAT(
                        JSON_OBJECT(
                            'id', oi.id,
                            'name', p.name,
                            'price', oi.price,
                            'quantity', oi.quantity,
                            'image_url', p.image_url
                        )
                    ) as items
             FROM orders o
             LEFT JOIN order_items oi ON o.order_id = oi.order_id
             LEFT JOIN products p ON oi.product_id = p.id
             WHERE o.user_id = ?
             GROUP BY o.order_id
             ORDER BY o.created_at DESC`,
            [req.user.id]
        );

        // Parse the items string into JSON
        const ordersWithItems = orders.map(order => ({
            ...order,
            items: JSON.parse(`[${order.items}]`)
        }));

        res.json({ success: true, orders: ordersWithItems });
    } catch (error) {
        console.error('Error fetching order history:', error);
        res.status(500).json({ success: false, message: 'Error fetching orders' });
    }
});

// Create new order
router.post('/create', auth, async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { items, total_amount, delivery_address, contact_number, payment_method } = req.body;

        // Create order
        const [orderResult] = await connection.query(
            `INSERT INTO orders (user_id, total_amount, delivery_address, contact_number, payment_method)
             VALUES (?, ?, ?, ?, ?)`,
            [req.user.id, total_amount, delivery_address, contact_number, payment_method]
        );

        // Add order items
        for (const item of items) {
            await connection.query(
                `INSERT INTO order_items (order_id, product_id, quantity, price)
                 VALUES (?, ?, ?, ?)`,
                [orderResult.insertId, item.product_id, item.quantity, item.price]
            );
        }

        await connection.commit();
        res.json({ 
            success: true, 
            message: 'Order created successfully',
            order_id: orderResult.insertId
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating order:', error);
        res.status(500).json({ success: false, message: 'Error creating order' });
    } finally {
        connection.release();
    }
});

// Admin: Get all orders
router.get('/admin/orders', adminAuth, async (req, res) => {
    try {
        const [orders] = await db.query(
            `SELECT o.*, u.name as customer_name,
                    GROUP_CONCAT(
                        JSON_OBJECT(
                            'id', oi.id,
                            'name', p.name,
                            'price', oi.price,
                            'quantity', oi.quantity
                        )
                    ) as items
             FROM orders o
             JOIN users u ON o.user_id = u.id
             LEFT JOIN order_items oi ON o.order_id = oi.order_id
             LEFT JOIN products p ON oi.product_id = p.id
             GROUP BY o.order_id
             ORDER BY o.created_at DESC`
        );

        const ordersWithItems = orders.map(order => ({
            ...order,
            items: JSON.parse(`[${order.items}]`)
        }));

        res.json({ success: true, orders: ordersWithItems });
    } catch (error) {
        console.error('Error fetching admin orders:', error);
        res.status(500).json({ success: false, message: 'Error fetching orders' });
    }
});

// Admin: Update order status
router.put('/admin/orders/:orderId', adminAuth, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        await db.query(
            'UPDATE orders SET status = ? WHERE order_id = ?',
            [status, orderId]
        );

        res.json({ success: true, message: 'Order status updated' });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ success: false, message: 'Error updating order' });
    }
});

module.exports = router;