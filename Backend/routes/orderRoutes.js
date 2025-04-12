const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const axios = require('axios');
require('dotenv').config();

// Create a connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_NAME || 'foodhub'
});

// Khalti API configuration
const KHALTI_API_KEY = process.env.KHALTI_SECRET_KEY;
const KHALTI_REFUND_API = 'https://khalti.com/api/v2/refund/';
const KHALTI_VERIFICATION_API = 'https://khalti.com/api/v2/payment/verify/';

// Test route to verify the router is working
router.get('/test', (req, res) => {
    res.json({ message: 'Order routes are working' });
});

// Get user's order history
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const [orders] = await pool.query(
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
             LEFT JOIN order_items oi ON o.id = oi.order_id
             LEFT JOIN products p ON oi.product_id = p.id
             WHERE o.user_id = ?
             GROUP BY o.id
             ORDER BY o.created_at DESC`,
            [req.user.id]
        );

        // Parse the items string into JSON and handle null case
        const ordersWithItems = orders.map(order => {
            try {
                return {
                    ...order,
                    items: order.items ? JSON.parse(`[${order.items}]`) : []
                };
            } catch (error) {
                console.error('Error parsing order items:', error);
                return {
                    ...order,
                    items: []
                };
            }
        });

        console.log('Sending orders:', ordersWithItems);
        res.json({ success: true, orders: ordersWithItems });
    } catch (error) {
        console.error('Error fetching order history:', error);
        res.status(500).json({ success: false, message: 'Error fetching orders' });
    }
});

// Create new order
router.post('/create', authenticateToken, async (req, res) => {
    console.log('Create order route hit');
    console.log('Request body:', req.body);
    
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { items, total_amount, delivery_address, contact_number, payment_method } = req.body;
        
        console.log('Received order data:', {
            items,
            total_amount,
            delivery_address,
            contact_number,
            payment_method,
            user_id: req.user.id
        });

        // Create order with is_confirmed set to FALSE by default
        const [orderResult] = await connection.query(
            `INSERT INTO orders (
                user_id, 
                total_amount, 
                delivery_address,
                contact_number, 
                payment_method, 
                status,
                is_confirmed
            )
            VALUES (?, ?, ?, ?, ?, 'pending', FALSE)`,
            [req.user.id, total_amount, delivery_address, contact_number, payment_method]
        );

        console.log('Order created with ID:', orderResult.insertId);

        // Add order items
        for (const item of items) {
            await connection.query(
                `INSERT INTO order_items (order_id, product_id, quantity, price)
                 VALUES (?, ?, ?, ?)`,
                [orderResult.insertId, item.product_id, item.quantity, item.price]
            );
            console.log('Added order item:', item);
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

// Get single order by ID
router.get('/:orderId', authenticateToken, async (req, res) => {
    try {
        const [orders] = await pool.query(
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
             LEFT JOIN order_items oi ON o.id = oi.order_id
             LEFT JOIN products p ON oi.product_id = p.id
             WHERE o.id = ? AND o.user_id = ?
             GROUP BY o.id`,
            [req.params.orderId, req.user.id]
        );

        if (!orders || orders.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Order not found' 
            });
        }

        // Parse the items string into JSON
        const order = {
            ...orders[0],
            items: orders[0].items ? JSON.parse(`[${orders[0].items}]`) : []
        };

        res.json({ success: true, order });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ success: false, message: 'Error fetching order' });
    }
});

// Admin: Get all orders (only confirmed orders)
router.get('/admin/all', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [orders] = await pool.query(
            `SELECT o.*, u.name as customer_name,
                    GROUP_CONCAT(
                        JSON_OBJECT(
                            'id', oi.id,
                            'product_id', oi.product_id,
                            'name', p.name,
                            'price', oi.price,
                            'quantity', oi.quantity,
                            'image_url', p.image_url
                        )
                    ) as items
             FROM orders o
             JOIN users u ON o.user_id = u.id
             LEFT JOIN order_items oi ON o.id = oi.order_id
             LEFT JOIN products p ON oi.product_id = p.id
             WHERE o.is_confirmed = TRUE
             GROUP BY o.id, o.status, o.total_amount, o.contact_number, 
                      o.payment_method, o.delivery_address, o.created_at,
                      o.user_id, u.name
             ORDER BY o.created_at DESC`
        );

        const ordersWithItems = orders.map(order => ({
            ...order,
            items: order.items ? JSON.parse(`[${order.items}]`) : []
        }));

        res.json({ success: true, orders: ordersWithItems });
    } catch (error) {
        console.error('Error fetching admin orders:', error);
        res.status(500).json({ success: false, message: 'Error fetching orders' });
    }
});

