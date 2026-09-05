/**
 * Standardized API Response Format
 */

const successResponse = (res, message = 'Success', data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...(data && Object.keys(data).length > 0 ? { data } : {})
  });
};

const errorResponse = (res, message = 'An error occurred', code = 'INTERNAL_ERROR', details = {}, statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: {
      code,
      details
    }
  });
};

class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = {}) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  successResponse,
  errorResponse,
  AppError
};
