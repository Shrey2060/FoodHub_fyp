const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const sendPasswordResetEmail = require("../utils/sendPasswordResetEmail");
const crypto = require("crypto");
const router = express.Router();

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ success: false, message: "Access denied. No token provided." });
  }

  // Check if the token starts with 'Bearer '
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: "Invalid token format." });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      name: decoded.name,
      role: decoded.role
    };
    next();
  } catch (error) {
    console.error("❌ Token verification error:", error.message);
    return res.status(403).json({ success: false, message: "Invalid or expired token." });
  }
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: "Access denied. Admin privileges required." });
  }
  next();
};

// Register Endpoint
router.post("/register", async (req, res) => {
  const { name, email, password, phoneNumber } = req.body;

  if (!name || !email || !password || !phoneNumber) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }

  try {
    const checkQuery = "SELECT id FROM users WHERE email = ?";
    const [results] = await db.query(checkQuery, [email]);

    if (results.length > 0) {
      return res.status(400).json({ success: false, message: "Email is already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertUserQuery = `
      INSERT INTO users (name, email, password, phone_number, role, created_at)
      VALUES (?, ?, ?, ?, 'user', NOW())
    `;
    const [result] = await db.query(insertUserQuery, [name, email, hashedPassword, phoneNumber]);

    const userId = result.insertId;

    const rewardQuery = `
      INSERT INTO reward_points (user_id, points_balance, total_points_earned)
      VALUES (?, 10, 10)
    `;
    await db.query(rewardQuery, [userId]);

    res.status(201).json({
      success: true,
      message: "✅ User registered successfully with 10 reward points!",
    });
  } catch (error) {
    console.error("❌ Error during registration:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// Login Endpoint
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required." });
  }

  try {
    const query = "SELECT * FROM users WHERE email = ?";
    const [results] = await db.query(query, [email]);

    if (results.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const user = results[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    // Generate access token
    const accessToken = jwt.sign(
      { 
        id: user.id, 
        name: user.name,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful.",
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// Add refresh token endpoint
router.post("/refresh-token", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ success: false, message: "Refresh token is required." });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    // Check if refresh token exists in database
    const [results] = await db.query(
      "SELECT * FROM users WHERE id = ? AND refresh_token = ?",
      [decoded.id, refreshToken]
    );

    if (results.length === 0) {
      return res.status(403).json({ success: false, message: "Invalid refresh token." });
    }

    const user = results[0];

    // Generate new access token
    const newAccessToken = jwt.sign(
      { 
        id: user.id, 
        name: user.name,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      accessToken: newAccessToken
    });
  } catch (error) {
    console.error("Error refreshing token:", error);
    res.status(403).json({ success: false, message: "Invalid refresh token." });
  }
});

// Admin-only route
router.get("/admin/users", authenticateToken, isAdmin, async (req, res) => {
  try {
    const [results] = await db.query("SELECT id, name, email, role, created_at FROM users");
    res.json({ success: true, users: results });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ success: false, message: "Database error." });
  }
});

// Fetch Logged-In User's Details (UPDATED)
router.get("/user", authenticateToken, (req, res) => {
  const userId = req.user.id;

  const query = "SELECT id, name, email, role FROM users WHERE id = ?";
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching user details:", err);
      return res.status(500).json({ success: false, message: "Database error." });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    res.json({ success: true, user: results[0] });
  });
});

// Forgot Password Endpoint (UPDATED)
router.post("/forgot-password", (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required." });
  }

  const query = "SELECT * FROM users WHERE email = ?";
  db.query(query, [email], async (err, results) => {
    if (err) {
      console.error("Error fetching user for forgot-password:", err);
      return res.status(500).json({ success: false, message: "Database error." });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "Email not found." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const resetLink = `http://localhost:5173/reset-password/${token}`;
    const expiryTime = new Date(Date.now() + 3600000);

    const updateQuery = "UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?";
    db.query(updateQuery, [token, expiryTime, email], async (err) => {
      if (err) {
        console.error("Error updating reset token:", err);
        return res.status(500).json({ success: false, message: "Failed to generate reset token." });
      }

      try {
        await sendPasswordResetEmail(email, resetLink);
        res.json({ success: true, message: "Password reset email sent." });
      } catch (error) {
        console.error("Error sending reset email:", error);
        res.status(500).json({ success: false, message: "Failed to send email." });
      }
    });
  });
});

// Reset Password Endpoint
router.post("/reset-password", (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ success: false, message: "Token and new password are required." });
  }

  const query = "SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > ?";
  db.query(query, [token, new Date()], async (err, results) => {
    if (err) {
      console.error("Error fetching user for reset-password:", err);
      return res.status(500).json({ success: false, message: "Database error." });
    }

    if (results.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid or expired token." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updateQuery = "UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE reset_token = ?";
    db.query(updateQuery, [hashedPassword, token], (err) => {
      if (err) {
        console.error("Error resetting password:", err);
        return res.status(500).json({ success: false, message: "Failed to reset password." });
      }

      res.json({ success: true, message: "Password reset successful." });
    });
  });
});

// Logout (Client-side should handle token removal)
router.post("/logout", (req, res) => {
  res.json({ success: true, message: "Logged out successfully." });
});

// Temporary route to set admin password (DELETE THIS ROUTE AFTER FIRST USE)
router.post("/reset-admin-password", async (req, res) => {
  try {
    const adminEmail = "admin.foodhub@gmail.com";
    const newPassword = "Admin123!"; // Correct admin password
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const updateQuery = "UPDATE users SET password = ? WHERE email = ?";
    const [result] = await db.query(updateQuery, [hashedPassword, adminEmail]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Admin user not found" });
    }
    
    res.json({ 
      success: true, 
      message: "Admin password updated successfully",
      tempPassword: newPassword // REMOVE THIS IN PRODUCTION
    });
  } catch (error) {
    console.error("Error in reset-admin-password:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Verify token endpoint
router.post('/verify-token', authenticateToken, (req, res) => {
    // If we get here, it means the token is valid (authenticateToken middleware passed)
    res.json({ 
        success: true, 
        message: 'Token is valid',
        user: {
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role
        }
    });
});

module.exports = router;
