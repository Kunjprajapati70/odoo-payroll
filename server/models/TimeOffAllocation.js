const mongoose = require('mongoose')

const timeOffAllocationSchema = new mongoose.Schema({
  employee:    { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  timeOffType: { type: mongoose.Schema.Types.ObjectId, ref: 'TimeOffType', required: true },
  year:        { type: Number, required: true },
  totalDays:   { type: Number, required: true, min: 0 },
  usedDays:    { type: Number, default: 0 },
  notes:       { type: String },
}, { timestamps: true })

timeOffAllocationSchema.virtual('remainingDays').get(function () {
  return this.totalDays - this.usedDays
})

module.exports = mongoose.model('TimeOffAllocation', timeOffAllocationSchema)
