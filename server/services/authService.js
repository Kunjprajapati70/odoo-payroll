/**
 * Auth helpers beyond controller (password reset hooks live here for future use).
 */
const User = require('../models/User')
const generateToken = require('../utils/generateToken')
const AppError = require('../utils/AppError')

const loginUser = async (email, password) => {
  const user = await User.findOne({ email: email?.toLowerCase() }).select('+password')
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid credentials', 401)
  }
  if (!user.isActive) throw new AppError('Account is inactive', 401)
  const token = generateToken(user._id)
  return { user: user.toJSON(), token }
}

const registerUser = async ({ name, email, password, role = 'employee' }) => {
  const exists = await User.findOne({ email: email?.toLowerCase() })
  if (exists) throw new AppError('Email already registered', 400)
  const user = await User.create({ name, email, password, role })
  const token = generateToken(user._id)
  return { user, token }
}

module.exports = { loginUser, registerUser }
