const { body } = require('express-validator')

const loginValidation = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
]

const employeeValidation = [
  body('firstName').notEmpty().trim().withMessage('First name required'),
  body('lastName').notEmpty().trim().withMessage('Last name required'),
  body('email').isEmail().withMessage('Valid email required'),
]

const contractValidation = [
  body('employee').notEmpty().withMessage('Employee required'),
  body('wage').isNumeric({ min: 0 }).withMessage('Valid wage required'),
  body('contractType').notEmpty().withMessage('Contract type required'),
  body('startDate').isISO8601().withMessage('Valid start date required'),
]

module.exports = { loginValidation, employeeValidation, contractValidation }
