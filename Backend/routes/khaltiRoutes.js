const express = require("express");
const axios = require("axios");
require("dotenv").config();
const router = express.Router();

const KHALTI_SECRET_KEY = "d21287580fd347d391b98004eafd4880"; // Replace with your secret key

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
module.exports = router;