const Chat = require('../../models/chatModel');
const pool = require('../../config/database');

// Mock the database pool
jest.mock('../../config/database', () => ({
  query: jest.fn()
}));

describe('Chat Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveMessage', () => {
    it('should save a message successfully', async () => {
      const messageData = {
        room: 'room1',
        message: 'Hello world',
        sender: 1,
        timestamp: new Date()
      };

      pool.query.mockResolvedValueOnce([{ insertId: 1 }]);
      pool.query.mockResolvedValueOnce([[{ id: 1, ...messageData }]]);

      const result = await Chat.saveMessage(messageData);

      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO messages (room, message, sender, timestamp) VALUES (?, ?, ?, ?)',
        [messageData.room, messageData.message, messageData.sender, messageData.timestamp]
      );
      expect(result).toEqual(expect.objectContaining(messageData));
    });

    it('should handle database errors when saving message', async () => {
      const messageData = {
        room: 'room1',
        message: 'Hello world',
        sender: 1,
        timestamp: new Date()
      };

      const error = new Error('Database error');
      pool.query.mockRejectedValueOnce(error);

      await expect(Chat.saveMessage(messageData)).rejects.toThrow('Database error');
    });
  });

  describe('getMessagesByRoom', () => {
    it('should retrieve messages for a room', async () => {
      const room = 'room1';
      const mockMessages = [
        { id: 1, room, message: 'Hello', sender: 1, timestamp: new Date() },
        { id: 2, room, message: 'Hi', sender: 2, timestamp: new Date() }
      ];

      pool.query.mockResolvedValueOnce([mockMessages]);

      const result = await Chat.getMessagesByRoom(room);

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM messages WHERE room = ? ORDER BY timestamp ASC',
        [room]
      );
      expect(result).toEqual(mockMessages);
    });

    it('should handle database errors when retrieving messages', async () => {
      const room = 'room1';
      const error = new Error('Database error');
      pool.query.mockRejectedValueOnce(error);

      await expect(Chat.getMessagesByRoom(room)).rejects.toThrow('Database error');
    });
  });

  describe('getRooms', () => {
    it('should retrieve all unique rooms', async () => {
      const mockRooms = ['room1', 'room2', 'room3'];
      pool.query.mockResolvedValueOnce([mockRooms.map(room => ({ room }))]);

      const result = await Chat.getRooms();

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT DISTINCT room FROM messages ORDER BY room ASC'
      );
      expect(result).toEqual(mockRooms);
    });

    it('should handle database errors when retrieving rooms', async () => {
      const error = new Error('Database error');
      pool.query.mockRejectedValueOnce(error);

      await expect(Chat.getRooms()).rejects.toThrow('Database error');
    });
  });
}); 