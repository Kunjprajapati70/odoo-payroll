require('dotenv').config()
const mongoose = require('mongoose')
const { MONGO_URI } = require('../config/env')

const User = require('../models/User')
const Department = require('../models/Department')
const WorkingSchedule = require('../models/WorkingSchedule')
const TimeOffType = require('../models/TimeOffType')
const SalaryRule = require('../models/SalaryRule')
const SalaryStructure = require('../models/SalaryStructure')

const { departments, users, workingSchedules, timeOffTypes, salaryRules } = require('./demoData')

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI)
    console.log('Connected to MongoDB')

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Department.deleteMany({}),
      WorkingSchedule.deleteMany({}),
      TimeOffType.deleteMany({}),
      SalaryRule.deleteMany({}),
      SalaryStructure.deleteMany({}),
    ])
    console.log('Cleared existing data')

    // Seed departments
    const createdDepts = await Department.insertMany(departments)
    console.log(`Seeded ${createdDepts.length} departments`)

    // Seed users
    const createdUsers = await Promise.all(users.map(u => User.create(u)))
    console.log(`Seeded ${createdUsers.length} users`)

    // Seed schedules
    await WorkingSchedule.insertMany(workingSchedules)
    console.log('Seeded working schedules')

    // Seed time off types
    await TimeOffType.insertMany(timeOffTypes)
    console.log('Seeded time off types')

    // Seed salary rules
    const createdRules = await SalaryRule.insertMany(salaryRules)
    console.log(`Seeded ${createdRules.length} salary rules`)

    // Seed a default salary structure
    await SalaryStructure.create({
      name: 'Standard Structure',
      code: 'STD',
      currency: 'USD',
      rules: createdRules.map(r => r._id),
    })
    console.log('Seeded default salary structure')

    console.log('\nSeed complete.')
    console.log('Login credentials:')
    users.forEach(u => console.log(`  ${u.role}: ${u.email} / ${u.password}`))

    process.exit(0)
  } catch (err) {
    console.error('Seed failed:', err.message)
    process.exit(1)
  }
}

seed()
