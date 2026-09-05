const mongoose = require('mongoose');

const leaveAllocationSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required']
    },
    timeOffTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TimeOffType',
      required: [true, 'Time off type reference is required']
    },
    allocated: {
      type: Number,
      required: [true, 'Allocated units is required'],
      min: [0, 'Allocated cannot be negative']
    },
    used: {
      type: Number,
      default: 0,
      min: [0, 'Used cannot be negative']
    },
    remaining: {
      type: Number,
      default: function () {
        return (this.allocated || 0) - (this.used || 0);
      }
    },
    validFrom: {
      type: Date,
      required: [true, 'Valid from date is required']
    },
    validTo: {
      type: Date,
      required: [true, 'Valid to date is required']
    },
    status: {
      type: String,
      enum: ['DRAFT', 'APPROVED', 'CANCELLED', 'EXPIRED'],
      default: 'APPROVED'
    }
  },
  {
    timestamps: true
  }
);

// Pre-save hook to calculate remaining
leaveAllocationSchema.pre('save', function () {
  this.remaining = Math.max(0, (this.allocated || 0) - (this.used || 0));
});

// Compound index
leaveAllocationSchema.index({ employeeId: 1, timeOffTypeId: 1, validFrom: 1, validTo: 1 });
leaveAllocationSchema.index({ employeeId: 1, status: 1 });

const LeaveAllocation = mongoose.model('LeaveAllocation', leaveAllocationSchema);

module.exports = LeaveAllocation;
