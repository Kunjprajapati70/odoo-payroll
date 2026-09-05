const User = require('../models/User')
const generateToken = require('../utils/generateToken')
const { success, badRequest, unauthorized, created } = require('../utils/response')
const { ALL_ROLES, ROLES } = require('../utils/roles')
const asyncHandler = require('../utils/asyncHandler')
const { sendPasswordResetEmail } = require('../services/emailService')
const crypto = require('crypto')

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body
  if (!name || !email || !password) {
    return badRequest(res, 'name, email and password are required')
  }
  if (!EMAIL_RE.test(String(email).trim())) {
    return badRequest(res, 'Valid email is required')
  }
  if (password.length < 6) {
    return badRequest(res, 'Password must be at least 6 characters')
  }

  const exists = await User.findOne({ email: email.toLowerCase() })
  if (exists) return badRequest(res, 'Email already registered')

  let assignedRole = ROLES.EMPLOYEE
  if (role && ALL_ROLES.includes(role)) {
    if (req.user?.role === ROLES.ADMIN) {
      assignedRole = role
    } else if (role === ROLES.EMPLOYEE) {
      assignedRole = ROLES.EMPLOYEE
    }
  }

  const user = await User.create({
    name,
    email,
    password,
    role: assignedRole,
  })

  const token = generateToken(user._id)
  created(res, { user, token }, 'Registered successfully')
})

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  const user = await User.findOne({ email: email?.toLowerCase() })
    .select('+password')
    .populate('employee', 'firstName lastName employeeId department')
  if (!user || !(await user.comparePassword(password))) {
    return unauthorized(res, 'Invalid credentials')
  }
  if (!user.isActive) return unauthorized(res, 'Account is inactive')

  const token = generateToken(user._id)
  const safeUser = user.toJSON()
  if (user.employee) {
    const { getBasicSalaryForEmployee } = require('../services/employeeLinkService')
    safeUser.basicSalary = await getBasicSalaryForEmployee(user.employee._id || user.employee)
  }
  success(res, { user: safeUser, token })
})

const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('employee', 'firstName lastName employeeId department')
  const payload = user.toJSON()
  if (user.employee) {
    const { getBasicSalaryForEmployee } = require('../services/employeeLinkService')
    payload.basicSalary = await getBasicSalaryForEmployee(user.employee._id || user.employee)
  } else {
    payload.basicSalary = 0
  }
  success(res, payload)
})

const logout = asyncHandler(async (req, res) => {
  success(res, null, 'Logged out')
})

const forgotPassword = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').toLowerCase().trim()
  if (!email || !EMAIL_RE.test(email)) {
    return badRequest(res, 'Valid email is required')
  }

  const user = await User.findOne({ email }).select('+resetPasswordToken +resetPasswordExpires')
  // Always return success to avoid email enumeration
  if (!user) {
    return success(res, null, 'Reset link sent if account exists')
  }

  const rawToken = user.createPasswordResetToken()
  await user.save({ validateBeforeSave: false })

  const mailResult = await sendPasswordResetEmail(user.email, rawToken, user.name)

  // In demo/dev without SMTP, return token so UI can complete the flow
  const payload = mailResult?.mocked
    ? { resetToken: rawToken, mocked: true, message: mailResult.message }
    : null

  success(res, payload, 'Reset link sent if account exists')
})

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password, email } = req.body
  if (!password || password.length < 6) {
    return badRequest(res, 'Password must be at least 6 characters')
  }

  let user = null
  if (token) {
    const hashed = crypto.createHash('sha256').update(String(token)).digest('hex')
    user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+password +resetPasswordToken +resetPasswordExpires')
  } else if (email) {
    // Fallback for demo when token emailed but user uses email+password reset
    user = await User.findOne({ email: String(email).toLowerCase() }).select('+password')
  } else {
    return badRequest(res, 'Reset token is required')
  }

  if (!user) {
    return badRequest(res, 'Invalid or expired reset token')
  }

  user.password = password
  user.resetPasswordToken = undefined
  user.resetPasswordExpires = undefined
  await user.save()

  success(res, null, 'Password has been reset')
})

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) {
    return badRequest(res, 'currentPassword and newPassword are required')
  }
  if (newPassword.length < 6) {
    return badRequest(res, 'New password must be at least 6 characters')
  }

  const user = await User.findById(req.user._id).select('+password')
  if (!user || !(await user.comparePassword(currentPassword))) {
    return badRequest(res, 'Current password is incorrect')
  }

  user.password = newPassword
  await user.save()
  success(res, null, 'Password changed successfully')
})

const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body
  const user = await User.findById(req.user._id)
  if (!user) return unauthorized(res)

  if (name != null) {
    if (!String(name).trim()) return badRequest(res, 'Name is required')
    user.name = String(name).trim()
  }
  if (phone != null) {
    const digits = String(phone).replace(/\D/g, '')
    if (phone !== '' && digits.length !== 10) {
      return badRequest(res, 'Phone number must be exactly 10 digits')
    }
    user.phone = digits || undefined
  }
  await user.save()
  const populated = await User.findById(user._id).populate('employee', 'firstName lastName employeeId')
  success(res, populated)
})

module.exports = {
  register,
  login,
  me,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  updateProfile,
}
