const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { authenticateToken } = require('../middleware/auth');
const { 
    getUserRewardPoints, 
    addRewardPoints, 
    redeemRewardPoints, 
    cancelRewardPoints, 
    clearRewardHistory 
} = require('../controllers/rewardController');

// Reward points for first-time login
const LOGIN_REWARD_POINTS = 10;

// Get available redemption options
router.get("/redemption-options", authenticateToken, async (req, res) => {
    try {
        const [options] = await db.query(
            "SELECT * FROM reward_redemption_options WHERE is_active = true ORDER BY points_required ASC"
        );
        res.json({ success: true, data: options });
    } catch (error) {
        console.error("❌ Error fetching redemption options:", error);
        res.status(500).json({ success: false, message: "Error fetching redemption options" });
    }
});

// ✅ Get user's reward points
router.get("/points", authenticateToken, async (req, res) => {
    try {
        const [rewardCheck] = await db.query(
            "SELECT points_balance, total_points_earned, login_reward_given FROM user_rewards WHERE user_id = ?",
            [req.user.id]
        );

        if (rewardCheck.length === 0) {
            // Create new rewards record if it doesn't exist
            await db.query(
                "INSERT INTO user_rewards (user_id, points_balance, total_points_earned, login_reward_given) VALUES (?, 0, 0, false)",
                [req.user.id]
            );
            return res.json({ success: true, data: { points_balance: 0, total_points_earned: 0, login_reward_given: false } });
        }

        res.json({ success: true, data: rewardCheck[0] });
    } catch (error) {
        console.error("❌ Error fetching points:", error);
        res.status(500).json({ success: false, message: "Error fetching reward points" });
    }
});

router.get("/redeem-points", authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT points_balance FROM reward_points WHERE user_id = ?",
            [req.user.id]
        );
          
        console.log("✅ Fetched reward rows:", rows);
  
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Reward points not found for this user.",
            });
        }
  
        res.json({
            success: true,
            data: {
                redeemable_points: rows[0].points_balance,
            },
        });
    } catch (error) {
        console.error("❌ Error fetching redeemable points:", error);
        res.status(500).json({ success: false, message: "Error fetching redeemable points" });
    }
});

// ✅ Grant 10 reward points on first login (Once per Email)
router.post("/login-reward", authenticateToken, async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Check if user exists
        const [user] = await connection.query("SELECT email FROM users WHERE id = ?", [req.user.id]);
        if (user.length === 0) throw new Error("User not found");

        // Check if user already received login reward
        const [rewardCheck] = await connection.query(
            "SELECT login_reward_given FROM user_rewards WHERE user_id = ?",
            [req.user.id]
        );

        if (rewardCheck.length > 0 && rewardCheck[0].login_reward_given) {
            throw new Error("Login reward already granted for this user");
        }

        // Grant login reward
        await connection.query(
            `INSERT INTO user_rewards (user_id, points_balance, total_points_earned, login_reward_given) 
             VALUES (?, ?, ?, true) 
             ON DUPLICATE KEY UPDATE 
             points_balance = points_balance + ?, 
             total_points_earned = total_points_earned + ?, 
             login_reward_given = true`,
            [req.user.id, LOGIN_REWARD_POINTS, LOGIN_REWARD_POINTS, LOGIN_REWARD_POINTS, LOGIN_REWARD_POINTS]
        );

        // Record transaction
        await connection.query(
            `INSERT INTO reward_transactions 
             (user_id, transaction_type, points_earned, description) 
             VALUES (?, 'EARNED', ?, 'First login reward')`,
            [req.user.id, LOGIN_REWARD_POINTS]
        );

        await connection.commit();
        res.json({ success: true, message: "Login reward granted!", points: LOGIN_REWARD_POINTS });
    } catch (error) {
        await connection.rollback();
        console.error("❌ Error granting login reward:", error);
        res.status(400).json({ success: false, message: error.message || "Error granting login reward" });
    } finally {
        connection.release();
    }
});

