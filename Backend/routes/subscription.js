router.post("/subscribe", async (req, res) => {
    const { userId, planType } = req.body;

    try {
        // Save subscription to the database
        await db.query("INSERT INTO subscriptions (userId, planType, startDate) VALUES (?, ?, NOW())", 
        [userId, planType]);

        res.json({ success: true, message: "Subscription successful!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});