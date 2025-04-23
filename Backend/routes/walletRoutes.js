const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Create a connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_NAME || 'foodhub'
});

// Get admin wallet balance and transaction history
router.get('/admin/balance', authenticateToken, isAdmin, async (req, res) => {
    try {
        // Get total amount from paid orders
        const [totalResult] = await pool.query(`
            SELECT 
                SUM(total_amount) as totalAmount,
                COUNT(DISTINCT user_id) as totalCustomers,
                COUNT(id) as totalOrders,
                SUM(CASE WHEN payment_method = 'khalti' THEN total_amount ELSE 0 END) as onlinePayments,
                SUM(CASE WHEN payment_method = 'cash' THEN total_amount ELSE 0 END) as cashPayments
            FROM orders 
            WHERE payment_status = 'paid'
        `);

        // Get recent transactions
        const [recentTransactions] = await pool.query(`
            SELECT 
                o.id,
                o.total_amount,
                o.payment_method,
                o.created_at,
                u.name as customer_name
            FROM orders o
            JOIN users u ON o.user_id = u.id
            WHERE o.payment_status = 'paid'
            ORDER BY o.created_at DESC
            LIMIT 10
        `);

        // Get daily earnings for last 7 days
        const [dailyEarnings] = await pool.query(`
            SELECT 
                DATE(created_at) as date,
                SUM(total_amount) as amount,
                COUNT(*) as orders
            FROM orders
            WHERE payment_status = 'paid'
            AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `);

        res.json({
            success: true,
            data: {
                balance: {
                    total: totalResult[0].totalAmount || 0,
                    onlinePayments: totalResult[0].onlinePayments || 0,
                    cashPayments: totalResult[0].cashPayments || 0,
                    totalOrders: totalResult[0].totalOrders || 0,
                    totalCustomers: totalResult[0].totalCustomers || 0
                },
                recentTransactions,
                dailyEarnings
            }
        });
    } catch (error) {
        console.error('Error fetching wallet data:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching wallet data' 
        });
    }
});

// Get customer payment history
router.get('/admin/customers', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [customers] = await pool.query(`
            SELECT 
                u.id,
                u.name,
                u.email,
                COUNT(o.id) as total_orders,
                SUM(o.total_amount) as total_spent,
                MAX(o.created_at) as last_order_date
            FROM users u
            LEFT JOIN orders o ON u.id = o.user_id AND o.payment_status = 'paid'
            GROUP BY u.id, u.name, u.email
            ORDER BY total_spent DESC
        `);

        res.json({
            success: true,
            data: customers
        });
    } catch (error) {
        console.error('Error fetching customer payments:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching customer payments' 
        });
    }
});

module.exports = router;
