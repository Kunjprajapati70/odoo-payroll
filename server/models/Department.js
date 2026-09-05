const mongoose = require('mongoose')

const departmentSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  code:        { type: String, trim: true },
  manager:     { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  description: { type: String },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true })

module.exports = mongoose.model('Department', departmentSchema)
