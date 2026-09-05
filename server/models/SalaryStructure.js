const mongoose = require('mongoose')

const salaryStructureSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  code:     { type: String, required: true, unique: true, uppercase: true },
  currency: { type: String, default: 'INR' },
  scheduleOf:{ type: String, enum: ['monthly', 'bi-monthly', 'weekly'], default: 'monthly' },
  rules:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'SalaryRule' }],
  isActive: { type: Boolean, default: true },
  notes:    { type: String },
  description: { type: String },
}, { timestamps: true })

module.exports = mongoose.model('SalaryStructure', salaryStructureSchema)
