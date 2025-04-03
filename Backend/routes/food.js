router.get("/recommendations/:userId", async (req, res) => {
    const { userId } = req.params;

    try {
        // Get last 5 ordered items
        const [recentOrders] = await db.query(`
            SELECT DISTINCT food_items.* FROM orders 
            JOIN food_items ON orders.foodId = food_items.id 
            WHERE orders.userId = ? ORDER BY orders.orderDate DESC LIMIT 5
        `, [userId]);

        res.json(recentOrders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});
