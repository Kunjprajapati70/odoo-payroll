const asyncHandler = require('../utils/asyncHandler')
const User = require('../models/User')
const { ALL_ROLES } = require('../utils/roles')
const { success, created, notFound, badRequest } = require('../utils/response')
const { ensureEmployeeForUser } = require('../services/employeeLinkService')

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const getAll = asyncHandler(async (req, res) => {
  const { search, role, isActive } = req.query
  const filter = {}
  if (role) filter.role = role
  if (isActive === 'true') filter.isActive = true
  if (isActive === 'false') filter.isActive = false
  if (search) {
    filter.$or = [
      { name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
    ]
  }
  const users = await User.find(filter)
    .populate('employee', 'firstName lastName employeeId')
    .sort({ createdAt: -1 })
  success(res, users)
})

const getById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate('employee', 'firstName lastName employeeId')
  if (!user) return notFound(res, 'User not found')
  success(res, user)
})

const create = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, isActive, basicSalary } = req.body
  if (!name || !String(name).trim()) return badRequest(res, 'Name is required')
  if (!email || !EMAIL_RE.test(String(email).trim())) return badRequest(res, 'Valid email is required')
  if (!password || String(password).length < 6) {
    return badRequest(res, 'Password must be at least 6 characters')
  }
  if (role && !ALL_ROLES.includes(role)) return badRequest(res, 'Invalid role')
  if (basicSalary == null || basicSalary === '' || Number(basicSalary) <= 0) {
    return badRequest(res, 'Basic salary is required and must be a positive number')
  }

  if (phone) {
    const digits = String(phone).replace(/\D/g, '')
    if (digits.length !== 10) return badRequest(res, 'Phone number must be exactly 10 digits')
  }

  const exists = await User.findOne({ email: String(email).toLowerCase().trim() })
  if (exists) return badRequest(res, 'Email already registered — each user must have a unique email')

  try {
    const user = await User.create({
      name: String(name).trim(),
      email: String(email).toLowerCase().trim(),
      password,
      role: role || 'employee',
      phone: phone ? String(phone).replace(/\D/g, '') : undefined,
      isActive: isActive !== false,
    })

    await ensureEmployeeForUser(user, { basicSalary: Number(basicSalary) })

    const populated = await User.findById(user._id).populate('employee', 'firstName lastName employeeId')
    created(res, populated)
  } catch (err) {
    if (err.code === 11000) return badRequest(res, 'Email already registered — each user must have a unique email')
    throw err
  }
})

const update = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('+password')
  if (!user) return notFound(res, 'User not found')

  const { name, email, role, isActive, password, phone, basicSalary } = req.body
  if (name != null) {
    if (!String(name).trim()) return badRequest(res, 'Name is required')
    user.name = String(name).trim()
  }
  if (email != null) {
    if (!EMAIL_RE.test(String(email).trim())) return badRequest(res, 'Valid email is required')
    const clash = await User.findOne({
      email: String(email).toLowerCase().trim(),
      _id: { $ne: user._id },
    })
    if (clash) return badRequest(res, 'Email already registered — each user must have a unique email')
    user.email = String(email).toLowerCase().trim()
  }
  if (role != null) {
    if (!ALL_ROLES.includes(role)) return badRequest(res, 'Invalid role')
    user.role = role
  }
  if (isActive != null) user.isActive = isActive
  if (phone !== undefined) {
    if (phone === '' || phone == null) user.phone = undefined
    else {
      const digits = String(phone).replace(/\D/g, '')
      if (digits.length !== 10) return badRequest(res, 'Phone number must be exactly 10 digits')
      user.phone = digits
    }
  }
  if (password) {
    if (String(password).length < 6) return badRequest(res, 'Password must be at least 6 characters')
    user.password = password
  }

  try {
    await user.save()
    const opts = {}
    if (basicSalary != null && basicSalary !== '' && Number(basicSalary) > 0) {
      opts.basicSalary = Number(basicSalary)
    }
    await ensureEmployeeForUser(user, opts)
    const populated = await User.findById(user._id).populate('employee', 'firstName lastName employeeId')
    success(res, populated)
  } catch (err) {
    if (err.code === 11000) return badRequest(res, 'Email already registered — each user must have a unique email')
    throw err
  }
})

const remove = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) {
    return badRequest(res, 'You cannot delete your own account')
  }
  const user = await User.findByIdAndDelete(req.params.id)
  if (!user) return notFound(res, 'User not found')
  success(res, null, 'User deleted')
})

module.exports = { getAll, getById, create, update, remove }
