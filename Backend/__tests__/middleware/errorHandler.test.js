const { errorHandler } = require('../../middleware/errorHandler');

describe('Error Handler Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    process.env.NODE_ENV = 'production';
  });

  it('should handle validation errors', () => {
    const error = {
      name: 'ValidationError',
      message: 'Invalid input data'
    };

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid input data'
    });
  });

  it('should handle authentication errors', () => {
    const error = {
      name: 'UnauthorizedError',
      message: 'Invalid credentials'
    };

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid credentials'
    });
  });

  it('should handle not found errors', () => {
    const error = {
      name: 'NotFoundError',
      message: 'Resource not found'
    };

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Resource not found'
    });
  });

  it('should handle database errors', () => {
    const error = {
      name: 'MongoError',
      code: 11000,
      message: 'Duplicate key error'
    };

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Resource already exists'
    });
  });

  it('should handle generic errors', () => {
    const error = new Error('Something went wrong');

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Internal server error'
    });
  });

  it('should handle custom error with status code', () => {
    const error = {
      statusCode: 418,
      message: "I'm a teapot"
    };

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(418);
    expect(res.json).toHaveBeenCalledWith({
      message: "I'm a teapot"
    });
  });

  it('should handle errors with stack trace in development', () => {
    process.env.NODE_ENV = 'development';
    const error = new Error('Test error');

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Test error',
      stack: error.stack
    });
  });

  it('should not expose stack trace in production', () => {
    process.env.NODE_ENV = 'production';
    const error = new Error('Test error');

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Internal server error'
    });
  });
}); 