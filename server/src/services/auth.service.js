const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const Employee = require('../models/Employee');
const { AppError } = require('../utils/response.util');

class AuthService {
  /**
   * Generate signed JWT with userId, role, and employeeId
   */
  static generateToken(user) {
    const payload = {
      userId: user._id.toString(),
      role: user.role,
      employeeId: user.employeeId ? (user.employeeId._id ? user.employeeId._id.toString() : user.employeeId.toString()) : null
    };

    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN
    });
  }

  /**
   * Register a new user
   */
  static async register({ email, password, role = 'EMPLOYEE', employeeId = null }) {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new AppError('A user with this email address already exists', 409, 'CONFLICT', { email });
    }

    if (employeeId) {
      const employee = await Employee.findById(employeeId);
      if (!employee) {
        throw new AppError('Referenced employee does not exist', 422, 'VALIDATION_ERROR', { employeeId });
      }
    }

    const user = await User.create({
      email: email.toLowerCase(),
      password,
      role,
      employeeId: employeeId || null
    });

    const token = AuthService.generateToken(user);
    const userSafe = user.toJSON();

    return {
      user: userSafe,
      token
    };
  }

  /**
   * Login with email and password
   */
  static async login({ email, password }) {
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password')
      .populate('employeeId');

    if (!user) {
      throw new AppError('Invalid email or password', 401, 'UNAUTHORIZED');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401, 'UNAUTHORIZED');
    }

    if (!user.isActive) {
      throw new AppError('User account is deactivated. Contact an administrator.', 403, 'FORBIDDEN');
    }

    const token = AuthService.generateToken(user);
    const userSafe = user.toJSON();

    return {
      user: userSafe,
      token
    };
  }

  /**
   * Retrieve current authenticated user profile
   */
  static async getMe(userId) {
    const user = await User.findById(userId).populate('employeeId');
    if (!user) {
      throw new AppError('User not found', 401, 'UNAUTHORIZED');
    }

    return user.toJSON();
  }

  /**
   * Invalidate or logout session
   */
  static async logout() {
    return {
      message: 'Logged out successfully'
    };
  }

  /**
   * Change user password
   */
  static async changePassword(userId, { currentPassword, newPassword }) {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new AppError('User not found', 401, 'UNAUTHORIZED');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new AppError('Current password is incorrect', 401, 'UNAUTHORIZED', { field: 'currentPassword' });
    }

    user.password = newPassword;
    await user.save();

    return {
      message: 'Password changed successfully'
    };
  }
}

module.exports = AuthService;
