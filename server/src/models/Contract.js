const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required']
    },
    startDate: {
      type: Date,
      required: [true, 'Contract start date is required']
    },
    endDate: {
      type: Date,
      default: null
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
    salary: {
      type: Number,
      required: [true, 'Salary is required'],
      min: [0, 'Salary cannot be negative']
    },
    salaryStructureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalaryStructure',
      required: [true, 'Salary structure reference is required']
    },
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'EXPIRED', 'CANCELLED'],
      default: 'DRAFT'
    }
  },
  {
    timestamps: true
  }
);

// Compound index for historical lookup during payroll period matching
contractSchema.index({ employeeId: 1, startDate: 1, endDate: 1 });
contractSchema.index({ employeeId: 1, status: 1 });
contractSchema.index({ salaryStructureId: 1 });

const Contract = mongoose.model('Contract', contractSchema);

module.exports = Contract;
