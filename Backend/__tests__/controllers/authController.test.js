const { login, register } = require('../../controllers/authController');
const pool = require('../../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock the database pool
jest.mock('../../config/database', () => ({
  query: jest.fn()
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn()
}));

// Mock jwt
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn()
}));

describe('Auth Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword123'
      };

      pool.query.mockResolvedValue([[mockUser]]);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mock.jwt.token');

      const req = {
        body: {
          email: 'test@example.com',
          password: 'password123'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await login(req, res);

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = ?',
        ['test@example.com']
      );
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword123');
      expect(jwt.sign).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        token: 'mock.jwt.token',
        user: expect.objectContaining({
          id: 1,
          email: 'test@example.com'
        })
      });
    });

    it('should return 401 for invalid credentials', async () => {
      pool.query.mockResolvedValue([[]]); // Return empty array for no user found

      const req = {
        body: {
          email: 'wrong@example.com',
          password: 'wrongpassword'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid credentials'
      });
    });
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const hashedPassword = 'hashedPassword123';
      bcrypt.hash.mockResolvedValue(hashedPassword);
      pool.query
        .mockResolvedValueOnce([[]]) // Check if user exists
        .mockResolvedValueOnce([{ insertId: 1 }]); // Insert new user

      const req = {
        body: {
          email: 'new@example.com',
          password: 'password123',
          name: 'New User'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await register(req, res);

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = ?',
        ['new@example.com']
      );
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
        ['new@example.com', hashedPassword, 'New User']
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User registered successfully'
      });
    });

    it('should return 400 if user already exists', async () => {
      pool.query.mockResolvedValue([[{ id: 1 }]]); // User exists

      const req = {
        body: {
          email: 'existing@example.com',
          password: 'password123',
          name: 'Existing User'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User already exists'
      });
    });
  });
}); 