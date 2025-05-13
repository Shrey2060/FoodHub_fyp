const { sendMessage, getMessages, getRooms } = require('../../controllers/chatController');
const Chat = require('../../models/chatModel');

// Mock the Chat model
jest.mock('../../models/chatModel', () => ({
  saveMessage: jest.fn(),
  getMessagesByRoom: jest.fn(),
  getRooms: jest.fn()
}));

describe('Chat Controller', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      user: { id: 1 }
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should send a message successfully', async () => {
      const messageData = {
        room: 'room1',
        message: 'Hello world',
        sender: 1
      };
      req.body = messageData;
      
      const savedMessage = {
        id: 1,
        ...messageData,
        timestamp: new Date()
      };
      Chat.saveMessage.mockResolvedValue(savedMessage);

      await sendMessage(req, res, next);

      expect(Chat.saveMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          room: messageData.room,
          message: messageData.message,
          sender: messageData.sender
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Message sent successfully',
        data: savedMessage
      });
    });

    it('should handle errors when sending message', async () => {
      const error = new Error('Database error');
      Chat.saveMessage.mockRejectedValue(error);
      req.body = {
        room: 'room1',
        message: 'Hello world',
        sender: 1
      };

      await sendMessage(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getMessages', () => {
    it('should retrieve messages for a room', async () => {
      const room = 'room1';
      req.params.room = room;
      const mockMessages = [
        { id: 1, room, message: 'Hello', sender: 1, timestamp: new Date() },
        { id: 2, room, message: 'Hi', sender: 2, timestamp: new Date() }
      ];
      
      Chat.getMessagesByRoom.mockResolvedValue(mockMessages);

      await getMessages(req, res, next);

      expect(Chat.getMessagesByRoom).toHaveBeenCalledWith(room);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockMessages
      });
    });

    it('should handle errors when retrieving messages', async () => {
      const error = new Error('Database error');
      Chat.getMessagesByRoom.mockRejectedValue(error);
      req.params.room = 'room1';

      await getMessages(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getRooms', () => {
    it('should retrieve all chat rooms', async () => {
      const mockRooms = ['room1', 'room2', 'room3'];
      Chat.getRooms.mockResolvedValue(mockRooms);

      await getRooms(req, res, next);

      expect(Chat.getRooms).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockRooms
      });
    });

    it('should handle errors when retrieving rooms', async () => {
      const error = new Error('Database error');
      Chat.getRooms.mockRejectedValue(error);

      await getRooms(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
}); 