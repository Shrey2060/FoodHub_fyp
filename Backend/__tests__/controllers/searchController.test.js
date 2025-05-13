const { searchProducts, getProductCategories, getProductsByCategory } = require('../../controllers/searchController');
const pool = require('../../config/database');

// Mock the database pool
jest.mock('../../config/database', () => ({
  query: jest.fn()
}));

describe('Search Controller', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      query: {},
      params: {}
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('searchProducts', () => {
    it('should search products by keyword', async () => {
      const keyword = 'pizza';
      req.query.keyword = keyword;

      const mockProducts = [
        { id: 1, name: 'Pepperoni Pizza', description: 'Delicious pepperoni pizza', price: 12.99 },
        { id: 2, name: 'Vegetarian Pizza', description: 'Fresh vegetable pizza', price: 11.99 }
      ];

      pool.query.mockResolvedValueOnce([mockProducts]);

      await searchProducts(req, res, next);

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM products WHERE 1=1 AND (name LIKE ? OR description LIKE ?)',
        [`%${keyword}%`, `%${keyword}%`]
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockProducts
      });
    });

    it('should search products with price range', async () => {
      const minPrice = 10;
      const maxPrice = 20;
      req.query.minPrice = minPrice;
      req.query.maxPrice = maxPrice;

      const mockProducts = [
        { id: 1, name: 'Product 1', price: 12.99 },
        { id: 2, name: 'Product 2', price: 15.99 }
      ];

      pool.query.mockResolvedValueOnce([mockProducts]);

      await searchProducts(req, res, next);

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM products WHERE 1=1 AND price >= ? AND price <= ?',
        [minPrice, maxPrice]
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockProducts
      });
    });

    it('should search products with multiple criteria', async () => {
      const keyword = 'pizza';
      const minPrice = 10;
      const maxPrice = 20;
      const category = 'fast-food';
      
      req.query = { keyword, minPrice, maxPrice, category };

      const mockProducts = [
        { id: 1, name: 'Pepperoni Pizza', price: 12.99, category: 'fast-food' }
      ];

      pool.query.mockResolvedValueOnce([mockProducts]);

      await searchProducts(req, res, next);

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM products WHERE 1=1 AND (name LIKE ? OR description LIKE ?) AND price >= ? AND price <= ? AND category = ?',
        [`%${keyword}%`, `%${keyword}%`, minPrice, maxPrice, category]
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockProducts
      });
    });

    it('should handle database errors when searching products', async () => {
      const error = new Error('Database error');
      pool.query.mockRejectedValueOnce(error);
      req.query.keyword = 'pizza';

      await searchProducts(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getProductCategories', () => {
    it('should retrieve all product categories', async () => {
      const mockCategories = [
        { id: 1, category: 'fast-food' },
        { id: 2, category: 'beverages' },
        { id: 3, category: 'desserts' }
      ];

      pool.query.mockResolvedValueOnce([mockCategories]);

      await getProductCategories(req, res, next);

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT DISTINCT category FROM products ORDER BY category ASC'
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockCategories.map(cat => cat.category)
      });
    });

    it('should handle database errors when retrieving categories', async () => {
      const error = new Error('Database error');
      pool.query.mockRejectedValueOnce(error);

      await getProductCategories(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getProductsByCategory', () => {
    it('should retrieve products by category', async () => {
      const category = 'fast-food';
      req.params.category = category;

      const mockProducts = [
        { id: 1, name: 'Burger', category: 'fast-food', price: 8.99 },
        { id: 2, name: 'Pizza', category: 'fast-food', price: 12.99 }
      ];

      pool.query.mockResolvedValueOnce([mockProducts]);

      await getProductsByCategory(req, res, next);

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM products WHERE category = ?',
        [category]
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockProducts
      });
    });

    it('should handle non-existent category', async () => {
      const category = 'non-existent';
      req.params.category = category;

      pool.query.mockResolvedValueOnce([[]]);

      await getProductsByCategory(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No products found in this category'
      });
    });

    it('should handle database errors when retrieving products by category', async () => {
      const error = new Error('Database error');
      pool.query.mockRejectedValueOnce(error);
      req.params.category = 'fast-food';

      await getProductsByCategory(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
}); 