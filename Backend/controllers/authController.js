// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const { validationResult } = require("express-validator");
// const db = require("../config/db");

// console.log("✅ authController.js loaded");
// exports.register = (req, res) => {
//     const { name, email, password } = req.body;

//     console.log("🔹 Registration request received:", { name, email });

//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//         return res.status(400).json({ success: false, errors: errors.array() });
//     }

//     const checkUserSql = "SELECT * FROM users WHERE email = ?";
//     db.query(checkUserSql, [email], (err, users) => {
//         if (err) {
//             console.error("❌ DB error during email check:", err);
//             return res.status(500).json({ success: false, message: "Database error" });
//         }

//         if (users.length > 0) {
//             return res.status(400).json({ success: false, message: "Email already exists." });
//         }

//         bcrypt.hash(password, 10, (err, hashedPassword) => {
//             if (err) {
//                 console.error("❌ Hashing error:", err);
//                 return res.status(500).json({ success: false, message: "Error hashing password" });
//             }

//             const insertUserSql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
//             db.query(insertUserSql, [name, email, hashedPassword], (err, result) => {
//                 if (err) {
//                     console.error("❌ Error inserting user:", err);
//                     return res.status(500).json({ success: false, message: "Database error (user insert)" });
//                 }

//                 const userId = result.insertId;
//                 console.log("🆔 Inserted User ID:", userId);

//                 const insertRewardSql = `
//                     INSERT INTO reward_points (user_id, points_balance, total_points_earned)
//                     VALUES (?, 10, 10)
//                 `;
//                 console.log("🧪 SQL:", insertRewardSql);
//                 console.log("🧪 Params:", [userId]);

//                 db.query(insertRewardSql, [userId], (err, rewardResult) => {
//                     if (err) {
//                         console.error("❌ Reward point insert error:", err.sqlMessage || err.message);
//                         return res.status(500).json({
//                             success: false,
//                             message: "User created, but failed to assign reward points.",
//                         });
//                     }

//                     console.log("🎉 Reward points inserted:", rewardResult);
//                     res.status(201).json({
//                         success: true,
//                         message: "✅ User registered successfully with 10 reward points!",
//                     });
//                 });
//             });
//         });
//     });
// };


// // Login User
// exports.login = (req, res) => {
//     const { email, password } = req.body;

//     console.log("🔹 Login request received for email:", email);

//     const sql = "SELECT * FROM users WHERE email = ?";
//     db.query(sql, [email], (err, users) => {
//         if (err) {
//             console.error("❌ Database error:", err);
//             return res.status(500).json({ message: "Database error", error: err });
//         }

//         if (users.length === 0) {
//             console.log("❌ User not found.");
//             return res.status(401).json({ message: "User not found!" });
//         }

//         const storedPassword = users[0].password;
//         console.log("🔹 Entered password:", password);
//         console.log("🔹 Stored hashed password in DB:", storedPassword);

//         // 🔹 Remove extra hashing, only compare raw password with stored hash
//         bcrypt.compare(password, storedPassword, (err, match) => {
//             if (err) {
//                 console.error("❌ Bcrypt error during comparison:", err);
//                 return res.status(500).json({ message: "Error verifying password." });
//             }

//             if (!match) {
//                 console.log("❌ Password mismatch!");
//                 return res.status(401).json({ message: "Invalid credentials! Passwords do not match." });
//             }

//             console.log("✅ Password match. Generating token...");

//             const token = jwt.sign({ id: users[0].id }, process.env.JWT_SECRET, { expiresIn: "1h" });

//             res.json({
//                 message: "✅ Login successful!",
//                 token,
//                 user: {
//                     id: users[0].id,
//                     name: users[0].name,
//                     email: users[0].email,
//                 },
//             });
//         });
//     });
// };
