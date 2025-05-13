const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_NAME || 'foodhub'
});

// Test route
router.get('/test', (req, res) => {
    res.json({ message: 'Delivery routes are working' });
});

// Get all deliveries
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [deliveries] = await pool.query('SELECT * FROM deliveries');
        res.json({ success: true, deliveries });
    } catch (error) {
        console.error('Error fetching deliveries:', error);
        res.status(500).json({ success: false, message: 'Error fetching deliveries' });
    }
});

// Get deliveries by order ID
router.get('/order/:orderId', authenticateToken, async (req, res) => {
    try {
        const [deliveries] = await pool.query(
            'SELECT * FROM deliveries WHERE order_id = ?',
            [req.params.orderId]
        );
        res.json({ success: true, deliveries });
    } catch (error) {
        console.error('Error fetching order deliveries:', error);
        res.status(500).json({ success: false, message: 'Error fetching order deliveries' });
    }
});

// Create a new delivery
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { order_id, delivery_address, delivery_status, estimated_delivery_time } = req.body;
        const [result] = await pool.query(
            'INSERT INTO deliveries (order_id, delivery_address, delivery_status, estimated_delivery_time) VALUES (?, ?, ?, ?)',
            [order_id, delivery_address, delivery_status, estimated_delivery_time]
        );
        res.status(201).json({ 
            success: true, 
            message: 'Delivery created successfully', 
            deliveryId: result.insertId 
        });
    } catch (error) {
        console.error('Error creating delivery:', error);
        res.status(500).json({ success: false, message: 'Error creating delivery' });
    }
});

// Update delivery status
router.patch('/:id/status', authenticateToken, async (req, res) => {
    try {
        const { status } = req.body;
        const [result] = await pool.query(
            'UPDATE deliveries SET delivery_status = ? WHERE id = ?',
            [status, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Delivery not found' });
        }
        res.json({ success: true, message: 'Delivery status updated successfully' });
    } catch (error) {
        console.error('Error updating delivery status:', error);
        res.status(500).json({ success: false, message: 'Error updating delivery status' });
    }
});

// Get delivery by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const [deliveries] = await pool.query(
            'SELECT * FROM deliveries WHERE id = ?',
            [req.params.id]
        );
        if (deliveries.length === 0) {
            return res.status(404).json({ success: false, message: 'Delivery not found' });
        }
        res.json({ success: true, delivery: deliveries[0] });
    } catch (error) {
        console.error('Error fetching delivery:', error);
        res.status(500).json({ success: false, message: 'Error fetching delivery' });
    }
});

module.exports = router; 