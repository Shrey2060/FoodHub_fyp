const express = require('express');
const router = express.Router();

// Placeholder routes - these will be implemented later
router.get('/', (req, res) => {
    res.json({ message: 'Admin products route' });
});

module.exports = router; 