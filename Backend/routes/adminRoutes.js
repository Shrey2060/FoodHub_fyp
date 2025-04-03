const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// ======================
// Middleware
// ======================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, message: "Access denied" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: "Invalid token" });
    req.user = user;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Requires admin privileges" });
  }
  next();
};

// ======================
// Products CRUD Routes
// ======================
router.get("/products", authenticateToken, isAdmin, (req, res) => {
  db.query("SELECT * FROM products ORDER BY id DESC", (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Server error" });
    res.json({ success: true, products: results });
  });
});

router.post("/products", authenticateToken, isAdmin, (req, res) => {
  const { name, description, image_url, price, category_id } = req.body;
  if (!name || !price) {
    return res.status(400).json({ success: false, message: "Name and price are required" });
  }

  const query = "INSERT INTO products (name, description, image_url, price, category_id) VALUES (?, ?, ?, ?, ?)";
  db.query(query, [name, description, image_url, price, category_id || null], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "Server error" });

    db.query("SELECT * FROM products WHERE id = ?", [result.insertId], (err, productResult) => {
      if (err) return res.status(500).json({ success: false, message: "Server error" });
      res.status(201).json({ success: true, message: "Product created", product: productResult[0] });
    });
  });
});

router.put("/products/:id", authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;
  const { name, description, image_url, price, category_id } = req.body;
  if (!name || !price) {
    return res.status(400).json({ success: false, message: "Name and price are required" });
  }

  const query = "UPDATE products SET name = ?, description = ?, image_url = ?, price = ?, category_id = ? WHERE id = ?";
  db.query(query, [name, description, image_url, price, category_id || null, id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "Server error" });
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Product not found" });

    db.query("SELECT * FROM products WHERE id = ?", [id], (err, productResult) => {
      if (err) return res.status(500).json({ success: false, message: "Server error" });
      res.json({ success: true, message: "Product updated", product: productResult[0] });
    });
  });
});

router.delete("/products/:id", authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM products WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Server error" });
    if (results.length === 0) return res.status(404).json({ success: false, message: "Product not found" });

    db.query("DELETE FROM products WHERE id = ?", [id], (err) => {
      if (err) return res.status(500).json({ success: false, message: "Server error" });
      res.json({ success: true, message: "Product deleted" });
    });
  });
});

// ======================
// Orders Routes
// ======================
router.get("/orders", authenticateToken, isAdmin, (req, res) => {
  const ordersQuery = `
    SELECT o.id as order_id, o.user_id, o.status, o.total_amount, o.created_at, u.name as customer_name
    FROM orders o
    JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
  `;

  db.query(ordersQuery, (err, ordersResults) => {
    if (err) return res.status(500).json({ success: false, message: "Server error" });
    if (ordersResults.length === 0) return res.json({ success: true, orders: [] });

    let completed = 0;
    ordersResults.forEach((order) => {
      const itemsQuery = `
        SELECT oi.product_id, oi.quantity, oi.price, p.name
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `;
      db.query(itemsQuery, [order.order_id], (err, itemsResults) => {
        if (err) return res.status(500).json({ success: false, message: "Server error" });

        order.items = itemsResults;
        completed++;

        if (completed === ordersResults.length) {
          res.json({ success: true, orders: ordersResults });
        }
      });
    });
  });
});

router.put("/orders/:id", authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses = ["pending", "processing", "completed", "cancelled"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }

  db.query("UPDATE orders SET status = ? WHERE id = ?", [status, id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "Server error" });
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Order not found" });

    db.query("SELECT * FROM orders WHERE id = ?", [id], (err, orderResult) => {
      if (err) return res.status(500).json({ success: false, message: "Server error" });
      res.json({ success: true, message: "Order status updated", order: orderResult[0] });
    });
  });
});

// ======================
// Users Routes
// ======================
router.get("/users", authenticateToken, isAdmin, (req, res) => {
  db.query("SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC", (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Server error" });
    res.json({ success: true, users: results });
  });
});

router.get("/users/:id", authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;
  db.query("SELECT id, name, email, role FROM users WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Server error" });
    if (results.length === 0) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user: results[0] });
  });
});

router.put("/edit-user/:id", authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  try {
    const [userCheck] = await db.promise().query("SELECT * FROM users WHERE id = ?", [id]);
    if (userCheck.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.promise().query("UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?", [
      name,
      email,
      hashedPassword,
      id,
    ]);

    res.json({ success: true, message: "User updated successfully" });
  } catch (err) {
    console.error("User update error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.delete("/users/:id", authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM users WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Server error" });
    if (results.length === 0) return res.status(404).json({ success: false, message: "User not found" });

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ success: false, message: "Cannot delete your own account" });
    }

    db.query("DELETE FROM users WHERE id = ?", [id], (err) => {
      if (err) return res.status(500).json({ success: false, message: "Server error" });
      res.json({ success: true, message: "User deleted" });
    });
  });
});

module.exports = router;
