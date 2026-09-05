const mongoose = require('mongoose')

const contractSchema = new mongoose.Schema({
  employee:        { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  salaryStructure: { type: mongoose.Schema.Types.ObjectId, ref: 'SalaryStructure' },
  schedule:        { type: mongoose.Schema.Types.ObjectId, ref: 'WorkingSchedule' },
  wage:            { type: Number, required: true, min: 0 },
  contractType:    { type: String, enum: ['Full-time', 'Part-time', 'Contract', 'Intern'], required: true },
  startDate:       { type: Date, required: true },
  endDate:         { type: Date },
  status:          { type: String, enum: ['active', 'expired', 'terminated'], default: 'active' },
  notes:           { type: String },
}, { timestamps: true })

module.exports = mongoose.model('Contract', contractSchema)
