const mongoose = require('mongoose');

const manualCorrectionSchema = new mongoose.Schema(
  {
    isManuallyCorrected: {
      type: Boolean,
      default: false
    },
    correctedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    correctedAt: {
      type: Date,
      default: null
    },
    correctionReason: {
      type: String,
      trim: true,
      default: ''
    },
    originalCheckIn: {
      type: Date,
      default: null
    },
    originalCheckOut: {
      type: Date,
      default: null
    }
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required']
    },
    date: {
      type: Date,
      required: [true, 'Attendance date is required']
    },
    checkIn: {
      type: Date,
      default: null
    },
    checkOut: {
      type: Date,
      default: null
    },
    workedMinutes: {
      type: Number,
      default: 0,
      min: [0, 'Worked minutes cannot be negative']
    },
    scheduledMinutes: {
      type: Number,
      default: 480, // standard 8 hours
      min: [0, 'Scheduled minutes cannot be negative']
    },
    overtimeMinutes: {
      type: Number,
      default: 0,
      min: [0, 'Overtime minutes cannot be negative']
    },
    status: {
      type: String,
      enum: ['PRESENT', 'HALF_DAY', 'ABSENT', 'ON_LEAVE', 'HOLIDAY', 'WEEKEND'],
      default: 'PRESENT'
    },
    isLate: {
      type: Boolean,
      default: false
    },
    lateMinutes: {
      type: Number,
      default: 0,
      min: 0
    },
    isMissingCheckout: {
      type: Boolean,
      default: false
    },
    correctedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    correctedAt: {
      type: Date,
      default: null
    },
    correctionReason: {
      type: String,
      trim: true,
      default: ''
    },
    manualCorrection: {
      type: manualCorrectionSchema,
      default: () => ({})
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index: one record per employee per date
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ status: 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
