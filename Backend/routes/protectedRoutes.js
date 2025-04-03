const express = require("express");

const router = express.Router();

// Example protected route
router.get("/dashboard", (req, res) => {
  res.json({ message: "Welcome to the protected dashboard." });
});

module.exports = router;
