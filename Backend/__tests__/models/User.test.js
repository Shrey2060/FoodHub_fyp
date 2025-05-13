const { createUser, getUserByEmail } = require('../../models/User');
const db = require('../../config/db');

// Mock the db module
jest.mock('../../config/db', () => ({
  query: jest.fn()
}));

describe('User Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should call db.query with correct parameters', () => {
      const name = 'Test User';
      const email = 'test@example.com';
      const password = 'password123';
      const callback = jest.fn();
      createUser(name, email, password, callback);
      expect(db.query).toHaveBeenCalledWith(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
        [name, email, password],
        callback
      );
    });
  });

  describe('getUserByEmail', () => {
    it('should call db.query with correct parameters', () => {
      const email = 'test@example.com';
      const callback = jest.fn();
      getUserByEmail(email, callback);
      expect(db.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = ?',
        [email],
        callback
      );
    });
  });
}); 