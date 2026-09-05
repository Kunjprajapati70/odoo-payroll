const { body, param } = require('express-validator');

const createRuleValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Salary rule name is required'),
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Rule code is required')
    .matches(/^[A-Z0-9_]+$/)
    .withMessage('Rule code must contain only uppercase letters, numbers, and underscores (e.g. BASIC, HRA, PF)'),
  body('category')
    .notEmpty()
    .withMessage('Rule category is required')
    .isIn(['BASIC', 'ALLOWANCE', 'GROSS', 'DEDUCTION', 'NET'])
    .withMessage('category must be one of: BASIC, ALLOWANCE, GROSS, DEDUCTION, NET'),
  body('sequence')
    .optional()
    .isInt({ min: 1 })
    .withMessage('sequence must be a positive integer (minimum 1)'),
  body('calculationType')
    .optional()
    .isIn(['FIXED', 'PERCENTAGE', 'FORMULA'])
    .withMessage('calculationType must be one of: FIXED, PERCENTAGE, FORMULA'),
  body('value')
    .optional()
    .isNumeric()
    .withMessage('value must be numeric'),
  body('formula')
    .optional()
    .trim(),
  body('baseCode')
    .optional()
    .trim(),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

const updateRuleValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid rule ID parameter'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Salary rule name cannot be empty'),
  body('code')
    .optional()
    .trim()
    .notEmpty()
    .matches(/^[A-Z0-9_]+$/)
    .withMessage('Rule code must contain only uppercase letters, numbers, and underscores'),
  body('category')
    .optional()
    .isIn(['BASIC', 'ALLOWANCE', 'GROSS', 'DEDUCTION', 'NET'])
    .withMessage('category must be one of: BASIC, ALLOWANCE, GROSS, DEDUCTION, NET'),
  body('sequence')
    .optional()
    .isInt({ min: 1 })
    .withMessage('sequence must be a positive integer (minimum 1)'),
  body('calculationType')
    .optional()
    .isIn(['FIXED', 'PERCENTAGE', 'FORMULA'])
    .withMessage('calculationType must be one of: FIXED, PERCENTAGE, FORMULA'),
  body('value')
    .optional()
    .isNumeric()
    .withMessage('value must be numeric'),
  body('formula')
    .optional()
    .trim(),
  body('baseCode')
    .optional()
    .trim(),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

module.exports = {
  createRuleValidator,
  updateRuleValidator
};
