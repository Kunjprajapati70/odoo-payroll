const { body, param } = require('express-validator');

const previewPayrunValidator = [
  body('salaryStructureId')
    .notEmpty()
    .withMessage('salaryStructureId is required')
    .isMongoId()
    .withMessage('salaryStructureId must be a valid MongoId'),
  body('periodStart')
    .notEmpty()
    .withMessage('periodStart is required')
    .isISO8601()
    .withMessage('periodStart must be a valid ISO8601 date'),
  body('periodEnd')
    .notEmpty()
    .withMessage('periodEnd is required')
    .isISO8601()
    .withMessage('periodEnd must be a valid ISO8601 date')
];

const createPayrunValidator = [
  body('salaryStructureId')
    .notEmpty()
    .withMessage('salaryStructureId is required')
    .isMongoId()
    .withMessage('salaryStructureId must be a valid MongoId'),
  body('periodStart')
    .notEmpty()
    .withMessage('periodStart is required')
    .isISO8601()
    .withMessage('periodStart must be a valid ISO8601 date'),
  body('periodEnd')
    .notEmpty()
    .withMessage('periodEnd is required')
    .isISO8601()
    .withMessage('periodEnd must be a valid ISO8601 date'),
  body('employeeIds')
    .notEmpty()
    .withMessage('employeeIds is required')
    .isArray({ min: 1 })
    .withMessage('employeeIds must be a non-empty array of employee IDs'),
  body('employeeIds.*')
    .isMongoId()
    .withMessage('Each employeeId must be a valid MongoId')
];

const payrunIdValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid payrun ID in URL parameter')
];

module.exports = {
  previewPayrunValidator,
  createPayrunValidator,
  payrunIdValidator
};
