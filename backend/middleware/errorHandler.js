const { errorResponse } = require('../utils/response');

/**
 * Global error handler middleware
 * Catches all errors and sends appropriate response
 */
function errorHandler(err, req, res, next) {
  console.error('Error caught by error handler:', err);

  // Multer file upload errors
  if (err instanceof Error && err.message.includes('Only image files')) {
    return errorResponse(res, err.message, 400);
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return errorResponse(res, 'File size exceeds 10MB limit', 400);
  }

  // Multer errors
  if (err.name === 'MulterError') {
    return errorResponse(res, `File upload error: ${err.message}`, 400);
  }

  // Database errors
  if (err.code === '23505') {
    return errorResponse(res, 'Duplicate entry', 409);
  }

  if (err.code === '23503') {
    return errorResponse(res, 'Foreign key constraint violation', 400);
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return errorResponse(res, err.message, 400);
  }

  // JWT errors (if using authentication)
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 'Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 'Token expired', 401);
  }

  // Default error
  return errorResponse(
    res,
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    err.status || 500
  );
}

/**
 * 404 Not Found handler
 */
function notFoundHandler(req, res) {
  return errorResponse(res, `Route ${req.originalUrl} not found`, 404);
}

module.exports = {
  errorHandler,
  notFoundHandler
};
