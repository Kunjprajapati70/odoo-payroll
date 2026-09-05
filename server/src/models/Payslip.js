const mongoose = require('mongoose');

const payslipLineSchema = new mongoose.Schema(
  {
    ruleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalaryRule',
      default: null
    },
    code: {
      type: String,
      required: true,
      uppercase: true
    },
    name: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['BASIC', 'ALLOWANCE', 'GROSS', 'DEDUCTION', 'NET'],
      required: true
    },
    sequence: {
      type: Number,
      default: 10
    },
    calculationType: {
      type: String,
      default: 'FIXED'
    },
    rate: {
      type: Number,
      default: 0
    },
    amount: {
      type: Number,
      required: true,
      default: 0
    }
  },
  { _id: false }
);

const payslipTotalsSchema = new mongoose.Schema(
  {
    basic: { type: Number, default: 0 },
    gross: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    net: { type: Number, default: 0 }
  },
  { _id: false }
);

const payslipSchema = new mongoose.Schema(
  {
    payslipNumber: {
      type: String,
      trim: true
    },
    payrunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payrun',
      required: [true, 'Payrun reference is required']
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required']
    },
    contractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contract',
      required: [true, 'Contract reference is required']
    },
    salaryStructureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalaryStructure',
      required: [true, 'Salary structure reference is required']
    },
    periodStart: {
      type: Date,
      required: [true, 'Period start date is required']
    },
    periodEnd: {
      type: Date,
      required: [true, 'Period end date is required']
    },
    workedDays: {
      type: Number,
      default: 0
    },
    workedHours: {
      type: Number,
      default: 0
    },
    lines: [payslipLineSchema],
    totals: {
      type: payslipTotalsSchema,
      default: () => ({})
    },
    status: {
      type: String,
      enum: ['DRAFT', 'COMPUTED', 'VALIDATED', 'PAID', 'CANCELLED'],
      default: 'DRAFT'
    },
    pdfPath: {
      type: String,
      default: null
    },
    emailedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// One payslip per employee per payrun
payslipSchema.index({ payrunId: 1, employeeId: 1 }, { unique: true });

// Useful index requested: payslip employeeId + periodStart + periodEnd
payslipSchema.index({ employeeId: 1, periodStart: 1, periodEnd: 1 });
payslipSchema.index({ status: 1 });

const Payslip = mongoose.model('Payslip', payslipSchema);

module.exports = Payslip;
