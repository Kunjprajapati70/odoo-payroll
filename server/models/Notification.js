const mongoose = require('mongoose')

const NOTIFICATION_TYPES = ['leave', 'payroll', 'payslip', 'contract', 'attendance', 'system']

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: { type: String, enum: NOTIFICATION_TYPES, default: 'system', index: true },
    isRead: { type: Boolean, default: false, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
)

notificationSchema.index({ userId: 1, createdAt: -1 })
notificationSchema.index({ userId: 1, isRead: 1 })

module.exports = mongoose.model('Notification', notificationSchema)
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES
