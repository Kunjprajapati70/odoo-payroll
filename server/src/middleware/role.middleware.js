const { errorResponse } = require('../utils/response.util');

/**
 * Role-Based Access Control Middleware Helper
 * 
 * Usage:
 * authorize('ADMIN', 'PAYROLL_MANAGER')
 * 
 * Rules:
 * - ADMIN always has unrestricted access to all endpoints
 * - Other roles must be explicitly included in allowedRoles
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 'UNAUTHORIZED', {}, 401);
    }

    // ADMIN has full access to everything
    if (req.user.role === 'ADMIN') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Access denied. Required roles: [${allowedRoles.join(', ')}]. Your role: ${req.user.role}`,
        'FORBIDDEN',
        {
          requiredRoles: allowedRoles,
          currentRole: req.user.role
        },
        403
      );
    }

    next();
  };
};

/**
 * Guard for Employee Self-Service vs Management Access
 * Allows access if the resource belongs to the logged-in employee (self)
 * OR if the user holds one of the authorized management roles.
 */
const authorizeSelfOrRoles = (targetEmployeeIdResolver, ...managementRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 'UNAUTHORIZED', {}, 401);
    }

    // ADMIN bypass
    if (req.user.role === 'ADMIN') {
      return next();
    }

    // Check if user is in management roles
    if (managementRoles.includes(req.user.role)) {
      return next();
    }

    // Check if user is the employee themselves
    let targetEmployeeId = null;
    if (typeof targetEmployeeIdResolver === 'function') {
      targetEmployeeId = targetEmployeeIdResolver(req);
    } else if (typeof targetEmployeeIdResolver === 'string') {
      targetEmployeeId = req.params[targetEmployeeIdResolver] || req.body[targetEmployeeIdResolver] || req.query[targetEmployeeIdResolver];
    }

    const userEmployeeId = req.user.employeeId ? req.user.employeeId.toString() : null;

    if (userEmployeeId && targetEmployeeId && userEmployeeId === targetEmployeeId.toString()) {
      return next();
    }

    return errorResponse(
      res,
      'Access denied. You can only view or modify your own records.',
      'FORBIDDEN',
      { currentRole: req.user.role },
      403
    );
  };
};

module.exports = {
  authorize,
  authorizeSelfOrRoles
};
