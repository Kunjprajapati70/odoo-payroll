const express = require('express');
const AuthController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
  registerValidator,
  loginValidator,
  changePasswordValidator
} = require('../validators/auth.validator');

const router = express.Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', registerValidator, validate, AuthController.register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post('/login', loginValidator, validate, AuthController.login);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private (Authenticated)
 */
router.get('/me', authenticate, AuthController.getMe);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user session
 * @access  Private (Authenticated)
 */
router.post('/logout', authenticate, AuthController.logout);

/**
 * @route   PUT /api/v1/auth/change-password
 * @desc    Update user password
 * @access  Private (Authenticated)
 */
router.put('/change-password', authenticate, changePasswordValidator, validate, AuthController.changePassword);

module.exports = router;
