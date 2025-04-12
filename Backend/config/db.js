const mysql = require("mysql2/promise"); // Use mysql2/promise for async/await support

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",  // Replace with your MySQL username if different
  password: process.env.DB_PASSWORD || "1234", // Add your MySQL root password
  database: process.env.DB_NAME || "foodhub", // Replace with your database name
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test the connection
pool.getConnection()
  .then(connection => {
    console.log("✅ Connected to MySQL database.");
    connection.release();
  })
  .catch(err => {
    console.error("❌ Database connection failed:", err.message);
  });

module.exports = pool;