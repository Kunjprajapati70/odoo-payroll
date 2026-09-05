const mongoose = require('mongoose')

const timeOffRequestSchema = new mongoose.Schema({
  employee:    { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  timeOffType: { type: mongoose.Schema.Types.ObjectId, ref: 'TimeOffType', required: true },
  startDate:   { type: Date, required: true },
  endDate:     { type: Date, required: true },
  dayType:     { type: String, enum: ['full_day', 'half_day'], default: 'full_day' },
  halfDayPeriod: { type: String, enum: ['morning', 'evening'], default: undefined },
  days:        { type: Number, required: true, min: 0.5 },
  reason:      { type: String },
  status:      { type: String, enum: ['pending','approved','rejected','cancelled'], default: 'pending' },
  approvedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: { type: String },
  approvedAt:  { type: Date },
  // Duplicate email/notification protection
  emailsSent: {
    created: { type: Boolean, default: false },
    approved: { type: Boolean, default: false },
    rejected: { type: Boolean, default: false },
  },
}, { timestamps: true })

module.exports = mongoose.model('TimeOffRequest', timeOffRequestSchema)
