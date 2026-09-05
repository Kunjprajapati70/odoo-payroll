const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/response.util');

/**
 * Middleware to extract and format validation results from express-validator
 * Returns HTTP 422 VALIDATION_ERROR
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));

    return errorResponse(
      res,
      'Validation failed for input data',
      'VALIDATION_ERROR',
      { errors: formattedErrors },
      422
    );
  }
  next();
};

module.exports = {
  validate
};
