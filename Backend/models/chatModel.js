const pool = require('../config/database');

const saveMessage = async (messageData) => {
  try {
    const { room, message, sender, timestamp } = messageData;
    
    // Insert the message
    const [result] = await pool.query(
      'INSERT INTO messages (room, message, sender, timestamp) VALUES (?, ?, ?, ?)',
      [room, message, sender, timestamp]
    );

    // Get the inserted message
    const [messages] = await pool.query(
      'SELECT * FROM messages WHERE id = ?',
      [result.insertId]
    );

    return messages[0];
  } catch (error) {
    throw new Error('Database error');
  }
};

const getMessagesByRoom = async (room) => {
  try {
    const [messages] = await pool.query(
      'SELECT * FROM messages WHERE room = ? ORDER BY timestamp ASC',
      [room]
    );
    return messages;
  } catch (error) {
    throw new Error('Database error');
  }
};

const getRooms = async () => {
  try {
    const [rooms] = await pool.query(
      'SELECT DISTINCT room FROM messages ORDER BY room ASC'
    );
    return rooms.map(room => room.room);
  } catch (error) {
    throw new Error('Database error');
  }
};

module.exports = {
  saveMessage,
  getMessagesByRoom,
  getRooms
};
