const AuthService = require('../services/auth.service');
const { successResponse } = require('../utils/response.util');

class AuthController {
  static async register(req, res, next) {
    try {
      const result = await AuthService.register(req.body);
      return successResponse(res, 'User registered successfully', result, 201);
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const result = await AuthService.login(req.body);
      return successResponse(res, 'Login successful', result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req, res, next) {
    try {
      const user = await AuthService.getMe(req.user._id);
      return successResponse(res, 'User profile retrieved', { user }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res, next) {
    try {
      const result = await AuthService.logout();
      return successResponse(res, result.message, {}, 200);
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req, res, next) {
    try {
      const result = await AuthService.changePassword(req.user._id, req.body);
      return successResponse(res, result.message, {}, 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