// Admin: Update order
router.put('/admin/:orderId', authenticateToken, isAdmin, async (req, res) => {
    console.log('Update order request received:', {
        orderId: req.params.orderId,
        body: req.body
    });

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { orderId } = req.params;
        const { status, contact_number, payment_method, delivery_address } = req.body;

        // Validate required fields
        if (!status || !contact_number || !payment_method || !delivery_address) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Validate status
        const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
            });
        }

        // Get the current order status
        const [currentOrder] = await connection.query(
            'SELECT status, user_id FROM orders WHERE id = ?',
            [orderId]
        );

        if (!currentOrder[0]) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Update order
        const [result] = await connection.query(
            `UPDATE orders 
             SET status = ?, 
                 contact_number = ?,
                 payment_method = ?,
                 delivery_address = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [status, contact_number, payment_method, delivery_address, orderId]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // If status has changed, create a notification
        let notificationMessage = null;
        if (currentOrder[0].status !== status) {
            notificationMessage = getStatusNotificationMessage(status);
            if (notificationMessage) {
                await connection.query(
                    `INSERT INTO notifications (user_id, message, type, order_id, is_read, created_at)
                     VALUES (?, ?, ?, ?, FALSE, CURRENT_TIMESTAMP)`,
                    [currentOrder[0].user_id, notificationMessage, 'order_status', orderId]
                );
            }
        }

        // Fetch updated order with all details
        const [updatedOrder] = await connection.query(
            `SELECT o.*, u.name as customer_name,
                    GROUP_CONCAT(
                        JSON_OBJECT(
                            'id', oi.id,
                            'product_id', oi.product_id,
                            'name', p.name,
                            'price', oi.price,
                            'quantity', oi.quantity,
                            'image_url', p.image_url
                        )
                    ) as items
             FROM orders o
             JOIN users u ON o.user_id = u.id
             LEFT JOIN order_items oi ON o.id = oi.order_id
             LEFT JOIN products p ON oi.product_id = p.id
             WHERE o.id = ?
             GROUP BY o.id, o.status, o.total_amount, o.contact_number, 
                      o.payment_method, o.delivery_address, o.created_at,
                      o.user_id, u.name`,
            [orderId]
        );

        await connection.commit();

        const orderWithItems = {
            ...updatedOrder[0],
            items: updatedOrder[0].items ? JSON.parse(`[${updatedOrder[0].items}]`) : []
        };

        console.log('Order updated successfully:', orderWithItems);

        res.json({
            success: true,
            message: 'Order updated successfully',
            order: orderWithItems,
            notification: notificationMessage
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error updating order:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating order'
        });
    } finally {
        connection.release();
    }
});

// Helper function to get notification message based on status
function getStatusNotificationMessage(status) {
    switch (status) {
        case 'processing':
            return 'Your order is now being processed! We\'ll start preparing your delicious food soon.';
        case 'completed':
            return 'Great news! Your order has been delivered. Enjoy your meal!';
        case 'cancelled':
            return 'Your order has been cancelled. We apologize for any inconvenience.';
        default:
            return null;
    }
}

// Get user's notifications
router.get('/notifications', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const [notifications] = await connection.query(
            `SELECT * FROM notifications 
             WHERE user_id = ? 
             ORDER BY created_at DESC 
             LIMIT 50`,
            [req.user.id]
        );
        res.json({ success: true, notifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ success: false, message: 'Error fetching notifications' });
    } finally {
        connection.release();
    }
});

// Mark notification as read
router.put('/notifications/:notificationId/read', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const [result] = await connection.query(
            'UPDATE notifications SET read = true WHERE id = ? AND user_id = ?',
            [req.params.notificationId, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found or unauthorized'
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ success: false, message: 'Error updating notification' });
    } finally {
        connection.release();
    }
});

// Admin: Delete order
router.delete('/admin/:orderId', authenticateToken, isAdmin, async (req, res) => {
    console.log('Delete order request received:', {
        orderId: req.params.orderId,
        adminId: req.user.id
    });

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { orderId } = req.params;

        // First, check if the order exists and get its details
        const [orderCheck] = await connection.query(
            'SELECT * FROM orders WHERE id = ?',
            [orderId]
        );

        if (!orderCheck[0]) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Delete notifications related to this order
        await connection.query(
            'DELETE FROM notifications WHERE order_id = ?',
            [orderId]
        );

        // Delete order items
        const [deletedItems] = await connection.query(
            'DELETE FROM order_items WHERE order_id = ?',
            [orderId]
        );
        console.log(`Deleted ${deletedItems.affectedRows} order items`);

        // Delete the order
        const [result] = await connection.query(
            'DELETE FROM orders WHERE id = ?',
            [orderId]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Failed to delete order'
            });
        }

        await connection.commit();
        console.log('Order and related data deleted successfully:', orderId);

        res.json({
            success: true,
            message: 'Order and all related data deleted successfully'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting order:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while deleting order'
        });
    } finally {
        connection.release();
    }
});

// User: Confirm order
router.put('/:orderId/confirm', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { orderId } = req.params;
        const { payment_method } = req.body;

        // Check if order exists and belongs to the user
        const [order] = await connection.query(
            'SELECT * FROM orders WHERE id = ? AND user_id = ?',
            [orderId, req.user.id]
        );

        if (!order[0]) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order[0].is_confirmed) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Order is already confirmed'
            });
        }

        // Update order to confirmed status with payment method
        const [result] = await connection.query(
            `UPDATE orders 
             SET is_confirmed = TRUE,
                 status = 'processing',
                 payment_method = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND user_id = ?`,
            [payment_method, orderId, req.user.id]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Failed to confirm order'
            });
        }

        // Create a notification for the admin
        await connection.query(
            `INSERT INTO notifications (user_id, message, type, order_id, is_read)
             VALUES (?, ?, ?, ?, FALSE)`,
            [req.user.id, 'New order confirmed and ready for processing', 'order_confirmation', orderId]
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Order confirmed successfully'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error confirming order:', error);
        res.status(500).json({
            success: false,
            message: 'Error confirming order'
        });
    } finally {
        connection.release();
    }
});

// User: Cancel order
router.put('/:orderId/cancel', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { orderId } = req.params;

        // Check if order exists and belongs to the user
        const [order] = await connection.query(
            'SELECT * FROM orders WHERE id = ? AND user_id = ?',
            [orderId, req.user.id]
        );

        if (!order[0]) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if order can be cancelled (only completed orders cannot be cancelled)
        if (order[0].status === 'completed' || order[0].status === 'cancelled') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Order cannot be cancelled at this stage'
            });
        }

        // Update order status to cancelled
        const [result] = await connection.query(
            `UPDATE orders 
             SET status = 'cancelled',
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND user_id = ?`,
            [orderId, req.user.id]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Failed to cancel order'
            });
        }

        // Create a notification for the admin
        await connection.query(
            `INSERT INTO notifications (user_id, message, type, order_id, is_read)
             VALUES (?, ?, ?, ?, FALSE)`,
            [req.user.id, 'Order has been cancelled by the customer', 'order_cancelled', orderId]
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Order cancelled successfully'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error cancelling order:', error);
        res.status(500).json({
            success: false,
            message: 'Error cancelling order'
        });
    } finally {
        connection.release();
    }
});

// User: Remove cancelled order
router.delete('/:orderId', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { orderId } = req.params;

        // Check if order exists, belongs to the user, and is cancelled
        const [order] = await connection.query(
            'SELECT * FROM orders WHERE id = ? AND user_id = ?',
            [orderId, req.user.id]
        );

        if (!order[0]) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order[0].status !== 'cancelled') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Only cancelled orders can be removed'
            });
        }

        // Delete notifications related to this order
        await connection.query(
            'DELETE FROM notifications WHERE order_id = ?',
            [orderId]
        );

        // Delete order items
        await connection.query(
            'DELETE FROM order_items WHERE order_id = ?',
            [orderId]
        );

        // Delete the order
        const [result] = await connection.query(
            'DELETE FROM orders WHERE id = ? AND user_id = ?',
            [orderId, req.user.id]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Failed to remove order'
            });
        }

        await connection.commit();
        res.json({
            success: true,
            message: 'Order removed successfully'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error removing order:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing order'
        });
    } finally {
        connection.release();
    }
});

// Khalti payment verification and storage
router.post('/verify-khalti', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { token, amount, orderId } = req.body;

        // Verify with Khalti
        const verificationResponse = await axios.post(
            'https://khalti.com/api/v2/payment/verify/',
            {
                token: token,
                amount: amount
            },
            {
                headers: {
                    'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (verificationResponse.data && verificationResponse.data.idx) {
            await connection.beginTransaction();

            // Store payment information
            await connection.query(
                `INSERT INTO payments (order_id, khalti_token, khalti_idx, amount, status) 
                 VALUES (?, ?, ?, ?, ?)`,
                [orderId, token, verificationResponse.data.idx, amount/100, 'completed']
            );

            // Update order status and payment information
            await connection.query(
                `UPDATE orders 
                 SET payment_status = 'paid',
                     payment_method = 'khalti',
                     is_confirmed = TRUE,
                     status = 'processing',
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [orderId]
            );

            // Create a notification for the admin
            await connection.query(
                `INSERT INTO notifications (user_id, message, type, order_id, is_read)
                 VALUES (?, ?, ?, ?, FALSE)`,
                [req.user.id, 'New order confirmed and ready for processing', 'order_confirmation', orderId]
            );

            await connection.commit();

            res.json({
                success: true,
                message: 'Payment verified and stored successfully',
                data: {
                    idx: verificationResponse.data.idx,
                    amount: amount,
                    status: 'completed',
                    order_id: orderId
                }
            });
        } else {
            throw new Error('Payment verification failed');
        }
    } catch (error) {
        await connection.rollback();
        console.error('Payment verification error:', error.response?.data || error);
        res.status(500).json({
            success: false,
            message: error.response?.data?.message || 'Payment verification failed'
        });
    } finally {
        connection.release();
    }
});

