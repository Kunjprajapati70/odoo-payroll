require('dotenv').config()
const mongoose = require('mongoose')
const { MONGO_URI } = require('../config/env')

const User = require('../models/User')
const Department = require('../models/Department')
const WorkingSchedule = require('../models/WorkingSchedule')
const TimeOffType = require('../models/TimeOffType')
const TimeOffAllocation = require('../models/TimeOffAllocation')
const TimeOffRequest = require('../models/TimeOffRequest')
const SalaryRule = require('../models/SalaryRule')
const SalaryStructure = require('../models/SalaryStructure')
const Employee = require('../models/Employee')
const Contract = require('../models/Contract')
const Attendance = require('../models/Attendance')
const Payrun = require('../models/Payrun')
const Payslip = require('../models/Payslip')
const PayslipLine = require('../models/PayslipLine')

const {
  departments,
  users,
  workingSchedules,
  timeOffTypes,
  salaryRules,
  employeeSeeds,
} = require('./demoData')

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI)
    console.log(`Connected to MongoDB: ${MONGO_URI}`)

    await Promise.all([
      User.deleteMany({}),
      Department.deleteMany({}),
      WorkingSchedule.deleteMany({}),
      TimeOffType.deleteMany({}),
      TimeOffAllocation.deleteMany({}),
      TimeOffRequest.deleteMany({}),
      SalaryRule.deleteMany({}),
      SalaryStructure.deleteMany({}),
      Employee.deleteMany({}),
      Contract.deleteMany({}),
      Attendance.deleteMany({}),
      Payrun.deleteMany({}),
      Payslip.deleteMany({}),
      PayslipLine.deleteMany({}),
    ])
    console.log('Cleared existing collections')

    const createdDepts = await Department.insertMany(departments)
    const deptByCode = Object.fromEntries(createdDepts.map((d) => [d.code, d]))

    const createdUsers = await Promise.all(users.map((u) => User.create(u)))
    console.log(`Seeded ${createdUsers.length} staff users`)

    const [schedule] = await WorkingSchedule.insertMany(workingSchedules)
    const createdTypes = await TimeOffType.insertMany(timeOffTypes)

    const createdRules = await SalaryRule.insertMany(salaryRules)
    const structure = await SalaryStructure.create({
      name: 'Standard Structure',
      code: 'STD',
      currency: 'INR',
      scheduleOf: 'monthly',
      rules: createdRules.map((r) => r._id),
      isActive: true,
    })

    const year = new Date().getFullYear()
    const hireDate = new Date(year - 1, 0, 15)
    const now = new Date()

    console.log(`Seeding ${employeeSeeds.length} employees...`)
    const empDocs = employeeSeeds.map((seedEmp, i) => ({
      employeeId: `EMP${String(year).slice(-2)}${String(i + 1).padStart(4, '0')}`,
      firstName: seedEmp.firstName,
      lastName: seedEmp.lastName,
      email: seedEmp.email,
      phone: seedEmp.phone || `9${String(800000000 + i + 1).slice(0, 9)}`,
      department: deptByCode[seedEmp.deptCode]?._id,
      schedule: schedule._id,
      jobTitle: seedEmp.jobTitle,
      employmentType: seedEmp.employmentType,
      hireDate,
      status: 'active',
      gender: i % 2 === 0 ? 'Female' : 'Male',
      maritalStatus: 'Single',
      city: 'Ahmedabad',
      country: 'India',
    }))
    const employees = await Employee.insertMany(empDocs, { ordered: true })

    const contracts = employees.map((emp, i) => ({
      employee: emp._id,
      salaryStructure: structure._id,
      schedule: schedule._id,
      wage: employeeSeeds[i].wage,
      salary: employeeSeeds[i].wage,
      contractType: 'Full-time',
      type: 'Full-time',
      startDate: hireDate,
      status: 'active',
    }))
    await Contract.insertMany(contracts)

    // Leave allocations for ALL types × ALL employees
    const allocations = []
    for (const emp of employees) {
      for (const type of createdTypes) {
        allocations.push({
          employee: emp._id,
          timeOffType: type._id,
          year,
          totalDays: type.defaultDays,
          usedDays: 0,
        })
      }
    }
    await TimeOffAllocation.insertMany(allocations)
    console.log(`Seeded ${allocations.length} leave allocations`)

    // Attendance samples for first 40 employees (realtime-visible history)
    const attendanceDocs = []
    for (let i = 0; i < Math.min(40, employees.length); i += 1) {
      for (let d = 1; d <= 12; d += 1) {
        const date = new Date(now.getFullYear(), now.getMonth(), d)
        if (date.getDay() === 0 || date.getDay() === 6) continue
        if (date > now) continue
        attendanceDocs.push({
          employee: employees[i]._id,
          date,
          status: d === 3 && i === 0 ? 'late' : 'present',
          hoursWorked: d === 3 && i === 0 ? 7 : 8,
          checkIn: new Date(date.getFullYear(), date.getMonth(), d, 9, 0),
          checkOut: new Date(date.getFullYear(), date.getMonth(), d, 17, 0),
        })
      }
    }
    if (attendanceDocs.length) await Attendance.insertMany(attendanceDocs)
    console.log(`Seeded ${attendanceDocs.length} attendance records`)

    // Alice employee login linked to first employee
    const empUser = await User.create({
      name: 'Alice Nguyen',
      email: 'alice.nguyen@peoplepay360.com',
      password: 'Employee@123',
      role: 'employee',
      employee: employees[0]._id,
      phone: '9876543210',
    })
    employees[0].user = empUser._id
    await employees[0].save()

    // Extra demo employee users (linked) so attendance works out of the box
    for (let i = 1; i <= 5; i += 1) {
      const e = employees[i]
      const u = await User.create({
        name: `${e.firstName} ${e.lastName}`,
        email: e.email,
        password: 'Employee@123',
        role: 'employee',
        employee: e._id,
        phone: e.phone,
      })
      e.user = u._id
      await e.save()
    }

    const annualLeave = createdTypes.find((t) => t.code === 'AL')
    await TimeOffRequest.create({
      employee: employees[0]._id,
      timeOffType: annualLeave._id,
      startDate: new Date(year, now.getMonth(), 20),
      endDate: new Date(year, now.getMonth(), 22),
      dayType: 'full_day',
      days: 3,
      reason: 'Family trip',
      status: 'pending',
    })

    // Payrun for first 25 employees (keeps seed fast but charts populated)
    const payrollManager = createdUsers.find((u) => u.role === 'payroll_manager')
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const payEmployees = employees.slice(0, 25).map((e) => e._id)

    const draftPayrun = await Payrun.create({
      name: `${now.toLocaleString('en', { month: 'long' })} ${now.getFullYear()} Payroll`,
      periodStart,
      periodEnd,
      salaryStructure: structure._id,
      employees: payEmployees,
      status: 'draft',
      createdBy: payrollManager?._id,
    })

    const { computePayrun, validatePayrun, markPaid } = require('../services/payrunService')
    const { payrun: computedPayrun } = await computePayrun(draftPayrun._id, payrollManager?._id)
    await validatePayrun(computedPayrun._id, payrollManager?._id)
    await markPaid(computedPayrun._id)
    console.log(`Seeded paid payrun with ${computedPayrun.employeeCount} payslips (net ${computedPayrun.totalNet})`)

    await Payrun.create({
      name: `Draft ${now.toLocaleString('en', { month: 'long' })} Demo`,
      periodStart,
      periodEnd,
      salaryStructure: structure._id,
      employees: payEmployees,
      status: 'draft',
      createdBy: payrollManager?._id,
      employeeCount: payEmployees.length,
    })

    console.log(`Seeded ${employees.length} employees with contracts & leave`)
    console.log(`Seeded salary structure: ${structure.name} (${createdRules.length} rules, sequences 1–${createdRules.length})`)
    console.log('\nSeed complete. Demo logins:')
    ;[
      ...users,
      { role: 'employee', email: 'alice.nguyen@peoplepay360.com', password: 'Employee@123' },
    ].forEach((u) => console.log(`  ${u.role.padEnd(16)} ${u.email} / ${u.password}`))

    process.exit(0)
  } catch (err) {
    console.error('Seed failed:', err)
    process.exit(1)
  }
}

seed()
