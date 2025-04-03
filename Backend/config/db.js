const mysql = require("mysql2"); // Use mysql2 for compatibility

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",  // Replace with your MySQL username if different
  password: process.env.DB_PASSWORD || "1234", // Add your MySQL root password
  database: process.env.DB_NAME || "foodhub", // Replace with your database name
});

db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
  } else {
    console.log("✅ Connected to MySQL database.");
  }
});

module.exports = db;