const asyncHandler = require('../utils/asyncHandler')
const User = require('../models/User')
const { ALL_ROLES, ROLES, HR_ASSIGNABLE_ROLES } = require('../utils/roles')
const { success, created, notFound, badRequest, forbidden } = require('../utils/response')
const { ensureEmployeeForUser } = require('../services/employeeLinkService')

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const isHrActor = (actor) => actor?.role === ROLES.HR_MANAGER

const assertHrMayAssignRole = (role) => {
  if (!HR_ASSIGNABLE_ROLES.includes(role)) {
    return `HR Manager cannot assign role "${role}". Allowed: ${HR_ASSIGNABLE_ROLES.join(', ')}`
  }
  return null
}

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
    .populate('createdBy', 'name role email')
    .sort({ createdAt: -1 })
  success(res, users)
})

const getById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate('employee', 'firstName lastName employeeId')
    .populate('createdBy', 'name role email')
  if (!user) return notFound(res, 'User not found')
  success(res, user)
})

const create = asyncHandler(async (req, res) => {
  const actor = req.user
  const { name, email, password, role, phone, isActive, basicSalary } = req.body
  if (!name || !String(name).trim()) return badRequest(res, 'Name is required')
  if (!email || !EMAIL_RE.test(String(email).trim())) return badRequest(res, 'Valid email is required')
  if (!password || String(password).length < 6) {
    return badRequest(res, 'Password must be at least 6 characters')
  }

  const assignedRole = role || ROLES.EMPLOYEE
  if (!ALL_ROLES.includes(assignedRole)) return badRequest(res, 'Invalid role')

  if (isHrActor(actor)) {
    const roleErr = assertHrMayAssignRole(assignedRole)
    if (roleErr) return forbidden(res, roleErr)
  }

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
    const plainPassword = String(password)
    const user = await User.create({
      name: String(name).trim(),
      email: String(email).toLowerCase().trim(),
      password: plainPassword,
      role: assignedRole,
      phone: phone ? String(phone).replace(/\D/g, '') : undefined,
      isActive: isActive !== false,
      createdBy: actor?._id,
    })

    await ensureEmployeeForUser(user, { basicSalary: Number(basicSalary) })

    // Send login credentials to the new user's email (never fail account creation)
    let credentialsEmail = { sent: false }
    try {
      const { sendWelcomeCredentialsEmail } = require('../services/emailService')
      const {
        createNotification,
        safeNotify,
        findAdminUsers,
      } = require('../services/notificationService')
      credentialsEmail = await sendWelcomeCredentialsEmail({
        to: user.email,
        name: user.name,
        loginId: user.email,
        password: plainPassword,
        role: user.role,
      })
      await safeNotify('user-welcome', async () => {
        await createNotification({
          userId: user._id,
          title: 'Welcome to PeoplePay360',
          message: 'Your account was created. Check your email for login ID and password.',
          type: 'system',
          metadata: { emailSent: !!credentialsEmail.sent, mocked: !!credentialsEmail.mocked },
        })
      })

      // When HR creates a user, notify all admins so it appears in admin activity
      if (isHrActor(actor)) {
        await safeNotify('hr-user-created-admins', async () => {
          const admins = await findAdminUsers()
          const roleLabel = String(user.role).replace(/_/g, ' ')
          for (const admin of admins) {
            await createNotification({
              userId: admin._id,
              title: 'HR created a user',
              message: `${actor.name || 'HR Manager'} created ${user.name} (${user.email}) as ${roleLabel}.`,
              type: 'system',
              metadata: {
                createdUserId: String(user._id),
                createdBy: String(actor._id),
                role: user.role,
                emailSent: !!credentialsEmail.sent,
              },
            })
          }
        })
      }
    } catch (mailErr) {
      console.error('[user-create-email]', mailErr.message)
    }

    const populated = await User.findById(user._id)
      .populate('employee', 'firstName lastName employeeId')
      .populate('createdBy', 'name role email')
    const payload = populated.toObject ? populated.toObject() : { ...populated }
    payload.credentialsEmail = {
      sent: !!credentialsEmail.sent,
      mocked: !!credentialsEmail.mocked,
      to: credentialsEmail.to || user.email,
      error: credentialsEmail.error || undefined,
    }
    created(res, payload, credentialsEmail.sent
      ? (credentialsEmail.mocked ? 'User created (email mocked — SMTP not configured)' : 'User created and login credentials emailed')
      : 'User created, but credentials email could not be sent')
  } catch (err) {
    if (err.code === 11000) return badRequest(res, 'Email already registered — each user must have a unique email')
    throw err
  }
})

const update = asyncHandler(async (req, res) => {
  const actor = req.user
  const user = await User.findById(req.params.id).select('+password')
  if (!user) return notFound(res, 'User not found')

  if (isHrActor(actor)) {
    if (user.role === ROLES.ADMIN) {
      return forbidden(res, 'HR Manager cannot modify admin accounts')
    }
  }

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
    if (isHrActor(actor)) {
      const roleErr = assertHrMayAssignRole(role)
      if (roleErr) return forbidden(res, roleErr)
    }
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
    const populated = await User.findById(user._id)
      .populate('employee', 'firstName lastName employeeId')
      .populate('createdBy', 'name role email')
    success(res, populated)
  } catch (err) {
    if (err.code === 11000) return badRequest(res, 'Email already registered — each user must have a unique email')
    throw err
  }
})

const remove = asyncHandler(async (req, res) => {
  const actor = req.user
  if (String(req.params.id) === String(actor._id)) {
    return badRequest(res, 'You cannot delete your own account')
  }
  const user = await User.findById(req.params.id)
  if (!user) return notFound(res, 'User not found')

  if (isHrActor(actor) && user.role === ROLES.ADMIN) {
    return forbidden(res, 'HR Manager cannot delete admin accounts')
  }

  await User.findByIdAndDelete(req.params.id)
  success(res, null, 'User deleted')
})

module.exports = { getAll, getById, create, update, remove }
