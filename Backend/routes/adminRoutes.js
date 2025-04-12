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
router.get("/products", authenticateToken, isAdmin, async (req, res) => {
  console.log('GET /products request received');
  try {
    const [results] = await db.query("SELECT * FROM products ORDER BY id DESC");
    console.log('Products fetched from database:', results);
    res.json({ success: true, products: results });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/products", authenticateToken, isAdmin, async (req, res) => {
  const { name, description, image_url, price, category_id } = req.body;
  if (!name || !price) {
    return res.status(400).json({ success: false, message: "Name and price are required" });
  }

  try {
    const query = "INSERT INTO products (name, description, image_url, price, category_id) VALUES (?, ?, ?, ?, ?)";
    const [result] = await db.query(query, [name, description, image_url, price, category_id || null]);
    
    const [productResult] = await db.query("SELECT * FROM products WHERE id = ?", [result.insertId]);
    res.status(201).json({ success: true, message: "Product created", product: productResult[0] });
  } catch (err) {
    console.error("Error creating product:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.put("/products/:id", authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, description, image_url, price, category_id } = req.body;
  if (!name || !price) {
    return res.status(400).json({ success: false, message: "Name and price are required" });
  }

  try {
    const query = "UPDATE products SET name = ?, description = ?, image_url = ?, price = ?, category_id = ? WHERE id = ?";
    const [result] = await db.query(query, [name, description, image_url, price, category_id || null, id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const [productResult] = await db.query("SELECT * FROM products WHERE id = ?", [id]);
    res.json({ success: true, message: "Product updated", product: productResult[0] });
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.delete("/products/:id", authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  console.log('Delete product request received for id:', id);
  
  try {
    console.log('Checking if product exists...');
    const [results] = await db.query("SELECT * FROM products WHERE id = ?", [id]);
    console.log('Query results:', results);
    if (results.length === 0) {
      console.log('Product not found');
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    await db.query("DELETE FROM products WHERE id = ?", [id]);
    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ======================
// Orders Routes
// ======================
router.get("/orders", authenticateToken, isAdmin, (req, res) => {
  const ordersQuery = `
    SELECT o.id as order_id, o.user_id, o.status, o.total_amount, o.created_at, u.name as customer_name
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE o.is_confirmed = TRUE
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

// Delete order endpoint
router.delete("/orders/:id", authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  let connection;
  
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // First check if order exists
    const [orderCheck] = await connection.query("SELECT * FROM orders WHERE id = ?", [id]);
    if (orderCheck.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Delete notifications first
    await connection.query("DELETE FROM notifications WHERE order_id = ?", [id]);

    // Delete order items
    await connection.query("DELETE FROM order_items WHERE order_id = ?", [id]);

    // Then delete the order
    await connection.query("DELETE FROM orders WHERE id = ?", [id]);

    await connection.commit();
    connection.release();
    res.json({ success: true, message: "Order deleted successfully" });
  } catch (err) {
    console.error("Error deleting order:", err);
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    res.status(500).json({ success: false, message: "Failed to delete order" });
  }
});

// ======================
// Users Routes
// ======================
router.get("/users", authenticateToken, isAdmin, async (req, res) => {
  try {
    const [results] = await db.promise().query(
      "SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC"
    );
    res.json({ success: true, users: results });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
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
  const { name, email, role, password } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ success: false, message: "Name, email, and role are required" });
  }

  try {
    // Check if user exists
    const [userCheck] = await db.promise().query("SELECT * FROM users WHERE id = ?", [id]);
    if (userCheck.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Check if email is already taken by another user
    const [emailCheck] = await db.promise().query(
      "SELECT id FROM users WHERE email = ? AND id != ?",
      [email, id]
    );
    if (emailCheck.length > 0) {
      return res.status(400).json({ success: false, message: "Email is already taken" });
    }

    // Start a transaction
    const connection = await db.promise().getConnection();
    await connection.beginTransaction();

    try {
      // If password is provided, update with password
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await connection.query(
          "UPDATE users SET name = ?, email = ?, password = ?, role = ? WHERE id = ?",
          [name, email, hashedPassword, role, id]
        );
      } else {
        // Update without changing password
        await connection.query(
          "UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?",
          [name, email, role, id]
        );
      }

      // Commit the transaction
      await connection.commit();
      
      // Get the updated user
      const [updatedUser] = await connection.query(
        "SELECT id, name, email, role FROM users WHERE id = ?",
        [id]
      );

      res.json({ 
        success: true, 
        message: "User updated successfully",
        user: updatedUser[0]
      });
    } catch (err) {
      // Rollback the transaction if there's an error
      await connection.rollback();
      throw err;
    } finally {
      // Release the connection
      connection.release();
    }
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
