const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    console.log('Search query received:', query); // Debug log
    
    if (!query || query.length < 2) {
      return res.json({ success: true, items: [] });
    }

    const searchQuery = `
      SELECT 
        id,
        name,
        description,
        price,
        image_url,
        category
      FROM menu_items
      WHERE 
        LOWER(name) LIKE LOWER(?) OR
        LOWER(description) LIKE LOWER(?) OR
        LOWER(category) LIKE LOWER(?) OR
        LOWER(keywords) LIKE LOWER(?)
      LIMIT 10
    `;

    const searchPattern = `%${query}%`;
    const [results] = await db.query(searchQuery, [searchPattern, searchPattern, searchPattern, searchPattern]);
    
    console.log('Search results:', results); // Debug log

    res.json({
      success: true,
      items: results
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing search'
    });
  }
});

// Test endpoint to verify connection
router.get('/test-search', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM menu_items LIMIT 1');
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Test search error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;