const express = require("express");
const axios = require("axios");
require("dotenv").config();
const router = express.Router();

const KHALTI_SECRET_KEY = "d21287580fd347d391b98004eafd4880";

router.post("/khalti/initiate", async (req, res) => {
    try {
        const response = await axios.post("https://dev.khalti.com/api/v2/epayment/initiate/", req.body, {
            headers: {
                "Authorization": `key ${KHALTI_SECRET_KEY}`,
                "Content-Type": "application/json"
            }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.response.data });
    }
});

// Add subscription verification route
router.post("/khalti/verify", async (req, res) => {
    try {
        const { pidx, amount, orderId } = req.body;
        
        // Verify payment with Khalti
        const response = await axios.post(
            "https://dev.khalti.com/api/v2/epayment/lookup/",
            { pidx },
            {
                headers: {
                    "Authorization": `key ${KHALTI_SECRET_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        if (response.data && response.data.status === "Completed") {
            res.json({
                success: true,
                message: "Payment verified successfully",
                data: {
                    idx: pidx,
                    amount: amount,
                    status: "completed"
                }
            });
        } else {
            res.status(400).json({
                success: false,
                message: "Payment verification failed",
                error: response.data
            });
        }
    } catch (error) {
        console.error("Payment verification error:", error.response?.data || error);
        res.status(500).json({
            success: false,
            message: "Payment verification failed",
            error: error.response?.data || error.message
        });
    }
});

module.exports = router;