const router = require('express').Router()
const { login, me, logout, forgotPassword } = require('../controllers/authController')
const { protect } = require('../middleware/authMiddleware')
const { validate } = require('../middleware/validationMiddleware')
const { loginValidation } = require('../utils/validators')

router.post('/login', loginValidation, validate, login)
router.post('/logout', protect, logout)
router.get('/me', protect, me)
router.post('/forgot-password', forgotPassword)

module.exports = router
