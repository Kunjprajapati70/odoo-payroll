const mongoose = require('mongoose')

const timeOffAllocationSchema = new mongoose.Schema({
  employee:    { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  timeOffType: { type: mongoose.Schema.Types.ObjectId, ref: 'TimeOffType', required: true },
  year:        { type: Number, required: true },
  totalDays:   { type: Number, required: true, min: 0 },
  usedDays:    { type: Number, default: 0, min: 0 },
  notes:       { type: String },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })

timeOffAllocationSchema.virtual('remainingDays').get(function () {
  return Math.max(0, (this.totalDays || 0) - (this.usedDays || 0))
})

timeOffAllocationSchema.virtual('allocatedDays').get(function () {
  return this.totalDays
})

timeOffAllocationSchema.index({ employee: 1, timeOffType: 1, year: 1 }, { unique: true })

module.exports = mongoose.model('TimeOffAllocation', timeOffAllocationSchema)
