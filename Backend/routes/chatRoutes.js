const express = require("express");
const db = require("../config/db"); // Connect to MySQL database
const router = express.Router();

// ✅ Fetch Chat Messages between Two Users
router.get("/:chatRoomId", async (req, res) => {
    const { chatRoomId } = req.params;

    if (!chatRoomId) {
        return res.status(400).json({ success: false, message: "Chat room ID is required." });
    }

    try {
        const query = `SELECT * FROM chat_messages WHERE chat_room_id = ? ORDER BY created_at ASC`;
        const [messages] = await db.promise().query(query, [chatRoomId]);

        res.status(200).json({
            success: true,
            messages,
        });
    } catch (error) {
        console.error("❌ Database Error Fetching Messages:", error.message);
        res.status(500).json({
            success: false,
            message: "Internal server error while fetching messages.",
        });
    }
});

// ✅ Send a Message
router.post("/", async (req, res) => {
    const { chatRoomId, senderId, receiverId, message } = req.body;

    if (!chatRoomId || !senderId || !receiverId || !message.trim()) {
        return res.status(400).json({ success: false, message: "All fields are required." });
    }

    try {
        const query = `
            INSERT INTO chat_messages (chat_room_id, sender_id, receiver_id, message, created_at) 
            VALUES (?, ?, ?, ?, NOW())`;

        await db.promise().query(query, [chatRoomId, senderId, receiverId, message]);

        res.status(201).json({
            success: true,
            message: "Message saved successfully.",
        });
    } catch (error) {
        console.error("❌ Database Error Saving Message:", error.message);
        res.status(500).json({
            success: false,
            message: "Internal server error while saving message.",
        });
    }
});

module.exports = router;
