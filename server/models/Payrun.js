const mongoose = require('mongoose')

const PAYRUN_STATUSES = ['draft', 'computed', 'validated', 'paid', 'cancelled']

const payrunSchema = new mongoose.Schema({
  name:            { type: String, required: true, trim: true },
  periodStart:     { type: Date, required: true },
  periodEnd:       { type: Date, required: true },
  salaryStructure: { type: mongoose.Schema.Types.ObjectId, ref: 'SalaryStructure' },
  employees:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
  status:          { type: String, enum: PAYRUN_STATUSES, default: 'draft' },
  totalGross:      { type: Number, default: 0 },
  totalNet:        { type: Number, default: 0 },
  totalAllowances: { type: Number, default: 0 },
  totalDeductions: { type: Number, default: 0 },
  employeeCount:   { type: Number, default: 0 },
  createdBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  validatedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  validatedAt:     { type: Date },
  // keep approvedBy for older clients / seed compatibility
  approvedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt:      { type: Date },
  paidAt:          { type: Date },
  notes:           { type: String },
}, { timestamps: true })

payrunSchema.index({ periodStart: 1, periodEnd: 1 })
payrunSchema.index({ status: 1 })

module.exports = mongoose.model('Payrun', payrunSchema)
module.exports.PAYRUN_STATUSES = PAYRUN_STATUSES
