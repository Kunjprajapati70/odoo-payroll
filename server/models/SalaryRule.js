const mongoose = require('mongoose')

const salaryRuleSchema = new mongoose.Schema({
  name:            { type: String, required: true, trim: true },
  code:            { type: String, required: true, uppercase: true },
  category:        { type: String, enum: ['basic', 'allowance', 'deduction', 'tax', 'net'], required: true },
  computationType: { type: String, enum: ['fixed', 'percentage_of_basic', 'percentage_of_gross', 'formula'], required: true },
  amount:          { type: Number, default: 0 },
  percentage:      { type: Number, default: 0 },
  formula:         { type: String }, // e.g. "BASIC * 0.1"
  sequence:        { type: Number, default: 10 },
  isActive:        { type: Boolean, default: true },
  appears_on_payslip: { type: Boolean, default: true },
}, { timestamps: true })

module.exports = mongoose.model('SalaryRule', salaryRuleSchema)
