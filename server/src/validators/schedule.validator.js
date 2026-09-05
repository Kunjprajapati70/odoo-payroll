const { body, param } = require('express-validator');

const createScheduleValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Schedule name is required'),
  body('lines')
    .isArray({ min: 1 })
    .withMessage('Schedule must contain at least one daily line'),
  body('lines.*.dayOfWeek')
    .isInt({ min: 0, max: 6 })
    .withMessage('dayOfWeek must be between 0 (Sunday) and 6 (Saturday)'),
  body('lines.*.startTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('startTime must be in HH:mm format'),
  body('lines.*.endTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('endTime must be in HH:mm format'),
  body('lines.*.breakMinutes')
    .optional()
    .isInt({ min: 0 })
    .withMessage('breakMinutes must be a non-negative integer')
];

const updateScheduleValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid schedule ID parameter'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Schedule name cannot be empty'),
  body('lines')
    .optional()
    .isArray({ min: 1 })
    .withMessage('lines must be an array with at least one line'),
  body('lines.*.dayOfWeek')
    .optional()
    .isInt({ min: 0, max: 6 })
    .withMessage('dayOfWeek must be between 0 and 6'),
  body('lines.*.startTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('startTime must be in HH:mm format'),
  body('lines.*.endTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('endTime must be in HH:mm format')
];

module.exports = {
  createScheduleValidator,
  updateScheduleValidator
};
