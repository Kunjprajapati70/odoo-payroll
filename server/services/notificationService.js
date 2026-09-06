const Notification = require('../models/Notification')
const User = require('../models/User')
const Employee = require('../models/Employee')
const { ROLES, TIMEOFF_APPROVE_ROLES } = require('../utils/roles')
const AppError = require('../utils/AppError')

/**
 * Create an in-app notification. Never throws to callers that wrap with safeNotify.
 */
const createNotification = async ({ userId, title, message, type = 'system', metadata = {} }) => {
  if (!userId) return null
  return Notification.create({
    userId,
    title,
    message,
    type,
    metadata,
    isRead: false,
  })
}

const safeNotify = async (label, fn) => {
  try {
    return await fn()
  } catch (err) {
    console.error(`[notify:${label}]`, err.message)
    return { ok: false, error: err.message }
  }
}

const findHrApproverUsers = async () =>
  User.find({
    role: { $in: TIMEOFF_APPROVE_ROLES },
    isActive: true,
  }).select('_id name email role')

const findAdminUsers = async () =>
  User.find({
    role: ROLES.ADMIN,
    isActive: true,
  }).select('_id name email role')

const findUserForEmployee = async (employeeId) => {
  if (!employeeId) return null
  const emp = await Employee.findById(employeeId).select('user email')
  if (emp?.user) {
    return User.findById(emp.user).select('_id name email role')
  }
  if (emp?.email) {
    return User.findOne({ email: String(emp.email).toLowerCase() }).select('_id name email role')
  }
  return User.findOne({ employee: employeeId }).select('_id name email role')
}

const listForUser = async (userId, { limit = 50 } = {}) => {
  const notifications = await Notification.find({ userId })
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit) || 50, 100))
  const unreadCount = await Notification.countDocuments({ userId, isRead: false })
  return { notifications, unreadCount }
}

const markAsRead = async (notificationId, userId) => {
  const n = await Notification.findById(notificationId)
  if (!n) throw new AppError('Notification not found', 404)
  if (String(n.userId) !== String(userId)) {
    throw new AppError('You can only access your own notifications', 403)
  }
  if (!n.isRead) {
    n.isRead = true
    await n.save()
  }
  return n
}

const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { userId, isRead: false },
    { $set: { isRead: true } }
  )
  return { modified: result.modifiedCount || 0 }
}

module.exports = {
  createNotification,
  safeNotify,
  findHrApproverUsers,
  findAdminUsers,
  findUserForEmployee,
  listForUser,
  markAsRead,
  markAllAsRead,
  ROLES,
}
