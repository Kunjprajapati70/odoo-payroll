const mongoose = require('mongoose');

const salaryStructureSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Salary structure name is required'],
      trim: true,
      unique: true
    },
    code: {
      type: String,
      required: [true, 'Salary structure code is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    description: {
      type: String,
      trim: true
    },
    ruleIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SalaryRule'
      }
    ],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

const SalaryStructure = mongoose.model('SalaryStructure', salaryStructureSchema);

module.exports = SalaryStructure;
