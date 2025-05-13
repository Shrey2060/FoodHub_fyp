const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: err.message
    });
  }

  // Handle authentication errors
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      message: err.message
    });
  }

  // Handle not found errors
  if (err.name === 'NotFoundError') {
    return res.status(404).json({
      message: err.message
    });
  }

  // Handle MongoDB duplicate key errors
  if (err.name === 'MongoError' && err.code === 11000) {
    return res.status(409).json({
      message: 'Resource already exists'
    });
  }

  // Handle custom errors with status code
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      message: err.message
    });
  }

  // Handle unknown errors
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  // In development, include stack trace
  if (process.env.NODE_ENV === 'development') {
    return res.status(statusCode).json({
      message,
      stack: err.stack
    });
  }

  // In production, don't expose stack trace
  return res.status(statusCode).json({
    message: 'Internal server error'
  });
};

module.exports = { errorHandler }; 