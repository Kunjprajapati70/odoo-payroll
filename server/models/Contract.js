const mongoose = require('mongoose')

const contractSchema = new mongoose.Schema({
  employee:        { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  salaryStructure: { type: mongoose.Schema.Types.ObjectId, ref: 'SalaryStructure', required: true },
  schedule:        { type: mongoose.Schema.Types.ObjectId, ref: 'WorkingSchedule' },
  wage:            { type: Number, required: true, min: 0 },
  salary:          { type: Number, min: 0 }, // alias accepted from clients; synced with wage
  contractType:    { type: String, enum: ['Full-time', 'Part-time', 'Contract', 'Intern', 'Permanent', 'Fixed-term', 'Probation', 'Internship', 'Freelance'], required: true },
  type:            { type: String }, // client alias for contractType
  startDate:       { type: Date, required: true },
  endDate:         { type: Date },
  status:          { type: String, enum: ['active', 'expired', 'terminated'], default: 'active' },
  notes:           { type: String },
  expiryNotifiedAt:{ type: Date },
}, { timestamps: true })

contractSchema.pre('validate', function (next) {
  if (this.salary != null && (this.wage == null || this.isModified('salary'))) {
    this.wage = this.salary
  }
  if (this.wage != null && this.salary == null) {
    this.salary = this.wage
  }
  if (this.type && !this.contractType) {
    this.contractType = this.type
  }
  if (this.contractType && !this.type) {
    this.type = this.contractType
  }
  next()
})

contractSchema.index({ employee: 1, status: 1 })
contractSchema.index({ startDate: 1, endDate: 1 })

module.exports = mongoose.model('Contract', contractSchema)
