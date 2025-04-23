const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const pool = require('../config/db');

// Get all subscription plans (public route)
router.get('/plans', async (req, res) => {
    try {
        const [plans] = await pool.query(
            'SELECT * FROM subscription_plans WHERE is_active = true ORDER BY price ASC'
        );
        
        // Format features into array
        const formattedPlans = plans.map(plan => ({
            ...plan,
            features: plan.features ? plan.features.split(',') : []
        }));

        res.json(formattedPlans); // Send the array directly
    } catch (error) {
        console.error('Error fetching subscription plans:', error);
        res.status(500).json({ error: 'Error fetching subscription plans' });
    }
});

// Get user's active subscription
router.get('/my-subscription', authenticateToken, async (req, res) => {
    try {
        const [subscriptions] = await pool.query(
            `SELECT s.*, p.name as plan_name, p.description as plan_description, 
                    p.price as plan_price, p.features
             FROM subscriptions s
             JOIN subscription_plans p ON s.plan_id = p.id
             WHERE s.user_id = ? AND s.status = 'active'
             ORDER BY s.created_at DESC
             LIMIT 1`,
            [req.user.id]
        );

        if (subscriptions.length === 0) {
            return res.json({ success: true, subscription: null });
        }

        const subscription = {
            ...subscriptions[0],
            features: subscriptions[0].features ? subscriptions[0].features.split(',') : []
        };

        res.json({ success: true, subscription });
    } catch (error) {
        console.error('Error fetching user subscription:', error);
        res.status(500).json({ success: false, message: 'Error fetching subscription' });
    }
});

// Subscribe to a plan
router.post('/subscribe', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { plan_id, payment_method } = req.body;

        // Verify plan exists and is active
        const [plans] = await connection.query(
            'SELECT * FROM subscription_plans WHERE id = ? AND is_active = true',
            [plan_id]
        );

        if (plans.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Subscription plan not found or inactive'
            });
        }

        const plan = plans[0];

        // Calculate end date and next billing date
        const now = new Date();
        const endDate = new Date(now);
        endDate.setMonth(endDate.getMonth() + plan.duration_months);
        
        const nextBillingDate = new Date(now);
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

        // Deactivate any existing active subscriptions
        await connection.query(
            `UPDATE subscriptions 
             SET status = 'expired', updated_at = NOW()
             WHERE user_id = ? AND status = 'active'`,
            [req.user.id]
        );

        // Create new subscription
        const [result] = await connection.query(
            `INSERT INTO subscriptions (
                user_id, plan_id, status, payment_method, 
                start_date, end_date, next_billing_date
            )
            VALUES (?, ?, 'active', ?, NOW(), ?, ?)`,
            [req.user.id, plan_id, payment_method, endDate, nextBillingDate]
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Successfully subscribed to plan',
            subscription_id: result.insertId,
            end_date: endDate,
            next_billing_date: nextBillingDate
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating subscription:', error);
        res.status(500).json({ success: false, message: 'Error creating subscription' });
    } finally {
        connection.release();
    }
});

// Cancel subscription
router.post('/cancel', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Check if user has an active subscription
        const [subscriptions] = await connection.query(
            'SELECT * FROM subscriptions WHERE user_id = ? AND status = "active"',
            [req.user.id]
        );

        if (subscriptions.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'No active subscription found'
            });
        }

        // Cancel the subscription
        await connection.query(
            `UPDATE subscriptions 
             SET status = 'cancelled', updated_at = NOW()
             WHERE user_id = ? AND status = 'active'`,
            [req.user.id]
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Subscription cancelled successfully'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error cancelling subscription:', error);
        res.status(500).json({ success: false, message: 'Error cancelling subscription' });
    } finally {
        connection.release();
    }
});

// Confirm subscription payment
router.post('/confirm', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { plan_id, payment_method } = req.body;

        // Verify plan exists and is active
        const [plans] = await connection.query(
            'SELECT * FROM subscription_plans WHERE id = ? AND is_active = true',
            [plan_id]
        );

        if (plans.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Subscription plan not found or inactive'
            });
        }

        const plan = plans[0];

        // Calculate end date and next billing date
        const now = new Date();
        const endDate = new Date(now);
        endDate.setMonth(endDate.getMonth() + plan.duration_months);
        
        const nextBillingDate = new Date(now);
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

        // Deactivate any existing active subscriptions
        await connection.query(
            `UPDATE subscriptions 
             SET status = 'expired', updated_at = NOW()
             WHERE user_id = ? AND status = 'active'`,
            [req.user.id]
        );

        // Create new subscription
        const [result] = await connection.query(
            `INSERT INTO subscriptions (
                user_id, plan_id, status, payment_method, 
                start_date, end_date, next_billing_date
            )
            VALUES (?, ?, 'active', ?, NOW(), ?, ?)`,
            [req.user.id, plan_id, payment_method, endDate, nextBillingDate]
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Subscription activated successfully',
            subscription_id: result.insertId,
            end_date: endDate,
            next_billing_date: nextBillingDate
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error activating subscription:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error activating subscription',
            error: error.message 
        });
    } finally {
        connection.release();
    }
});

