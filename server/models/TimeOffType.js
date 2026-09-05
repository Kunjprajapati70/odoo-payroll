const mongoose = require('mongoose')

const timeOffTypeSchema = new mongoose.Schema({
  name:            { type: String, required: true, trim: true },
  code:            { type: String, required: true, unique: true, uppercase: true },
  defaultDays:     { type: Number, default: 0 },
  isPaid:          { type: Boolean, default: true },
  requiresApproval:{ type: Boolean, default: true },
  color:           { type: String, default: '#6366f1' },
  isActive:        { type: Boolean, default: true },
}, { timestamps: true })

module.exports = mongoose.model('TimeOffType', timeOffTypeSchema)
