const { body, param } = require('express-validator');

const checkInValidator = [
  body('employeeId')
    .optional()
    .isMongoId()
    .withMessage('employeeId must be a valid MongoId'),
  body('checkInTime')
    .optional()
    .isISO8601()
    .withMessage('checkInTime must be a valid ISO8601 date')
];

const checkOutValidator = [
  body('employeeId')
    .optional()
    .isMongoId()
    .withMessage('employeeId must be a valid MongoId'),
  body('checkOutTime')
    .optional()
    .isISO8601()
    .withMessage('checkOutTime must be a valid ISO8601 date')
];

const createAttendanceValidator = [
  body('employeeId')
    .notEmpty()
    .withMessage('employeeId is required')
    .isMongoId()
    .withMessage('employeeId must be a valid MongoId'),
  body('date')
    .notEmpty()
    .withMessage('date is required')
    .isISO8601()
    .withMessage('date must be a valid ISO8601 date'),
  body('checkIn')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('checkIn must be a valid ISO8601 date'),
  body('checkOut')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('checkOut must be a valid ISO8601 date'),
  body('status')
    .optional()
    .isIn(['PRESENT', 'HALF_DAY', 'ABSENT', 'ON_LEAVE', 'HOLIDAY', 'WEEKEND'])
    .withMessage('Invalid status')
];

const updateAttendanceValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid attendance ID in URL parameter'),
  body('correctionReason')
    .trim()
    .notEmpty()
    .withMessage('correctionReason is required for manual attendance updates')
];

module.exports = {
  checkInValidator,
  checkOutValidator,
  createAttendanceValidator,
  updateAttendanceValidator
};
