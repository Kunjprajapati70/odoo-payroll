const { body } = require('express-validator');
const { ALL_ROLES } = require('../constants/roles');

const registerValidator = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('A valid email address is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(ALL_ROLES)
    .withMessage(`Role must be one of: ${ALL_ROLES.join(', ')}`),
  body('employeeId')
    .optional()
    .isMongoId()
    .withMessage('employeeId must be a valid MongoDB ObjectId')
];

const loginValidator = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('A valid email address is required')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const changePasswordValidator = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
];

module.exports = {
  registerValidator,
  loginValidator,
  changePasswordValidator
};
