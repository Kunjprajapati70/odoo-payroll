const { body, param } = require('express-validator');

const createStructureValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Salary structure name is required'),
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Salary structure code is required')
    .matches(/^[A-Z0-9_]+$/)
    .withMessage('Salary structure code must contain only uppercase letters, numbers, and underscores'),
  body('description')
    .optional()
    .trim(),
  body('ruleIds')
    .optional()
    .isArray()
    .withMessage('ruleIds must be an array of rule IDs'),
  body('rules')
    .optional()
    .isArray()
    .withMessage('rules must be an array of rule IDs'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

const updateStructureValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid salary structure ID parameter'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Salary structure name cannot be empty'),
  body('code')
    .optional()
    .trim()
    .notEmpty()
    .matches(/^[A-Z0-9_]+$/)
    .withMessage('Salary structure code must contain only uppercase letters, numbers, and underscores'),
  body('description')
    .optional()
    .trim(),
  body('ruleIds')
    .optional()
    .isArray()
    .withMessage('ruleIds must be an array of rule IDs'),
  body('rules')
    .optional()
    .isArray()
    .withMessage('rules must be an array of rule IDs'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

module.exports = {
  createStructureValidator,
  updateStructureValidator
};
