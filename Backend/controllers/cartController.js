const pool = require('../config/database');

const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity, price } = req.body;
    const userId = req.user.id;

    // Check if item already exists in cart
    const [existingItem] = await pool.query(
      'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );

    if (existingItem.length > 0) {
      // Update quantity if item exists
      await pool.query(
        'UPDATE cart_items SET quantity = quantity + ? WHERE id = ?',
        [quantity, existingItem[0].id]
      );

      const [updatedItem] = await pool.query(
        'SELECT * FROM cart_items WHERE id = ?',
        [existingItem[0].id]
      );

      return res.json({
        success: true,
        message: 'Cart item quantity updated successfully',
        data: updatedItem[0]
      });
    }

    // Insert new item if it doesn't exist
    const [result] = await pool.query(
      'INSERT INTO cart_items (user_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
      [userId, productId, quantity, price]
    );

    const [newItem] = await pool.query(
      'SELECT * FROM cart_items WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Item added to cart successfully',
      data: newItem[0]
    });
  } catch (error) {
    next(error);
  }
};

const getCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [cartItems] = await pool.query(
      'SELECT * FROM cart_items WHERE user_id = ?',
      [userId]
    );

    res.json({
      success: true,
      data: cartItems
    });
  } catch (error) {
    next(error);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const userId = req.user.id;

    const [cartItem] = await pool.query(
      'SELECT * FROM cart_items WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!cartItem.length) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    await pool.query(
      'UPDATE cart_items SET quantity = ? WHERE id = ?',
      [quantity, id]
    );

    const [updatedItem] = await pool.query(
      'SELECT * FROM cart_items WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Cart item updated successfully',
      data: updatedItem[0]
    });
  } catch (error) {
    next(error);
  }
};

const removeFromCart = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [cartItem] = await pool.query(
      'SELECT * FROM cart_items WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!cartItem.length) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    await pool.query(
      'DELETE FROM cart_items WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Item removed from cart successfully'
    });
  } catch (error) {
    next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await pool.query(
      'DELETE FROM cart_items WHERE user_id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart
}; 