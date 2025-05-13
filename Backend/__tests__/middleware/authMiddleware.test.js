const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../../middleware/authMiddleware');

jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should pass with valid token', async () => {
    const mockUser = { id: 1, email: 'test@example.com' };
    const token = 'valid-token';
    req.headers.authorization = `Bearer ${token}`;
    
    jwt.verify.mockImplementation(() => mockUser);

    await authenticateToken(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 401 for missing token', async () => {
    await authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Access token is required'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 for invalid token format', async () => {
    req.headers.authorization = 'InvalidFormat token123';

    await authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid token format'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 for invalid token', async () => {
    const token = 'invalid-token';
    req.headers.authorization = `Bearer ${token}`;
    
    jwt.verify.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    await authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid token'
    });
    expect(next).not.toHaveBeenCalled();
  });
}); 