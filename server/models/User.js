const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const { ALL_ROLES, ROLES } = require('../utils/roles')

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  phone:    { type: String, trim: true },
  role:     { type: String, enum: ALL_ROLES, default: ROLES.EMPLOYEE },
  isActive: { type: Boolean, default: true },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resetPasswordToken:   { type: String, select: false },
  resetPasswordExpires: { type: Date, select: false },
}, { timestamps: true })

userSchema.index({ role: 1 })
userSchema.index({ createdAt: -1 })

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

userSchema.methods.comparePassword = async function (plain) {
  if (!this.password) {
    const full = await this.constructor.findById(this._id).select('+password')
    return bcrypt.compare(plain, full.password)
  }
  return bcrypt.compare(plain, this.password)
}

userSchema.methods.createPasswordResetToken = function () {
  const raw = crypto.randomBytes(32).toString('hex')
  this.resetPasswordToken = crypto.createHash('sha256').update(raw).digest('hex')
  this.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
  return raw
}

userSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  delete obj.resetPasswordToken
  delete obj.resetPasswordExpires
  return obj
}

module.exports = mongoose.model('User', userSchema)
