const router = require('express').Router()
const {
  register,
  login,
  me,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  updateProfile,
} = require('../controllers/authController')
const { protect } = require('../middleware/authMiddleware')
const { validate } = require('../middleware/validationMiddleware')
const { body } = require('express-validator')
const { loginValidation } = require('../utils/validators')

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
]

router.post('/register', registerValidation, validate, register)
router.post('/login', loginValidation, validate, login)
router.post('/logout', protect, logout)
router.get('/me', protect, me)
router.put('/profile', protect, updateProfile)
router.post('/change-password', protect, changePassword)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)

module.exports = router
