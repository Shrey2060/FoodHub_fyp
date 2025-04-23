const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '1234',  // Using the password from your existing configuration
  database: 'foodhub',
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