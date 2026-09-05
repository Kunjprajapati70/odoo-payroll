const mongoose = require('mongoose');

const salaryRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Salary rule name is required'],
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Rule code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^[A-Z0-9_]+$/, 'Rule code must contain only uppercase letters, numbers, and underscores']
    },
    category: {
      type: String,
      enum: ['BASIC', 'ALLOWANCE', 'GROSS', 'DEDUCTION', 'NET'],
      required: [true, 'Rule category is required']
    },
    sequence: {
      type: Number,
      required: [true, 'Sequence is required for rule evaluation order'],
      default: 10
    },
    calculationType: {
      type: String,
      enum: ['FIXED', 'PERCENTAGE', 'FORMULA'],
      required: [true, 'Calculation type is required'],
      default: 'FIXED'
    },
    value: {
      type: Number,
      default: 0
    },
    formula: {
      type: String,
      trim: true,
      default: ''
    },
    baseCode: {
      type: String,
      trim: true,
      default: 'contract.salary'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

salaryRuleSchema.index({ sequence: 1 });
salaryRuleSchema.index({ category: 1 });

const SalaryRule = mongoose.model('SalaryRule', salaryRuleSchema);

module.exports = SalaryRule;
