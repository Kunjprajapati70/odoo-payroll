const Employee = require('../models/Employee')
const TimeOffType = require('../models/TimeOffType')
const TimeOffAllocation = require('../models/TimeOffAllocation')
const WorkingSchedule = require('../models/WorkingSchedule')
const Contract = require('../models/Contract')
const SalaryStructure = require('../models/SalaryStructure')

const ensureLeaveAllocations = async (employeeId, year = new Date().getFullYear()) => {
  const types = await TimeOffType.find({ isActive: { $ne: false } })
  for (const type of types) {
    const existing = await TimeOffAllocation.findOne({
      employee: employeeId,
      timeOffType: type._id,
      year,
    })
    if (!existing) {
      await TimeOffAllocation.create({
        employee: employeeId,
        timeOffType: type._id,
        year,
        totalDays: type.defaultDays || 10,
        usedDays: 0,
      })
    }
  }
}

/**
 * Ensure employee has an active contract covering payroll (creates one if missing).
 */
const ensureContractForEmployee = async (employeeId, basicSalary) => {
  const empId = employeeId?._id || employeeId
  let contract = await Contract.findOne({ employee: empId, status: 'active' }).sort({ startDate: -1 })

  const structure =
    (await SalaryStructure.findOne({ isActive: true, code: 'STD' })) ||
    (await SalaryStructure.findOne({ isActive: true }))

  const schedule = await WorkingSchedule.findOne({ isDefault: true }) || await WorkingSchedule.findOne()
  const wage = basicSalary != null && Number(basicSalary) > 0 ? Number(basicSalary) : null

  if (contract) {
    if (wage != null) {
      contract.wage = wage
      contract.salary = wage
      await contract.save()
    }
    if (!contract.salaryStructure && structure) {
      contract.salaryStructure = structure._id
      await contract.save()
    }
    return contract
  }

  if (!structure) {
    throw new Error('No active salary structure found. Create one before adding users/payruns.')
  }

  // Default wage if admin didn't set one (still allows payrun for seeded/manual staff)
  const finalWage = wage != null ? wage : 30000

  contract = await Contract.create({
    employee: empId,
    salaryStructure: structure._id,
    schedule: schedule?._id,
    wage: finalWage,
    salary: finalWage,
    contractType: 'Full-time',
    type: 'Full-time',
    startDate: new Date(new Date().getFullYear() - 1, 0, 1),
    status: 'active',
    notes: 'Auto-created for payroll eligibility',
  })
  return contract
}

const ensureEmployeeForUser = async (user, { basicSalary } = {}) => {
  if (!user) return null

  let emp = null
  if (user.employee) {
    emp = await Employee.findById(user.employee._id || user.employee)
  }
  if (!emp) {
    emp = await Employee.findOne({ user: user._id })
  }
  if (!emp && user.email) {
    emp = await Employee.findOne({ email: String(user.email).toLowerCase() })
  }

  if (!emp) {
    const parts = String(user.name || 'User').trim().split(/\s+/)
    const firstName = parts[0] || 'User'
    const lastName = parts.slice(1).join(' ') || 'Account'
    const year = new Date().getFullYear()
    const count = await Employee.countDocuments()
    const schedule = await WorkingSchedule.findOne({ isDefault: true }) || await WorkingSchedule.findOne()

    emp = await Employee.create({
      employeeId: `EMP${String(year).slice(-2)}${String(count + 1).padStart(4, '0')}`,
      firstName,
      lastName,
      email: String(user.email).toLowerCase(),
      phone: user.phone || undefined,
      hireDate: new Date(),
      status: 'active',
      employmentType: 'Full-time',
      jobTitle: 'Staff',
      schedule: schedule?._id,
      user: user._id,
    })
  } else if (!emp.user) {
    emp.user = user._id
    await emp.save()
  }

  if (!user.employee || String(user.employee._id || user.employee) !== String(emp._id)) {
    user.employee = emp._id
    await user.save()
  }

  await ensureLeaveAllocations(emp._id)
  await ensureContractForEmployee(emp._id, basicSalary)
  return emp
}

const resolveEmployeeIdForUser = async (user) => {
  if (!user) return null
  if (user.employee) return String(user.employee._id || user.employee)
  const emp = await ensureEmployeeForUser(user)
  return emp ? String(emp._id) : null
}

const getBasicSalaryForEmployee = async (employeeId) => {
  const contract = await Contract.findOne({ employee: employeeId, status: 'active' }).sort({ startDate: -1 })
  return contract ? (contract.wage ?? contract.salary ?? 0) : 0
}

module.exports = {
  ensureLeaveAllocations,
  ensureContractForEmployee,
  ensureEmployeeForUser,
  resolveEmployeeIdForUser,
  getBasicSalaryForEmployee,
}
