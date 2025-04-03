const express = require("express");
const db = require("../config/db");

const router = express.Router();

// Fetch Featured Dishes
router.get("/featured-dishes", (req, res) => {
  const query = "SELECT * FROM dishes WHERE is_featured = 1";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching featured dishes:", err);
      return res.status(500).json({ success: false, message: "Database error." });
    }

    res.status(200).json({ success: true, data: results });
  });
});

// Fetch Dish Details by ID
router.get("/dish/:id", (req, res) => {
  const { id } = req.params;
  const query = "SELECT * FROM dishes WHERE id = ?";

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error("Error fetching dish details:", err);
      return res.status(500).json({ success: false, message: "Database error." });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "Dish not found." });
    }

    res.status(200).json({ success: true, data: results[0] });
  });
});

module.exports = router;
