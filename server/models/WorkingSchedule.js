const mongoose = require('mongoose')

const workingScheduleSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  hoursPerWeek: { type: Number, default: 40 },
  workDays:     [{ type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] }],
  startTime:    { type: String }, // HH:mm
  endTime:      { type: String }, // HH:mm
  isDefault:    { type: Boolean, default: false },
}, { timestamps: true })

module.exports = mongoose.model('WorkingSchedule', workingScheduleSchema)
