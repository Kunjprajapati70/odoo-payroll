const mongoose = require('mongoose')

const payslipSchema = new mongoose.Schema({
  payrun:      { type: mongoose.Schema.Types.ObjectId, ref: 'Payrun', required: true },
  employee:    { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  contract:    { type: mongoose.Schema.Types.ObjectId, ref: 'Contract' },
  periodStart: { type: Date, required: true },
  periodEnd:   { type: Date, required: true },
  basicSalary: { type: Number, default: 0 },
  grossSalary: { type: Number, default: 0 },
  totalDeductions: { type: Number, default: 0 },
  netSalary:   { type: Number, default: 0 },
  status:      { type: String, enum: ['draft','done'], default: 'draft' },
  lines:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'PayslipLine' }],
}, { timestamps: true })

module.exports = mongoose.model('Payslip', payslipSchema)
