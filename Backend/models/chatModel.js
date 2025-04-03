const db = require("../config/db");

// Save Chat Message to Database
const saveMessage = (chatRoomId, senderId, receiverId, message) => {
    return new Promise((resolve, reject) => {
        const query = `
            INSERT INTO chat_messages (chat_room_id, sender_id, receiver_id, message, created_at) 
            VALUES (?, ?, ?, ?, NOW())`;
        db.query(query, [chatRoomId, senderId, receiverId, message], (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

// Fetch Chat Messages by Room ID
const getMessagesByRoom = (chatRoomId) => {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM chat_messages WHERE chat_room_id = ? ORDER BY created_at ASC`;
        db.query(query, [chatRoomId], (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

module.exports = { saveMessage, getMessagesByRoom };
