const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const { errorResponse } = require('../utils/response.util');

const authenticate = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return errorResponse(res, 'Authentication token is required', 'UNAUTHORIZED', {}, 401);
    }

    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return errorResponse(res, 'Authentication token has expired', 'UNAUTHORIZED', { reason: 'TOKEN_EXPIRED' }, 401);
      }
      return errorResponse(res, 'Invalid authentication token', 'UNAUTHORIZED', { reason: 'INVALID_TOKEN' }, 401);
    }

    const userId = decoded.userId || decoded.id;
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return errorResponse(res, 'User no longer exists', 'UNAUTHORIZED', { reason: 'USER_NOT_FOUND' }, 401);
    }

    if (!user.isActive) {
      return errorResponse(res, 'User account is deactivated', 'FORBIDDEN', { reason: 'USER_INACTIVE' }, 403);
    }

    req.user = user;
    req.auth = {
      userId: user._id.toString(),
      role: user.role,
      employeeId: user.employeeId ? user.employeeId.toString() : null
    };

    next();
  } catch (error) {
    return errorResponse(res, 'Authentication failed', 'UNAUTHORIZED', { error: error.message }, 401);
  }
};

module.exports = {
  authenticate
};
