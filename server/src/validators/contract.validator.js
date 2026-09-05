const { body, param } = require('express-validator');

const createContractValidator = [
  body('employeeId')
    .notEmpty()
    .withMessage('employeeId is required')
    .isMongoId()
    .withMessage('employeeId must be a valid MongoId'),
  body('startDate')
    .notEmpty()
    .withMessage('startDate is required')
    .isISO8601()
    .withMessage('startDate must be a valid ISO8601 date'),
  body('endDate')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('endDate must be a valid ISO8601 date'),
  body('salary')
    .notEmpty()
    .withMessage('salary is required')
    .isFloat({ min: 0 })
    .withMessage('salary must be a non-negative number'),
  body('salaryStructureId')
    .notEmpty()
    .withMessage('salaryStructureId is required')
    .isMongoId()
    .withMessage('salaryStructureId must be a valid MongoId'),
  body('status')
    .optional()
    .isIn(['DRAFT', 'ACTIVE', 'EXPIRED', 'CANCELLED'])
    .withMessage('Invalid contract status')
];

const updateContractValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid contract ID parameter'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('startDate must be a valid ISO8601 date'),
  body('endDate')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('endDate must be a valid ISO8601 date'),
  body('salary')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('salary must be a non-negative number'),
  body('salaryStructureId')
    .optional()
    .isMongoId()
    .withMessage('salaryStructureId must be a valid MongoId'),
  body('status')
    .optional()
    .isIn(['DRAFT', 'ACTIVE', 'EXPIRED', 'CANCELLED'])
    .withMessage('Invalid contract status')
];

module.exports = {
  createContractValidator,
  updateContractValidator
};
