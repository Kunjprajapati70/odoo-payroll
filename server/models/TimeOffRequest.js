const mongoose = require('mongoose')

const timeOffRequestSchema = new mongoose.Schema({
  employee:    { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  timeOffType: { type: mongoose.Schema.Types.ObjectId, ref: 'TimeOffType', required: true },
  startDate:   { type: Date, required: true },
  endDate:     { type: Date, required: true },
  days:        { type: Number, required: true, min: 0.5 },
  reason:      { type: String },
  status:      { type: String, enum: ['pending','approved','rejected','cancelled'], default: 'pending' },
  approvedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: { type: String },
  approvedAt:  { type: Date },
}, { timestamps: true })

module.exports = mongoose.model('TimeOffRequest', timeOffRequestSchema)
