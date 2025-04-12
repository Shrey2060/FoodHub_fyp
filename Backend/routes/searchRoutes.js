const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/search', async (req, res) => {
  try {
    const { query, type = 'all' } = req.query;
    console.log('Search query received:', query, 'Type:', type); // Debug log
    
    if (!query || query.length < 2) {
      return res.json({ success: true, items: [] });
    }

    let searchQuery = `
      SELECT 
        id,
        name,
        description,
        price,
        image_url,
        category,
        keywords
      FROM menu_items
      WHERE 
    `;

    const searchPattern = `%${query}%`;
    let queryParams = [];

    switch (type) {
      case 'name':
        searchQuery += `LOWER(name) LIKE LOWER(?)`;
        queryParams.push(searchPattern);
        break;
      case 'keywords':
        searchQuery += `LOWER(keywords) LIKE LOWER(?)`;
        queryParams.push(searchPattern);
        break;
      default: // 'all'
        searchQuery += `
          LOWER(name) LIKE LOWER(?) OR
          LOWER(description) LIKE LOWER(?) OR
          LOWER(category) LIKE LOWER(?) OR
          LOWER(keywords) LIKE LOWER(?)
        `;
        queryParams = [searchPattern, searchPattern, searchPattern, searchPattern];
    }

    searchQuery += ` LIMIT 10`;

    const [results] = await db.query(searchQuery, queryParams);
    
    console.log('Search results:', results); // Debug log

    // Process keywords for better display
    const processedResults = results.map(item => ({
      ...item,
      keywords: item.keywords ? item.keywords.split(',').map(k => k.trim()).join(', ') : ''
    }));

    res.json({
      success: true,
      items: processedResults
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