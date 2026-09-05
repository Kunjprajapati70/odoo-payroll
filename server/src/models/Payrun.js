const mongoose = require('mongoose');

const payrunWarningSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    code: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    }
  },
  { _id: false }
);

const payrunTotalsSchema = new mongoose.Schema(
  {
    totalBasic: { type: Number, default: 0 },
    totalGross: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    totalNet: { type: Number, default: 0 },
    employeeCount: { type: Number, default: 0 }
  },
  { _id: false }
);

const payrunSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Payrun name is required'],
      trim: true
    },
    periodStart: {
      type: Date,
      required: [true, 'Period start date is required']
    },
    periodEnd: {
      type: Date,
      required: [true, 'Period end date is required']
    },
    salaryStructureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalaryStructure',
      required: [true, 'Salary structure reference is required']
    },
    employeeIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
      }
    ],
    payslipIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payslip'
      }
    ],
    status: {
      type: String,
      enum: ['DRAFT', 'COMPUTED', 'VALIDATED', 'PAID'],
      default: 'DRAFT'
    },
    warnings: [payrunWarningSchema],
    totals: {
      type: payrunTotalsSchema,
      default: () => ({})
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

payrunSchema.index({ status: 1, periodStart: 1, periodEnd: 1 });
payrunSchema.index({ salaryStructureId: 1 });

const Payrun = mongoose.model('Payrun', payrunSchema);

module.exports = Payrun;
