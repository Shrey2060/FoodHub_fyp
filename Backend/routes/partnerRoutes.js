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

// Get all partners
router.get('/', async (req, res) => {
    try {
        const [partners] = await pool.query(
            'SELECT * FROM local_partners ORDER BY is_featured DESC, rating DESC'
        );
        res.json({ success: true, partners });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching partners' 
        });
    }
});

// Get featured partners
router.get('/featured', async (req, res) => {
    try {
        const [partners] = await pool.query(
            'SELECT * FROM local_partners WHERE is_featured = true'
        );
        res.json({ success: true, partners });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching featured partners' 
        });
    }
});

// Get partner deals
router.get('/deals/:partnerId', async (req, res) => {
    try {
        const [deals] = await pool.query(
            `SELECT * FROM partner_deals 
             WHERE partner_id = ? AND is_active = true 
             AND start_date <= NOW() AND end_date >= NOW()`,
            [req.params.partnerId]
        );
        res.json({ success: true, deals });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching partner deals' 
        });
    }
});

module.exports = router;