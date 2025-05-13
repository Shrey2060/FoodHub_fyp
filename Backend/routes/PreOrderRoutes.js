const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authenticateToken = require('../middleware/authenticateToken');
const { isAdmin } = require('../middleware/auth');
const nodemailer = require('nodemailer');

async function sendPreOrderDeliveredEmail(to, preOrderId) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    let mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: 'Your FoodHUB Pre-Order is Delivered!',
        text: `The delivery of your pre-order #${preOrderId} is completed. Thank you for ordering with FoodHUB!`
    };

    await transporter.sendMail(mailOptions);
}

// Create a new pre-order
router.post('/', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { items, scheduled_date, delivery_time, special_instructions, delivery_address } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Items array is required and cannot be empty' });
        }

        if (!scheduled_date || !delivery_time || !delivery_address) {
            return res.status(400).json({ message: 'Scheduled date, delivery time, and delivery address are required' });
        }

        await connection.beginTransaction();

        const [result] = await connection.query(
            'INSERT INTO pre_orders (user_id, scheduled_date, delivery_time, special_instructions, delivery_address) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, scheduled_date, delivery_time, special_instructions || null, delivery_address]
        );

        // Insert pre-order items
        for (const item of items) {
            await connection.query(
                `INSERT INTO pre_order_items (pre_order_id, product_id, quantity, price)
                 VALUES (?, ?, ?, ?)`,
                [result.insertId, item.product_id, item.quantity, item.price]
            );
        }

        await connection.commit();
        connection.release();

        res.status(201).json({
            success: true,
            message: "Pre-order scheduled successfully",
            pre_order_id: result.insertId
        });
    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error('Error creating pre-order:', error);
        res.status(500).json({
            success: false,
            message: "Failed to create pre-order",
            error: error.message,
            details: error.sqlMessage || error.message
        });
    }
});

// Get user's pre-orders
router.get('/', authenticateToken, async (req, res) => {
    try {
        const user_id = req.user.id;
        const [preOrders] = await pool.query(
            `SELECT po.*, 
                    GROUP_CONCAT(
                        JSON_OBJECT(
                            'product_id', poi.product_id,
                            'quantity', poi.quantity,
                            'price', poi.price,
                            'name', p.name,
                            'image_url', p.image_url
                        )
                    ) as items
             FROM pre_orders po
             LEFT JOIN pre_order_items poi ON po.id = poi.pre_order_id
             LEFT JOIN products p ON poi.product_id = p.id
             WHERE po.user_id = ?
             GROUP BY po.id
             ORDER BY po.scheduled_date DESC`,
            [user_id]
        );

        // Improved parsing of items array
        const formattedPreOrders = preOrders.map(order => {
            let parsedItems = [];
            try {
                // Only attempt to parse if items exists and is not null
                if (order.items) {
                    // Wrap in square brackets and parse as JSON array
                    parsedItems = JSON.parse('[' + order.items + ']');
                }
            } catch (error) {
                console.error(`Error parsing items for pre-order ${order.id}:`, error);
                console.error('Raw items data:', order.items);
                parsedItems = [];
            }
            
            return {
                ...order,
                items: parsedItems
            };
        });

        console.log('Sending formatted pre-orders:', formattedPreOrders);

        res.json({
            success: true,
            pre_orders: formattedPreOrders
        });
    } catch (error) {
        console.error('Error fetching pre-orders:', error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch pre-orders",
            error: error.message
        });
    }
});