// Get included items for a subscription plan
router.get('/included-items/:planId', authenticateToken, async (req, res) => {
    try {
        const { planId } = req.params;
        
        // First check if the plan exists
        const [planRows] = await pool.execute(
            'SELECT * FROM subscription_plans WHERE id = ?',
            [planId]
        );
        
        if (planRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Subscription plan not found'
            });
        }
        
        // Get items included in this subscription plan
        const [itemRows] = await pool.execute(
            `SELECT p.* 
             FROM products p 
             JOIN subscription_plan_items spi ON p.id = spi.product_id 
             WHERE spi.plan_id = ?`,
            [planId]
        );
        
        return res.json({
            success: true,
            items: itemRows
        });
    } catch (error) {
        console.error('Error fetching subscription plan items:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch subscription plan items'
        });
    }
});

// Admin Routes

// Get all subscriptions (admin only)
router.get('/admin/subscriptions', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [subscriptions] = await pool.query(
            `SELECT s.*, u.name as user_name, u.email as user_email,
                    p.name as plan_name, p.price, p.features, p.duration_months as duration
             FROM subscriptions s
             JOIN users u ON s.user_id = u.id
             JOIN subscription_plans p ON s.plan_id = p.id
             ORDER BY s.created_at DESC`
        );

        // Format the features as arrays
        const formattedSubscriptions = subscriptions.map(sub => ({
            ...sub,
            features: sub.features ? sub.features.split(',') : []
        }));

        res.json({ success: true, subscriptions: formattedSubscriptions });
    } catch (error) {
        console.error('Error fetching all subscriptions:', error);
        res.status(500).json({ success: false, message: 'Error fetching subscriptions' });
    }
});

// Cancel subscription (admin only)
router.put('/admin/:id/cancel', authenticateToken, isAdmin, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;

        // Check if subscription exists
        const [subscriptions] = await connection.query(
            'SELECT * FROM subscriptions WHERE id = ?',
            [id]
        );

        if (subscriptions.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Subscription not found'
            });
        }

        // Cancel the subscription
        await connection.query(
            `UPDATE subscriptions 
             SET status = 'cancelled', updated_at = NOW()
             WHERE id = ?`,
            [id]
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Subscription cancelled successfully'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error cancelling subscription:', error);
        res.status(500).json({ success: false, message: 'Error cancelling subscription' });
    } finally {
        connection.release();
    }
});

// Delete subscription (admin only)
router.delete('/admin/:id', authenticateToken, isAdmin, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;

        // Check if subscription exists
        const [subscriptions] = await connection.query(
            'SELECT * FROM subscriptions WHERE id = ?',
            [id]
        );

        if (subscriptions.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Subscription not found'
            });
        }

        // Delete the subscription
        await connection.query(
            'DELETE FROM subscriptions WHERE id = ?',
            [id]
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Subscription deleted successfully'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting subscription:', error);
        res.status(500).json({ success: false, message: 'Error deleting subscription' });
    } finally {
        connection.release();
    }
});

// Create subscription plan (admin only)
router.post('/admin/plans', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name, description, price, duration_months, features } = req.body;

        if (!name || !price || !duration_months) {
            return res.status(400).json({
                success: false,
                message: 'Name, price, and duration are required'
            });
        }

        const [result] = await pool.query(
            `INSERT INTO subscription_plans (
                name, description, price, duration_months, features
            )
            VALUES (?, ?, ?, ?, ?)`,
            [name, description, price, duration_months, features]
        );

        res.json({
            success: true,
            message: 'Subscription plan created successfully',
            plan_id: result.insertId
        });
    } catch (error) {
        console.error('Error creating subscription plan:', error);
        res.status(500).json({ success: false, message: 'Error creating subscription plan' });
    }
});

// Update subscription plan (admin only)
router.put('/admin/plans/:planId', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { planId } = req.params;
        const { name, description, price, duration_months, features, is_active } = req.body;

        const [result] = await pool.query(
            `UPDATE subscription_plans 
             SET name = ?, description = ?, price = ?, 
                 duration_months = ?, features = ?, is_active = ?
             WHERE id = ?`,
            [name, description, price, duration_months, features, is_active, planId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Subscription plan not found'
            });
        }

        res.json({
            success: true,
            message: 'Subscription plan updated successfully'
        });
    } catch (error) {
        console.error('Error updating subscription plan:', error);
        res.status(500).json({ success: false, message: 'Error updating subscription plan' });
    }
});

// Delete subscription plan (admin only)
router.delete('/admin/plans/:planId', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { planId } = req.params;

        // Instead of deleting, we'll mark it as inactive
        const [result] = await pool.query(
            'UPDATE subscription_plans SET is_active = false WHERE id = ?',
            [planId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Subscription plan not found'
            });
        }

        res.json({
            success: true,
            message: 'Subscription plan deactivated successfully'
        });
    } catch (error) {
        console.error('Error deactivating subscription plan:', error);
        res.status(500).json({ success: false, message: 'Error deactivating subscription plan' });
    }
});

module.exports = router; 