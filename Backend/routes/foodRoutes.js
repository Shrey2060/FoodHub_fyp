const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Your MySQL connection

router.get('/food-items', async (req, res) => {
    try {
        let { diet } = req.query; // Example: ?diet=vegan,gluten-free
        if (!diet) {
            return res.status(400).json({ message: 'Dietary preference required' });
        }

        let dietArray = diet.split(','); // Convert to array
        let placeholders = dietArray.map(() => "JSON_CONTAINS(dietary_tags, ?)").join(" OR ");

        let query = `SELECT * FROM food_items WHERE ${placeholders}`;
        let results = await db.query(query, dietArray);

        res.json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
