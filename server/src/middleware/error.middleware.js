const { errorResponse } = require('../utils/response.util');

/**
 * 404 Not Found Middleware
 */
const notFoundHandler = (req, res) => {
  return errorResponse(
    res,
    `Resource not found: ${req.method} ${req.originalUrl}`,
    'ROUTE_NOT_FOUND',
    { method: req.method, path: req.originalUrl },
    404
  );
};

/**
 * Centralized Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected internal server error occurred';
  let details = err.details || {};

  // Mongoose invalid ObjectId
  if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = `Resource not found with id: ${err.value}`;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_KEY_ERROR';
    const field = Object.keys(err.keyValue || {})[0];
    message = `Duplicate value for field '${field}'`;
    details = err.keyValue;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 422;
    code = 'VALIDATION_ERROR';
    message = 'Validation error occurred';
    details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message
    }));
  }

  // Log non-operational errors in development
  if (process.env.NODE_ENV !== 'production' && statusCode >= 500) {
    console.error('[Error Middleware]:', err);
  }

  return errorResponse(res, message, code, details, statusCode);
};

module.exports = {
  notFoundHandler,
  errorHandler
};
