const { body, param } = require('express-validator');

// ==========================================
// TIME OFF TYPES
// ==========================================

const createTypeValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required'),
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Code is required')
    .isUppercase()
    .withMessage('Code should be uppercase (e.g. SICK, CASUAL, ANNUAL)'),
  body('isPaid')
    .optional()
    .isBoolean()
    .withMessage('isPaid must be a boolean'),
  body('requiresApproval')
    .optional()
    .isBoolean()
    .withMessage('requiresApproval must be a boolean')
];

const updateTypeValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid time off type ID in parameter'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty'),
  body('code')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Code cannot be empty')
    .isUppercase()
    .withMessage('Code should be uppercase'),
  body('isPaid')
    .optional()
    .isBoolean()
    .withMessage('isPaid must be a boolean'),
  body('requiresApproval')
    .optional()
    .isBoolean()
    .withMessage('requiresApproval must be a boolean'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

// ==========================================
// LEAVE ALLOCATIONS
// ==========================================

const createAllocationValidator = [
  body('employeeId')
    .notEmpty()
    .withMessage('employeeId is required')
    .isMongoId()
    .withMessage('employeeId must be a valid MongoId'),
  body('timeOffTypeId')
    .notEmpty()
    .withMessage('timeOffTypeId is required')
    .isMongoId()
    .withMessage('timeOffTypeId must be a valid MongoId'),
  body('allocated')
    .notEmpty()
    .withMessage('allocated is required')
    .isFloat({ min: 0.5 })
    .withMessage('allocated must be a positive number (minimum 0.5)'),
  body('validFrom')
    .optional()
    .isISO8601()
    .withMessage('validFrom must be a valid ISO8601 date'),
  body('validTo')
    .optional()
    .isISO8601()
    .withMessage('validTo must be a valid ISO8601 date'),
  body('effectiveFrom')
    .optional()
    .isISO8601()
    .withMessage('effectiveFrom must be a valid ISO8601 date'),
  body('effectiveTo')
    .optional()
    .isISO8601()
    .withMessage('effectiveTo must be a valid ISO8601 date')
];

const updateAllocationValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid leave allocation ID in parameter'),
  body('allocated')
    .optional()
    .isFloat({ min: 0.5 })
    .withMessage('allocated must be a positive number (minimum 0.5)'),
  body('validFrom')
    .optional()
    .isISO8601()
    .withMessage('validFrom must be a valid ISO8601 date'),
  body('validTo')
    .optional()
    .isISO8601()
    .withMessage('validTo must be a valid ISO8601 date'),
  body('effectiveFrom')
    .optional()
    .isISO8601()
    .withMessage('effectiveFrom must be a valid ISO8601 date'),
  body('effectiveTo')
    .optional()
    .isISO8601()
    .withMessage('effectiveTo must be a valid ISO8601 date')
];

// ==========================================
// LEAVE REQUESTS
// ==========================================

const createLeaveRequestValidator = [
  body('timeOffTypeId')
    .notEmpty()
    .withMessage('timeOffTypeId is required')
    .isMongoId()
    .withMessage('timeOffTypeId must be a valid MongoId'),
  body('startDate')
    .notEmpty()
    .withMessage('startDate is required')
    .isISO8601()
    .withMessage('startDate must be a valid ISO8601 date'),
  body('endDate')
    .notEmpty()
    .withMessage('endDate is required')
    .isISO8601()
    .withMessage('endDate must be a valid ISO8601 date'),
  body('duration')
    .notEmpty()
    .withMessage('duration is required')
    .isFloat({ min: 0.5 })
    .withMessage('duration must be at least 0.5 days'),
  body('employeeId')
    .optional()
    .isMongoId()
    .withMessage('employeeId must be a valid MongoId'),
  body('allocationId')
    .optional()
    .isMongoId()
    .withMessage('allocationId must be a valid MongoId'),
  body('notes')
    .optional()
    .trim()
];

const updateLeaveRequestValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid leave request ID in parameter'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('startDate must be a valid ISO8601 date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('endDate must be a valid ISO8601 date'),
  body('duration')
    .optional()
    .isFloat({ min: 0.5 })
    .withMessage('duration must be at least 0.5 days'),
  body('notes')
    .optional()
    .trim()
];

const refuseLeaveRequestValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid leave request ID in parameter'),
  body('reason')
    .optional()
    .trim()
];

module.exports = {
  createTypeValidator,
  updateTypeValidator,
  createAllocationValidator,
  updateAllocationValidator,
  createLeaveRequestValidator,
  updateLeaveRequestValidator,
  refuseLeaveRequestValidator
};
