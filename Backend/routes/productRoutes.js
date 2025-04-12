const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Get all products (public route)
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.id DESC
    `;
    
    const [results] = await db.query(query);
    res.json({ success: true, products: results });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Database error.' });
  }
});

// Admin Routes
// Get all products (admin view)
router.get('/admin/products', authenticateToken, isAdmin, async (req, res) => {
  try {
    const query = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.id DESC
    `;
    
    const [results] = await db.query(query);
    res.json({ success: true, products: results });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Database error.' });
  }
});

// Create new product
router.post('/admin/products', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, description, price, category, imageUrl } = req.body;

    if (!name || !price) {
      return res.status(400).json({ success: false, message: 'Name and price are required.' });
    }

    // First get or create category
    const categoryQuery = 'SELECT id FROM categories WHERE name = ?';
    const [categoryResults] = await db.query(categoryQuery, [category]);

    let categoryId;
    if (categoryResults.length > 0) {
      categoryId = categoryResults[0].id;
    } else {
      // Create new category
      const [result] = await db.query('INSERT INTO categories (name) VALUES (?)', [category]);
      categoryId = result.insertId;
    }

    // Insert product
    const productQuery = `
      INSERT INTO products (name, description, price, category_id, image_url)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const [productResult] = await db.query(productQuery, [name, description, price, categoryId, imageUrl]);
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      productId: productResult.insertId
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ success: false, message: 'Failed to create product.' });
  }
});

// Update product
router.put('/admin/products/:id', authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;
  const { name, description, price, category, imageUrl } = req.body;

  if (!name || !price) {
    return res.status(400).json({ success: false, message: 'Name and price are required.' });
  }

  // If no category is provided, update without changing the category
  if (!category) {
    const query = `
      UPDATE products 
      SET name = ?, description = ?, price = ?, image_url = ?
      WHERE id = ?
    `;
    
    db.query(query, [name, description, price, imageUrl, id], (err, result) => {
      if (err) {
        console.error('Error updating product:', err);
        return res.status(500).json({ success: false, message: 'Failed to update product.' });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Product not found.' });
      }
      
      res.json({ success: true, message: 'Product updated successfully.' });
    });
    return;
  }

  // If category is provided, get or create it
  const categoryQuery = 'SELECT id FROM categories WHERE name = ?';
  db.query(categoryQuery, [category], (err, results) => {
    if (err) {
      console.error('Error checking category:', err);
      return res.status(500).json({ success: false, message: 'Database error.' });
    }

    let categoryId;
    if (results.length > 0) {
      categoryId = results[0].id;
      updateProduct(categoryId);
    } else {
      // Create new category
      db.query('INSERT INTO categories (name) VALUES (?)', [category], (err, result) => {
        if (err) {
          console.error('Error creating category:', err);
          return res.status(500).json({ success: false, message: 'Failed to create category.' });
        }
        categoryId = result.insertId;
        updateProduct(categoryId);
      });
    }
  });

  function updateProduct(categoryId) {
    const query = `
      UPDATE products 
      SET name = ?, description = ?, price = ?, category_id = ?, image_url = ?
      WHERE id = ?
    `;
    
    db.query(query, [name, description, price, categoryId, imageUrl, id], (err, result) => {
      if (err) {
        console.error('Error updating product:', err);
        return res.status(500).json({ success: false, message: 'Failed to update product.' });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Product not found.' });
      }
      
      res.json({ success: true, message: 'Product updated successfully.' });
    });
  }
});

// Delete product
router.delete('/admin/products/:id', authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;
  
  const query = 'DELETE FROM products WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error deleting product:', err);
      return res.status(500).json({ success: false, message: 'Failed to delete product.' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    
    res.json({ success: true, message: 'Product deleted successfully.' });
  });
});

module.exports = router;