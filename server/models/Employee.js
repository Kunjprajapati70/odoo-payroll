const mongoose = require('mongoose')

const employeeSchema = new mongoose.Schema({
  employeeId:     { type: String, unique: true, sparse: true, trim: true },
  firstName:      { type: String, required: true, trim: true },
  lastName:       { type: String, required: true, trim: true },
  email:          { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:          { type: String },
  dateOfBirth:    { type: Date },
  gender:         { type: String, enum: ['Male', 'Female', 'Other', 'Prefer not to say'] },
  maritalStatus:  { type: String, enum: ['Single', 'Married', 'Divorced', 'Widowed'] },
  address:        { type: String },
  city:           { type: String },
  country:        { type: String },
  department:     { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  schedule:       { type: mongoose.Schema.Types.ObjectId, ref: 'WorkingSchedule' },
  jobTitle:       { type: String },
  employmentType: { type: String, enum: ['Full-time', 'Part-time', 'Contract', 'Intern'] },
  hireDate:       { type: Date },
  status:         { type: String, enum: ['active', 'inactive', 'terminated'], default: 'active' },
  bankAccount:    { type: String },
  taxId:          { type: String },
  user:           { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })

employeeSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`
})

employeeSchema.index({ department: 1, status: 1 })
employeeSchema.index({ lastName: 1, firstName: 1 })

module.exports = mongoose.model('Employee', employeeSchema)
