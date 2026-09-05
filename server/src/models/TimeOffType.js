const mongoose = require('mongoose');

const timeOffTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Time off type name is required'],
      unique: true,
      trim: true
    },
    code: {
      type: String,
      trim: true,
      uppercase: true
    },
    unit: {
      type: String,
      enum: ['DAYS', 'HOURS'],
      default: 'DAYS'
    },
    requiresAllocation: {
      type: Boolean,
      default: true
    },
    approvalRequired: {
      type: Boolean,
      default: true
    },
    payrollIntegration: {
      type: String,
      enum: ['PAID', 'UNPAID', 'HALF_PAID'],
      default: 'PAID'
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

const TimeOffType = mongoose.model('TimeOffType', timeOffTypeSchema);

module.exports = TimeOffType;
