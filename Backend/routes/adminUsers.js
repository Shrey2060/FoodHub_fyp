const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authenticateToken = require('../middleware/authenticateToken');
const { isAdmin } = require('../middleware/auth');

// Get all users
router.get('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [results] = await pool.query(`
            SELECT 
                u.id,
                u.name,
                u.email,
                u.role,
                u.created_at,
                u.is_active,
                COALESCE(rp.points_balance, 0) as reward_points,
                CASE 
                    WHEN s.id IS NOT NULL THEN true 
                    ELSE false 
                END as has_subscription
            FROM users u
            LEFT JOIN reward_points rp ON u.id = rp.user_id
            LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
            ORDER BY u.created_at DESC
        `);
        
        res.json({ 
            success: true, 
            users: results.map(user => ({
                ...user,
                is_active: Boolean(user.is_active),
                has_subscription: Boolean(user.has_subscription)
            }))
        });
    } catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).json({ success: false, message: "Database error." });
    }
});

// Toggle user active status
router.put('/:id/toggle-status', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if user exists
        const [user] = await pool.query(
            'SELECT * FROM users WHERE id = ?',
            [id]
        );
        
        if (user.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Prevent self-deactivation
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Cannot change your own active status'
            });
        }
        
        // Toggle the is_active status
        await pool.query(
            'UPDATE users SET is_active = NOT is_active WHERE id = ?',
            [id]
        );
        
        // Get the updated user status
        const [updatedUser] = await pool.query(
            'SELECT id, name, email, role, is_active FROM users WHERE id = ?',
            [id]
        );
        
        res.json({
            success: true,
            message: `User ${updatedUser[0].is_active ? 'activated' : 'deactivated'} successfully`,
            user: {
                ...updatedUser[0],
                is_active: Boolean(updatedUser[0].is_active)
            }
        });
    } catch (error) {
        console.error('Error toggling user status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user status'
        });
    }
});

// Delete user and all related data
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        const { id } = req.params;

        // Check if user exists
        const [userCheck] = await connection.query(
            'SELECT * FROM users WHERE id = ?',
            [id]
        );
        
        if (userCheck.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent self-deletion
        if (parseInt(id) === req.user.id) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account'
            });
        }

        // Delete all related data in order
        await connection.query('DELETE FROM reward_points WHERE user_id = ?', [id]);
        await connection.query('DELETE FROM Cart WHERE user_id = ?', [id]);
        await connection.query('DELETE FROM notifications WHERE user_id = ?', [id]);
        
        // Delete orders and order items
        const [orders] = await connection.query('SELECT id FROM orders WHERE user_id = ?', [id]);
        for (const order of orders) {
            await connection.query('DELETE FROM order_items WHERE order_id = ?', [order.id]);
        }
        await connection.query('DELETE FROM orders WHERE user_id = ?', [id]);

        // Delete pre-orders and pre-order items
        const [preOrders] = await connection.query('SELECT id FROM pre_orders WHERE user_id = ?', [id]);
        for (const preOrder of preOrders) {
            await connection.query('DELETE FROM pre_order_items WHERE pre_order_id = ?', [preOrder.id]);
        }
        await connection.query('DELETE FROM pre_orders WHERE user_id = ?', [id]);

        // Delete subscriptions
        await connection.query('DELETE FROM subscriptions WHERE user_id = ?', [id]);

        // Finally, delete the user
        const [userResult] = await connection.query('DELETE FROM users WHERE id = ?', [id]);

        if (userResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(500).json({
                success: false,
                message: 'Failed to delete user'
            });
        }

        await connection.commit();
        res.json({
            success: true,
            message: 'User and all related data deleted successfully'
        });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({
            success: false,
            message: 'Failed to delete user',
            error: error.message
        });
    } finally {
        connection.release();
    }
});

module.exports = router; 