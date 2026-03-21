/**
 * Success response helper
 * @param {Object} res - Express response object
 * @param {Object} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 */
function successResponse(res, data = null, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

/**
 * Error response helper
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {Object} errors - Additional error details
 */
function errorResponse(res, message = 'Error occurred', statusCode = 500, errors = null) {
  const response = {
    success: false,
    message
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
}

/**
 * Format validation errors
 * @param {Array} errors - Express-validator errors array
 * @returns {Object} Formatted errors object
 */
function formatValidationErrors(errors) {
  return errors.reduce((acc, error) => {
    acc[error.path || error.param] = error.msg;
    return acc;
  }, {});
}

module.exports = {
  successResponse,
  errorResponse,
  formatValidationErrors
};
