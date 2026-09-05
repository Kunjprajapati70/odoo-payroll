const asyncHandler = require('../utils/asyncHandler')
const notificationService = require('../services/notificationService')
const { sendTestEmail, isEmailConfigured } = require('../services/emailService')
const { success, badRequest, notFound } = require('../utils/response')
const { NODE_ENV } = require('../config/env')
const AppError = require('../utils/AppError')

const getNotifications = asyncHandler(async (req, res) => {
  const limit = req.query.limit
  const data = await notificationService.listForUser(req.user._id, { limit })
  // Keep envelope shape used by frontend interceptor + explicit unreadCount
  success(res, {
    notifications: data.notifications,
    unreadCount: data.unreadCount,
  })
})

const markRead = asyncHandler(async (req, res) => {
  try {
    const n = await notificationService.markAsRead(req.params.id, req.user._id)
    success(res, n, 'Marked as read')
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode || 400).json({ success: false, message: err.message })
    }
    throw err
  }
})

const markAllRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user._id)
  success(res, result, 'All notifications marked as read')
})

/**
 * Development-only SMTP test. Blocked in production.
 * POST /api/notifications/test-email { to?: string }
 */
const testEmail = asyncHandler(async (req, res) => {
  if (NODE_ENV === 'production') {
    return notFound(res, 'Not found')
  }
  if (!['admin', 'hr_manager'].includes(req.user.role)) {
    return badRequest(res, 'Only admin/HR can run the SMTP test in development')
  }
  const to = req.body?.to || req.user.email
  const result = await sendTestEmail(to)
  success(res, {
    ...result,
    configured: isEmailConfigured(),
  }, result.sent ? (result.mocked ? 'SMTP mocked (not configured)' : 'Test email sent') : 'Test email failed')
})

module.exports = {
  getNotifications,
  markRead,
  markAllRead,
  testEmail,
}
