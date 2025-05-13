const Chat = require('../models/chatModel');

const sendMessage = async (req, res, next) => {
  try {
    const { room, message } = req.body;
    const sender = req.user.id;

    const messageData = {
      room,
      message,
      sender,
      timestamp: new Date()
    };

    const savedMessage = await Chat.saveMessage(messageData);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: savedMessage
    });
  } catch (error) {
    next(error);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const { room } = req.params;
    const messages = await Chat.getMessagesByRoom(room);

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    next(error);
  }
};

const getRooms = async (req, res, next) => {
  try {
    const rooms = await Chat.getRooms();

    res.json({
      success: true,
      data: rooms
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendMessage,
  getMessages,
  getRooms
}; 