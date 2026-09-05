const mongoose = require('mongoose');

const bankDetailsSchema = new mongoose.Schema(
  {
    accountNumber: { type: String, trim: true },
    bankName: { type: String, trim: true },
    ifscCode: { type: String, trim: true, uppercase: true },
    accountHolderName: { type: String, trim: true },
    branchName: { type: String, trim: true }
  },
  { _id: false }
);

const employeeSchema = new mongoose.Schema(
  {
    employeeCode: {
      type: String,
      required: [true, 'Employee code is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    phone: {
      type: String,
      trim: true
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true
    },
    jobPosition: {
      type: String,
      required: [true, 'Job position is required'],
      trim: true
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null
    },
    employeeType: {
      type: String,
      enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'PROBATION'],
      default: 'FULL_TIME'
    },
    workingScheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkingSchedule',
      default: null
    },
    dateOfJoining: {
      type: Date,
      required: [true, 'Date of joining is required'],
      default: Date.now
    },
    bankDetails: {
      type: bankDetailsSchema,
      default: () => ({})
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'TERMINATED', 'ON_LEAVE'],
      default: 'ACTIVE'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for full name
employeeSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Indexes
employeeSchema.index({ department: 1 });
employeeSchema.index({ status: 1 });
employeeSchema.index({ managerId: 1 });

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;
