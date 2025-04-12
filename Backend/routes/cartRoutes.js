const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authenticateToken = require('../middleware/authenticateToken');

// Get cart items for the current user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('Fetching cart items for user:', userId);

        const [cartItems] = await pool.query(
            `SELECT cart_item_id, product_id, name, description, price, quantity, image_url 
             FROM Cart 
             WHERE user_id = ?`,
            [userId]
        );

        res.json({
            success: true,
            cartItems: cartItems
        });
    } catch (error) {
        console.error('Error fetching cart items:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch cart items'
        });
    }
});

// Add item to cart
router.post('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { product_id, quantity, price, name, description, image_url } = req.body;

        // Validate required fields
        if (!product_id || !price || !name) {
            console.error('Missing required fields:', { product_id, price, name });
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: product_id, price, or name'
            });
        }

        // Log input validation
        console.log('Input validation:', {
            product_id: typeof product_id,
            price: typeof price,
            quantity: typeof quantity,
            userId: typeof userId
        });

        // Check if the item already exists in the cart
        const [existingItems] = await pool.query(
            'SELECT cart_item_id, quantity FROM Cart WHERE user_id = ? AND product_id = ?',
            [userId, product_id]
        );

        console.log('Existing items check:', {
            found: existingItems.length > 0,
            existingItems
        });

        let cartItemId;
        const finalQuantity = quantity || 1;
        const finalPrice = parseFloat(price);
        const finalProductId = parseInt(product_id);

        if (existingItems.length > 0) {
            // Update quantity if item exists
            const newQuantity = existingItems[0].quantity + finalQuantity;
            console.log('Updating existing item:', {
                cartItemId: existingItems[0].cart_item_id,
                newQuantity
            });

            await pool.query(
                'UPDATE Cart SET quantity = ? WHERE cart_item_id = ?',
                [newQuantity, existingItems[0].cart_item_id]
            );
            cartItemId = existingItems[0].cart_item_id;
        } else {
            // Insert new item if it doesn't exist
            console.log('Inserting new item:', {
                userId,
                finalProductId,
                name,
                finalPrice,
                finalQuantity
            });

            const [result] = await pool.query(
                `INSERT INTO Cart (user_id, product_id, name, description, price, quantity, image_url) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [userId, finalProductId, name, description || '', finalPrice, finalQuantity, image_url || '']
            );
            cartItemId = result.insertId;
        }

        console.log('Operation successful:', {
            cartItemId,
            action: existingItems.length > 0 ? 'updated' : 'inserted'
        });

        res.json({
            success: true,
            message: 'Item added to cart successfully',
            cartItemId: cartItemId
        });
    } catch (error) {
        console.error('Detailed error in add to cart:', {
            error: error.message,
            stack: error.stack,
            sqlMessage: error.sqlMessage,
            sqlState: error.sqlState
        });
        
        res.status(500).json({
            success: false,
            message: 'Failed to add item to cart',
            error: error.message,
            sqlError: error.sqlMessage
        });
    }
});

// Update cart item quantity
router.put('/:cartItemId', authenticateToken, async (req, res) => {
    try {
        const { cartItemId } = req.params;
        const { quantity } = req.body;
        const userId = req.user.id;

        // Verify the cart item belongs to the user
        const [cartItem] = await pool.query(
            'SELECT cart_item_id FROM Cart WHERE cart_item_id = ? AND user_id = ?',
            [cartItemId, userId]
        );

        if (cartItem.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cart item not found'
            });
        }

        await pool.query(
            'UPDATE Cart SET quantity = ? WHERE cart_item_id = ?',
            [quantity, cartItemId]
        );

        res.json({
            success: true,
            message: 'Cart item updated successfully'
        });
    } catch (error) {
        console.error('Error updating cart item:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update cart item'
        });
    }
});

// Remove item from cart
router.delete('/:cartItemId', authenticateToken, async (req, res) => {
    try {
        const { cartItemId } = req.params;
        const userId = req.user.id;

        // Verify the cart item belongs to the user
        const [cartItem] = await pool.query(
            'SELECT cart_item_id FROM Cart WHERE cart_item_id = ? AND user_id = ?',
            [cartItemId, userId]
        );

        if (cartItem.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cart item not found'
            });
        }

        await pool.query(
            'DELETE FROM Cart WHERE cart_item_id = ?',
            [cartItemId]
        );

        res.json({
            success: true,
            message: 'Item removed from cart successfully'
        });
    } catch (error) {
        console.error('Error removing cart item:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove item from cart'
        });
    }
});

// Clear entire cart
router.delete('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        await pool.query(
            'DELETE FROM Cart WHERE user_id = ?',
            [userId]
        );

        res.json({
            success: true,
            message: 'Cart cleared successfully'
        });
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear cart'
        });
    }
});

module.exports = router;