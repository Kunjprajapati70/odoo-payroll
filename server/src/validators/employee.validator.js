const { body, param, query } = require('express-validator');

const createEmployeeValidator = [
  body('employeeCode')
    .trim()
    .notEmpty()
    .withMessage('employeeCode is required'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('firstName is required'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('lastName is required'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('A valid email is required')
    .normalizeEmail(),
  body('department')
    .trim()
    .notEmpty()
    .withMessage('department is required'),
  body('jobPosition')
    .trim()
    .notEmpty()
    .withMessage('jobPosition is required'),
  body('employeeType')
    .optional()
    .isIn(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'PROBATION'])
    .withMessage('Invalid employeeType'),
  body('managerId')
    .optional({ nullable: true })
    .isMongoId()
    .withMessage('managerId must be a valid MongoId'),
  body('workingScheduleId')
    .optional({ nullable: true })
    .isMongoId()
    .withMessage('workingScheduleId must be a valid MongoId')
];

const updateEmployeeValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid employee ID in URL parameter'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('A valid email is required')
    .normalizeEmail(),
  body('employeeType')
    .optional()
    .isIn(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'PROBATION'])
    .withMessage('Invalid employeeType'),
  body('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE', 'TERMINATED', 'ON_LEAVE'])
    .withMessage('Invalid status')
];

const updateStatusValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid employee ID in URL parameter'),
  body('status')
    .notEmpty()
    .withMessage('status is required')
    .isIn(['ACTIVE', 'INACTIVE', 'TERMINATED', 'ON_LEAVE'])
    .withMessage('status must be one of: ACTIVE, INACTIVE, TERMINATED, ON_LEAVE')
];

module.exports = {
  createEmployeeValidator,
  updateEmployeeValidator,
  updateStatusValidator
};