// Update the refund route
router.post('/:orderId/refund', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { orderId } = req.params;
        
        await connection.beginTransaction();

        // Get payment details
        const [payments] = await connection.query(
            `SELECT p.*, o.total_amount 
             FROM payments p 
             JOIN orders o ON p.order_id = o.id 
             WHERE o.id = ? AND o.payment_method = 'khalti'`,
            [orderId]
        );

        if (!payments || payments.length === 0) {
            throw new Error('Payment information not found');
        }

        const payment = payments[0];

        // Process refund with Khalti
        const refundResponse = await axios.post(
            'https://khalti.com/api/v2/refund/',
            {
                idx: payment.khalti_idx,
                amount: Math.round(payment.total_amount * 100), // Convert to paisa
                remarks: `Refund for order #${orderId}`
            },
            {
                headers: {
                    'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (refundResponse.data && refundResponse.data.refund_key) {
            // Update payment and order status
            await connection.query(
                `UPDATE payments SET status = 'refunded' WHERE order_id = ?`,
                [orderId]
            );

            await connection.query(
                `UPDATE orders 
                 SET refund_status = 'refunded',
                     refund_date = NOW(),
                     refund_amount = ?
                 WHERE id = ?`,
                [payment.total_amount, orderId]
            );

            await connection.commit();

            res.json({
                success: true,
                message: 'Refund processed successfully',
                refund_key: refundResponse.data.refund_key
            });
        } else {
            throw new Error('Refund failed');
        }
    } catch (error) {
        await connection.rollback();
        console.error('Refund error:', error.response?.data || error);
        res.status(500).json({
            success: false,
            message: error.response?.data?.message || 'Failed to process refund'
        });
    } finally {
        connection.release();
    }
});

// Admin: Confirm order
router.post('/admin/:orderId/confirm', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { orderId } = req.params;
        
        // Update the order to be confirmed
        await pool.query(
            'UPDATE orders SET is_confirmed = TRUE WHERE id = ?',
            [orderId]
        );

        res.json({ 
            success: true, 
            message: 'Order confirmed successfully' 
        });
    } catch (error) {
        console.error('Error confirming order:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error confirming order' 
        });
    }
});

module.exports = router;