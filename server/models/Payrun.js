const mongoose = require('mongoose')

const payrunSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  periodStart: { type: Date, required: true },
  periodEnd:   { type: Date, required: true },
  employees:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
  status:      { type: String, enum: ['draft','processing','done','approved','cancelled'], default: 'draft' },
  totalGross:  { type: Number, default: 0 },
  totalNet:    { type: Number, default: 0 },
  totalDeductions: { type: Number, default: 0 },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt:  { type: Date },
  notes:       { type: String },
}, { timestamps: true })

module.exports = mongoose.model('Payrun', payrunSchema)
