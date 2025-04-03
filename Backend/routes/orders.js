const express = require("express");
const router = express.Router();
const db = require("../config/db"); // Your MySQL connection

router.post("/redeem-rewards", async (req, res) => {
    const { userId, pointsToRedeem } = req.body;

    try {
        // Check user's current reward points
        const [user] = await db.query("SELECT rewardPoints FROM users WHERE id = ?", [userId]);

        if (!user || user.rewardPoints < pointsToRedeem) {
            return res.status(400).json({ message: "Not enough reward points" });
        }

        // Deduct points from the user
        await db.query("UPDATE users SET rewardPoints = rewardPoints - ? WHERE id = ?", [pointsToRedeem, userId]);

        res.json({ success: true, message: "Reward points redeemed successfully!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
