const mongoose = require('mongoose')

const payslipLineSchema = new mongoose.Schema({
  payslip:    { type: mongoose.Schema.Types.ObjectId, ref: 'Payslip', required: true },
  salaryRule: { type: mongoose.Schema.Types.ObjectId, ref: 'SalaryRule' },
  name:       { type: String, required: true },
  code:       { type: String },
  category:   { type: String },
  amount:     { type: Number, required: true },
  sequence:   { type: Number, default: 10 },
}, { timestamps: true })

module.exports = mongoose.model('PayslipLine', payslipLineSchema)
