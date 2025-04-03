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

// Get all bundles
router.get('/', async (req, res) => {
    try {
        const [bundles] = await pool.query(`
            SELECT b.*, GROUP_CONCAT(p.name) as items
            FROM food_bundles b
            LEFT JOIN bundle_items bi ON b.id = bi.bundle_id
            LEFT JOIN products p ON bi.product_id = p.id
            GROUP BY b.id
        `);
        res.json({ success: true, bundles });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching bundles' });
    }
});

// Get bundle details
router.get('/:id', async (req, res) => {
    try {
        const [bundle] = await pool.query(`
            SELECT b.*, 
                   JSON_ARRAYAGG(
                       JSON_OBJECT(
                           'product_id', p.id,
                           'name', p.name,
                           'quantity', bi.quantity
                       )
                   ) as items
            FROM food_bundles b
            LEFT JOIN bundle_items bi ON b.id = bi.bundle_id
            LEFT JOIN products p ON bi.product_id = p.id
            WHERE b.id = ?
            GROUP BY b.id
        `, [req.params.id]);
        
        res.json({ success: true, bundle: bundle[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching bundle details' });
    }
});

// Add bundle to cart
router.post('/add-bundle', auth, async (req, res) => {
    try {
        const { bundleId, name, price, discount_percentage, items, final_price } = req.body;
        const userId = req.user.id;

        // First, create cart entry if it doesn't exist
        await pool.query(`
            INSERT INTO carts (user_id, created_at)
            SELECT ?, NOW()
            WHERE NOT EXISTS (
                SELECT 1 FROM carts WHERE user_id = ?
            )
        `, [userId, userId]);

        // Get cart id
        const [cart] = await pool.query('SELECT id FROM carts WHERE user_id = ?', [userId]);
        const cartId = cart[0].id;

        // Add bundle to cart_items
        await pool.query(`
            INSERT INTO cart_items (cart_id, bundle_id, quantity, price, discount_percentage, final_price)
            VALUES (?, ?, 1, ?, ?, ?)
        `, [cartId, bundleId, price, discount_percentage, final_price]);

        // Add individual items from bundle to cart_bundle_items
        const [cartItem] = await pool.query('SELECT id FROM cart_items WHERE cart_id = ? AND bundle_id = ? ORDER BY id DESC LIMIT 1', 
            [cartId, bundleId]);
        
        for (const item of items) {
            await pool.query(`
                INSERT INTO cart_bundle_items (cart_item_id, product_id, quantity)
                VALUES (?, ?, ?)
            `, [cartItem[0].id, item.product_id, item.quantity]);
        }

        res.json({ success: true, message: 'Bundle added to cart successfully' });
    } catch (error) {
        console.error('Error adding bundle to cart:', error);
        res.status(500).json({ success: false, message: 'Failed to add bundle to cart' });
    }
});

module.exports = router;