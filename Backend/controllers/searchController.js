const pool = require('../config/database');

const searchProducts = async (req, res, next) => {
  try {
    const { keyword, minPrice, maxPrice, category } = req.query;
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (keyword) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (minPrice) {
      query += ' AND price >= ?';
      params.push(minPrice);
    }

    if (maxPrice) {
      query += ' AND price <= ?';
      params.push(maxPrice);
    }

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    const [products] = await pool.query(query, params);

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

const getProductCategories = async (req, res, next) => {
  try {
    const [categories] = await pool.query(
      'SELECT DISTINCT category FROM products ORDER BY category ASC'
    );

    res.json({
      success: true,
      data: categories.map(cat => cat.category)
    });
  } catch (error) {
    next(error);
  }
};

const getProductsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;

    const [products] = await pool.query(
      'SELECT * FROM products WHERE category = ?',
      [category]
    );

    if (!products.length) {
      return res.status(404).json({
        success: false,
        message: 'No products found in this category'
      });
    }

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchProducts,
  getProductCategories,
  getProductsByCategory
}; 