const mongoose = require('mongoose')

const employeeSchema = new mongoose.Schema({
  employeeId:    { type: String, unique: true },
  firstName:     { type: String, required: true, trim: true },
  lastName:      { type: String, required: true, trim: true },
  email:         { type: String, required: true, unique: true, lowercase: true },
  phone:         { type: String },
  dateOfBirth:   { type: Date },
  gender:        { type: String, enum: ['Male', 'Female', 'Other', 'Prefer not to say'] },
  maritalStatus: { type: String, enum: ['Single', 'Married', 'Divorced', 'Widowed'] },
  address:       { type: String },
  department:    { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  jobTitle:      { type: String },
  employmentType:{ type: String, enum: ['Full-time', 'Part-time', 'Contract', 'Intern'] },
  hireDate:      { type: Date },
  status:        { type: String, enum: ['active', 'inactive', 'terminated'], default: 'active' },
  bankAccount:   { type: String },
  taxId:         { type: String },
  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

employeeSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`
})

module.exports = mongoose.model('Employee', employeeSchema)
