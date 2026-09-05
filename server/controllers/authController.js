const User = require('../models/User')
const generateToken = require('../utils/generateToken')
const { success, badRequest, unauthorized } = require('../utils/response')

const login = async (req, res) => {
  const { email, password } = req.body
  const user = await User.findOne({ email })
  if (!user || !(await user.comparePassword(password))) return unauthorized(res, 'Invalid credentials')
  const token = generateToken(user._id)
  success(res, { user, token })
}

const me = async (req, res) => success(res, req.user)

const logout = (req, res) => success(res, null, 'Logged out')

const forgotPassword = async (req, res) => {
  // TODO: implement password reset email
  success(res, null, 'Reset link sent if account exists')
}

module.exports = { login, me, logout, forgotPassword }