// Get all pre-orders (admin route)
router.get('/admin', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [preOrders] = await pool.query(
            `SELECT po.*, 
                    u.name as customer_name,
                    u.email as customer_email,
                    po.delivery_address,
                    GROUP_CONCAT(
                        JSON_OBJECT(
                            'product_id', poi.product_id,
                            'quantity', poi.quantity,
                            'price', poi.price,
                            'name', p.name,
                            'image_url', p.image_url
                        )
                    ) as items
             FROM pre_orders po
             JOIN users u ON po.user_id = u.id
             LEFT JOIN pre_order_items poi ON po.id = poi.pre_order_id
             LEFT JOIN products p ON poi.product_id = p.id
             GROUP BY po.id, po.user_id, po.scheduled_date, po.delivery_time, 
                      po.special_instructions, po.order_status, po.created_at,
                      u.name, u.email
             ORDER BY po.scheduled_date DESC`,
        );

        // Improved parsing with better error handling
        const formattedPreOrders = preOrders.map(order => {
            let parsedItems = [];
            try {
                if (order.items) {
                    parsedItems = JSON.parse('[' + order.items + ']');
                }
            } catch (error) {
                console.error(`Error parsing items for admin pre-order ${order.id}:`, error);
                console.error('Raw items data:', order.items);
                parsedItems = [];
            }
            
            return {
                ...order,
                items: parsedItems
            };
        });

        console.log('Sending admin pre-orders:', formattedPreOrders.length);

        res.json({
            success: true,
            pre_orders: formattedPreOrders
        });
    } catch (error) {
        console.error('Error fetching pre-orders:', error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch pre-orders",
            error: error.message
        });
    }
});

// Update pre-order status (for admin)
router.patch('/:id/status', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status"
            });
        }

        const [result] = await pool.query(
            'UPDATE pre_orders SET order_status = ? WHERE id = ?',
            [status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Pre-order not found"
            });
        }

        if (status === 'delivered') {
            // Fetch user's email
            const [userRows] = await pool.query(
                'SELECT u.email FROM pre_orders po JOIN users u ON po.user_id = u.id WHERE po.id = ?',
                [id]
            );
            if (userRows.length > 0) {
                try {
                    await sendPreOrderDeliveredEmail(userRows[0].email, id);
                } catch (emailErr) {
                    console.error('Failed to send pre-order delivered email:', emailErr);
                }
            }
        }

        res.json({
            success: true,
            message: "Pre-order status updated successfully"
        });
    } catch (error) {
        console.error('Error updating pre-order status:', error);
        res.status(500).json({
            success: false,
            message: "Failed to update pre-order status",
            error: error.message
        });
    }
});

// Delete pre-order
router.delete('/:id', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const user_id = req.user.id;

        // Check if the pre-order exists and belongs to the user
        const [preOrder] = await connection.query(
            'SELECT * FROM pre_orders WHERE id = ? AND user_id = ?',
            [id, user_id]
        );

        if (!preOrder.length) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: "Pre-order not found or unauthorized"
            });
        }

        // Delete pre-order items first
        await connection.query(
            'DELETE FROM pre_order_items WHERE pre_order_id = ?',
            [id]
        );

        // Delete the pre-order
        await connection.query(
            'DELETE FROM pre_orders WHERE id = ?',
            [id]
        );

        await connection.commit();
        res.json({
            success: true,
            message: "Pre-order deleted successfully"
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting pre-order:', error);
        res.status(500).json({
            success: false,
            message: "Failed to delete pre-order",
            error: error.message
        });
    } finally {
        connection.release();
    }
});

// Admin: Delete pre-order
router.delete('/admin/:id', authenticateToken, isAdmin, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;

        // Check if the pre-order exists
        const [preOrder] = await connection.query(
            'SELECT * FROM pre_orders WHERE id = ?',
            [id]
        );

        if (!preOrder.length) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: "Pre-order not found"
            });
        }

        // Delete pre-order items first
        await connection.query(
            'DELETE FROM pre_order_items WHERE pre_order_id = ?',
            [id]
        );

        // Delete the pre-order
        await connection.query(
            'DELETE FROM pre_orders WHERE id = ?',
            [id]
        );

        await connection.commit();
        res.json({
            success: true,
            message: "Pre-order deleted successfully"
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting pre-order:', error);
        res.status(500).json({
            success: false,
            message: "Failed to delete pre-order",
            error: error.message
        });
    } finally {
        connection.release();
    }
});

module.exports = router;