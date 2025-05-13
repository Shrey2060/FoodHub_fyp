const { addToCart, getCart, updateCartItem, removeFromCart, clearCart } = require('../../controllers/cartController');
const pool = require('../../config/database');

// Mock the database pool
jest.mock('../../config/database', () => ({
  query: jest.fn()
}));

describe('Cart Controller', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      user: { id: 1 }
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('addToCart', () => {
    it('should add a new item to cart', async () => {
      const cartItem = {
        productId: 1,
        quantity: 2,
        price: 10.99
      };
      req.body = cartItem;

      pool.query
        .mockResolvedValueOnce([[]]) // Check if item exists
        .mockResolvedValueOnce([{ insertId: 1 }]) // Insert new item
        .mockResolvedValueOnce([[{ id: 1, userId: 1, ...cartItem }]]); // Get inserted item

      await addToCart(req, res, next);

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?',
        [req.user.id, cartItem.productId]
      );

      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO cart_items (user_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [req.user.id, cartItem.productId, cartItem.quantity, cartItem.price]
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Item added to cart successfully',
        data: expect.objectContaining({
          id: 1,
          userId: 1,
          ...cartItem
        })
      });
    });

    it('should update quantity if item already exists in cart', async () => {
      const cartItem = {
        productId: 1,
        quantity: 2,
        price: 10.99
      };
      req.body = cartItem;

      pool.query
        .mockResolvedValueOnce([[{ id: 1, userId: 1, productId: 1, quantity: 1, price: 10.99 }]]) // Item exists
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // Update item
        .mockResolvedValueOnce([[{ id: 1, userId: 1, productId: 1, quantity: 3, price: 10.99 }]]); // Get updated item

      await addToCart(req, res, next);

      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE cart_items SET quantity = quantity + ? WHERE id = ?',
        [cartItem.quantity, 1]
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Cart item quantity updated successfully',
        data: expect.objectContaining({
          id: 1,
          userId: 1,
          productId: 1,
          quantity: 3,
          price: 10.99
        })
      });
    });

    it('should handle database errors when adding to cart', async () => {
      const error = new Error('Database error');
      pool.query.mockRejectedValueOnce(error);
      req.body = {
        productId: 1,
        quantity: 2,
        price: 10.99
      };

      await addToCart(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getCart', () => {
    it('should retrieve user cart items', async () => {
      const mockCartItems = [
        { id: 1, userId: 1, productId: 1, quantity: 2, price: 10.99 },
        { id: 2, userId: 1, productId: 2, quantity: 1, price: 15.99 }
      ];

      pool.query.mockResolvedValueOnce([mockCartItems]);

      await getCart(req, res, next);

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM cart_items WHERE user_id = ?',
        [req.user.id]
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockCartItems
      });
    });

    it('should handle database errors when retrieving cart', async () => {
      const error = new Error('Database error');
      pool.query.mockRejectedValueOnce(error);

      await getCart(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateCartItem', () => {
    it('should update cart item quantity', async () => {
      const itemId = 1;
      const updateData = { quantity: 3 };
      req.params.id = itemId;
      req.body = updateData;

      pool.query
        .mockResolvedValueOnce([[{ id: itemId, userId: 1 }]]) // Check if item exists
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // Update item
        .mockResolvedValueOnce([[{ id: itemId, userId: 1, quantity: updateData.quantity }]]); // Get updated item

      await updateCartItem(req, res, next);

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM cart_items WHERE id = ? AND user_id = ?',
        [itemId, req.user.id]
      );

      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE cart_items SET quantity = ? WHERE id = ?',
        [updateData.quantity, itemId]
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Cart item updated successfully',
        data: expect.objectContaining({
          id: itemId,
          userId: 1,
          quantity: updateData.quantity
        })
      });
    });

    it('should handle non-existent cart item', async () => {
      const itemId = 999;
      req.params.id = itemId;
      req.body = { quantity: 3 };

      pool.query.mockResolvedValueOnce([[]]); // No item found

      await updateCartItem(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cart item not found'
      });
    });

    it('should handle database errors when updating cart item', async () => {
      const error = new Error('Database error');
      pool.query.mockRejectedValueOnce(error);
      req.params.id = 1;
      req.body = { quantity: 3 };

      await updateCartItem(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('removeFromCart', () => {
    it('should remove an item from cart', async () => {
      const itemId = 1;
      req.params.id = itemId;

      pool.query
        .mockResolvedValueOnce([[{ id: itemId, userId: 1 }]]) // Check if item exists
        .mockResolvedValueOnce([{ affectedRows: 1 }]); // Delete item

      await removeFromCart(req, res, next);

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM cart_items WHERE id = ? AND user_id = ?',
        [itemId, req.user.id]
      );

      expect(pool.query).toHaveBeenCalledWith(
        'DELETE FROM cart_items WHERE id = ?',
        [itemId]
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Item removed from cart successfully'
      });
    });

    it('should handle non-existent cart item for removal', async () => {
      const itemId = 999;
      req.params.id = itemId;

      pool.query.mockResolvedValueOnce([[]]); // No item found

      await removeFromCart(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cart item not found'
      });
    });

    it('should handle database errors when removing from cart', async () => {
      const error = new Error('Database error');
      pool.query.mockRejectedValueOnce(error);
      req.params.id = 1;

      await removeFromCart(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('clearCart', () => {
    it('should clear all items from user cart', async () => {
      pool.query.mockResolvedValueOnce([{ affectedRows: 2 }]); // Delete all items

      await clearCart(req, res, next);

      expect(pool.query).toHaveBeenCalledWith(
        'DELETE FROM cart_items WHERE user_id = ?',
        [req.user.id]
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Cart cleared successfully'
      });
    });

    it('should handle database errors when clearing cart', async () => {
      const error = new Error('Database error');
      pool.query.mockRejectedValueOnce(error);

      await clearCart(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
}); 