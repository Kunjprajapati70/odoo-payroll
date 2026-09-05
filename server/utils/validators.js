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
  body('salaryStructure').optional({ nullable: true, checkFalsy: true }),
  body('startDate').isISO8601().withMessage('Valid start date required'),
  body().custom((_, { req }) => {
    if (req.body.wage == null && req.body.salary == null) {
      throw new Error('wage or salary is required')
    }
    if (!req.body.contractType && !req.body.type) {
      throw new Error('contractType is required')
    }
    return true
  }),
]

module.exports = { loginValidation, employeeValidation, contractValidation }
