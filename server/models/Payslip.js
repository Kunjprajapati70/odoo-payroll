const mongoose = require('mongoose')

const payslipSchema = new mongoose.Schema({
  payrun:          { type: mongoose.Schema.Types.ObjectId, ref: 'Payrun', required: true },
  employee:        { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  contract:        { type: mongoose.Schema.Types.ObjectId, ref: 'Contract' },
  salaryStructure: { type: mongoose.Schema.Types.ObjectId, ref: 'SalaryStructure' },
  periodStart:     { type: Date, required: true },
  periodEnd:       { type: Date, required: true },
  basicSalary:     { type: Number, default: 0 },
  totalAllowances: { type: Number, default: 0 },
  grossSalary:     { type: Number, default: 0 },
  totalDeductions: { type: Number, default: 0 },
  netSalary:       { type: Number, default: 0 },
  status:          { type: String, enum: ['draft', 'done', 'paid'], default: 'draft' },
  // Snapshot of calculated lines (also referenced via PayslipLine collection)
  lines:           [{ type: mongoose.Schema.Types.ObjectId, ref: 'PayslipLine' }],
  breakdown:       [{
    name: String,
    code: String,
    category: String,
    amount: Number,
    sequence: Number,
  }],
  emailSentAt:     { type: Date },
}, { timestamps: true })

payslipSchema.index({ payrun: 1, employee: 1 }, { unique: true })
payslipSchema.index({ employee: 1, periodStart: 1 })

module.exports = mongoose.model('Payslip', payslipSchema)