// ✅ Get reward transaction history
router.get("/history", authenticateToken, async (req, res) => {
    try {
        const [transactions] = await db.query(
            `SELECT id, transaction_type, points_earned, points_redeemed, 
             transaction_date, description 
             FROM reward_transactions 
             WHERE user_id = ? 
             ORDER BY transaction_date DESC 
             LIMIT 50`,
            [req.user.id]
        );

        res.json({ success: true, data: transactions });
    } catch (error) {
        console.error("❌ Error fetching history:", error);
        res.status(500).json({ success: false, message: "Error fetching reward history" });
    }
});

// ✅ Redeem points
router.post("/redeem", authenticateToken, async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { points_to_redeem } = req.body;

        // Validate input
        if (!points_to_redeem || isNaN(points_to_redeem) || points_to_redeem <= 0) {
            throw new Error("Please select a valid redemption amount");
        }

        // Check user's points balance
        const [rewards] = await connection.query(
            "SELECT points_balance FROM user_rewards WHERE user_id = ? FOR UPDATE",
            [req.user.id]
        );

        if (!rewards[0]) {
            // Create new rewards record if it doesn't exist
            await connection.query(
                "INSERT INTO user_rewards (user_id, points_balance, total_points_earned) VALUES (?, 0, 0)",
                [req.user.id]
            );
            throw new Error("No reward points found for this user");
        }

        if (rewards[0].points_balance < points_to_redeem) {
            throw new Error("Insufficient points balance");
        }

        // Validate redemption option
        const [option] = await connection.query(
            "SELECT * FROM reward_redemption_options WHERE points_required = ? AND is_active = true",
            [points_to_redeem]
        );

        if (option.length === 0) {
            throw new Error("Invalid redemption amount. Please select a valid redemption option.");
        }

        // Update points balance
        await connection.query(
            "UPDATE user_rewards SET points_balance = points_balance - ? WHERE user_id = ?",
            [points_to_redeem, req.user.id]
        );

        // Record transaction
        await connection.query(
            `INSERT INTO reward_transactions 
             (user_id, transaction_type, points_redeemed, description) 
             VALUES (?, 'REDEEMED', ?, ?)`,
            [req.user.id, points_to_redeem, option[0].description]
        );

        await connection.commit();
        res.json({ 
            success: true, 
            message: "Points redeemed successfully", 
            data: {
                reward: option[0],
                remaining_points: rewards[0].points_balance - points_to_redeem
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error("❌ Error redeeming points:", error);
        res.status(400).json({ 
            success: false, 
            message: error.message || "Error redeeming points" 
        });
    } finally {
        connection.release();
    }
});

// ✅ Add points (e.g., from order processing)
router.post("/add-points", authenticateToken, async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { points_earned, order_id } = req.body;

        if (!points_earned || points_earned <= 0) {
            throw new Error("Invalid points amount");
        }

        // Update points balance
        await connection.query(
            `UPDATE user_rewards 
             SET points_balance = points_balance + ?, 
                 total_points_earned = total_points_earned + ? 
             WHERE user_id = ?`,
            [points_earned, points_earned, req.user.id]
        );

        // Record transaction
        await connection.query(
            `INSERT INTO reward_transactions 
             (user_id, transaction_type, points_earned, order_id, description) 
             VALUES (?, 'EARNED', ?, ?, 'Points earned from order')`,
            [req.user.id, points_earned, order_id]
        );

        await connection.commit();
        res.json({ success: true, message: "Points added successfully" });
    } catch (error) {
        await connection.rollback();
        console.error("❌ Error adding points:", error);
        res.status(500).json({ success: false, message: "Error adding points" });
    } finally {
        connection.release();
    }
});

// Get user's reward points
router.get('/', authenticateToken, getUserRewardPoints);

// Clear reward history
router.post("/clear-history", authenticateToken, clearRewardHistory);

module.exports = router;
