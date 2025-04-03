const express = require('express');
const router = express.Router();
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'foodhub'
}).promise();

// Get all allergies
router.get('/allergies', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM allergies');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all dietary preferences
router.get('/dietary-preferences', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM dietary_preferences');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get filtered food items
router.get('/filtered-food', async (req, res) => {
    const { allergies, dietaryPreferences } = req.query;
    
    try {
        let query = 'SELECT DISTINCT f.* FROM food_items f';
        const params = [];

        if (allergies) {
            const allergyIds = allergies.split(',');
            query += ` LEFT JOIN food_allergies fa ON f.id = fa.food_id 
                      WHERE fa.allergy_id NOT IN (?)`;
            params.push(allergyIds);
        }

        if (dietaryPreferences) {
            const prefIds = dietaryPreferences.split(',');
            if (allergies) {
                query += ' AND';
            } else {
                query += ' WHERE';
            }
            query += ` f.id IN (
                SELECT food_id FROM food_dietary_preferences 
                WHERE dietary_preference_id IN (?)
            )`;
            params.push(prefIds);
        }

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;