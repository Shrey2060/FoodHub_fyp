const express = require("express");
const axios = require("axios");
require("dotenv").config();
const router = express.Router();

const KHALTI_SECRET_KEY = "d21287580fd347d391b98004eafd4880";

router.post("/khalti/initiate", async (req, res) => {
    try {
        const { amount, purchase_order_id, purchase_order_name, customer_info } = req.body;

        // Validate required fields
        if (!amount || !purchase_order_id || !purchase_order_name) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
                required: ["amount", "purchase_order_id", "purchase_order_name"]
            });
        }

        // Log the amount for debugging
        console.log('Received amount for Khalti payment:', {
            receivedAmount: amount,
            assumingInPaisa: true // Assuming all amounts are already in paisa
        });

        // No conversion needed as we're assuming amount is already in paisa
        const amountInPaisa = parseInt(amount);
        console.log('Using amount directly as paisa:', amountInPaisa);

        const payload = {
            return_url: "http://localhost:5173/payment/success",
            website_url: "http://localhost:5173",
            amount: amountInPaisa, // Amount already in paisa
            purchase_order_id,
            purchase_order_name,
            customer_info: customer_info || {
                name: "Test User",
                email: "test@example.com",
                phone: "9800000000"
            }
        };

        console.log('Sending payload to Khalti:', {
            ...payload,
            amount_in_rupees: amountInPaisa / 100 // For logging only
        });

        const response = await axios.post(
            "https://a.khalti.com/api/v2/epayment/initiate/", 
            payload,
            {
                headers: {
                    "Authorization": `Key ${KHALTI_SECRET_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );
        
        if (response.data && response.data.pidx) {
            res.json({
                success: true,
                message: "Payment initiated successfully",
                data: response.data
            });
        } else {
            throw new Error("Invalid response from Khalti");
        }
    } catch (error) {
        console.error('Error initiating Khalti payment:', error);
        res.status(error.response?.status || 500).json({ 
            success: false,
            message: "Failed to initiate payment",
            error: error.response?.data || error.message 
        });
    }
});

// Add subscription verification route
router.post("/khalti/verify", async (req, res) => {
    try {
        const { pidx } = req.body;
        
        if (!pidx) {
            return res.status(400).json({
                success: false,
                message: "Payment ID (pidx) is required"
            });
        }

        // Verify payment with Khalti
        const response = await axios.post(
            "https://a.khalti.com/api/v2/epayment/lookup/",
            { pidx },
            {
                headers: {
                    "Authorization": `Key ${KHALTI_SECRET_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log('Khalti verification response:', response.data);

        if (response.data && response.data.status === "Completed") {
            // Convert amount back to rupees for display if needed
            if (response.data.total_amount) {
                response.data.amount_in_rupees = response.data.total_amount / 100;
                console.log('Converted payment amount from paisa to rupees:', {
                    paisa: response.data.total_amount,
                    rupees: response.data.amount_in_rupees
                });
            }
            
            res.json({
                success: true,
                message: "Payment verified successfully",
                data: response.data
            });
        } else {
            res.status(400).json({
                success: false,
                message: "Payment verification failed",
                error: response.data
            });
        }
    } catch (error) {
        console.error("Payment verification error:", error);
        res.status(500).json({
            success: false,
            message: "Payment verification failed",
            error: error.response?.data || error.message
        });
    }
});

module.exports = router;