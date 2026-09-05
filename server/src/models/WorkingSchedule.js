const mongoose = require('mongoose');

const scheduleLineSchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: Number, // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      required: [true, 'Day of week is required (0-6)'],
      min: 0,
      max: 6
    },
    startTime: {
      type: String, // e.g. "09:00" (HH:mm)
      required: [true, 'Start time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:mm format']
    },
    endTime: {
      type: String, // e.g. "18:00" (HH:mm)
      required: [true, 'End time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:mm format']
    },
    breakMinutes: {
      type: Number,
      default: 60,
      min: 0
    },
    workHours: {
      type: Number,
      default: 8,
      min: 0,
      max: 24
    }
  },
  { _id: false }
);

const workingScheduleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Working schedule name is required'],
      unique: true,
      trim: true
    },
    lines: {
      type: [scheduleLineSchema],
      default: () => [
        { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', breakMinutes: 60, workHours: 8 },
        { dayOfWeek: 2, startTime: '09:00', endTime: '18:00', breakMinutes: 60, workHours: 8 },
        { dayOfWeek: 3, startTime: '09:00', endTime: '18:00', breakMinutes: 60, workHours: 8 },
        { dayOfWeek: 4, startTime: '09:00', endTime: '18:00', breakMinutes: 60, workHours: 8 },
        { dayOfWeek: 5, startTime: '09:00', endTime: '18:00', breakMinutes: 60, workHours: 8 }
      ]
    },
    weeklyHours: {
      type: Number,
      required: [true, 'Weekly hours is required'],
      default: 40,
      min: [1, 'Weekly hours must be at least 1']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

const WorkingSchedule = mongoose.model('WorkingSchedule', workingScheduleSchema);

module.exports = WorkingSchedule;
