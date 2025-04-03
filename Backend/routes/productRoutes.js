const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Fetch all products categorized
router.get("/", (req, res) => {
  const query = `
    SELECT 
      c.name AS category, 
      p.id, 
      p.name, 
      p.description, 
      p.image_url, 
      p.price 
    FROM products p 
    JOIN categories c ON p.category_id = c.id 
    ORDER BY c.name;
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching products:", err);
      return res.status(500).json({ success: false, message: "Database error." });
    }
    
    const categorizedProducts = results.reduce((acc, product) => {
      if (!acc[product.category]) acc[product.category] = [];
      acc[product.category].push(product);
      return acc;
    }, {});
    
    res.json({ success: true, products: categorizedProducts });
  });
});

// Add a new product
router.post("/", (req, res) => {
  const { name, description, image_url, category_id, price } = req.body;

  if (!name || !description || !image_url || !category_id || !price) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }

  const query = "INSERT INTO products (name, description, image_url, category_id, price) VALUES (?, ?, ?, ?, ?)";
  db.query(query, [name, description, image_url, category_id, price], (err) => {
    if (err) {
      console.error("Error adding product:", err);
      return res.status(500).json({ success: false, message: "Database error." });
    }
    res.json({ success: true, message: "Product added successfully." });
  });
});

module.exports = router;