const { forbidden } = require('../utils/response')
const { ROLES } = require('../utils/roles')

/**
 * Restrict route to one or more roles.
 * Admin always passes.
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return forbidden(res, 'Authentication required')
  if (req.user.role === ROLES.ADMIN) return next()
  if (!roles.includes(req.user.role)) {
    return forbidden(res, 'You do not have permission to perform this action')
  }
  next()
}

module.exports = { requireRole }
