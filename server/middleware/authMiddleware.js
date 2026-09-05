const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { JWT_SECRET } = require('../config/env')
const { unauthorized } = require('../utils/response')

const protect = async (req, res, next) => {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) return unauthorized(res)

  try {
    const token = auth.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)
    const user = await User.findById(decoded.id).select('-password')
    if (!user || !user.isActive) return unauthorized(res)
    req.user = user
    next()
  } catch {
    return unauthorized(res)
  }
}

module.exports = { protect }
