const Employee = require('../models/Employee')
const AppError = require('../utils/AppError')
const { ensureLeaveAllocations } = require('./employeeLinkService')

const generateEmployeeId = async () => {
  const year = new Date().getFullYear().toString().slice(-2)
  const count = await Employee.countDocuments()
  let candidate
  let attempts = 0
  do {
    const seq = String(count + 1 + attempts).padStart(4, '0')
    candidate = `EMP${year}${seq}`
    attempts += 1
  } while (await Employee.exists({ employeeId: candidate }))
  return candidate
}

const createEmployee = async (payload) => {
  if (payload.employeeId) {
    const exists = await Employee.exists({ employeeId: payload.employeeId })
    if (exists) throw new AppError('Employee ID already exists', 409)
  } else {
    payload.employeeId = await generateEmployeeId()
  }

  if (payload.email) {
    const emailExists = await Employee.exists({ email: payload.email.toLowerCase() })
    if (emailExists) throw new AppError('Employee email already exists', 409)
  }

  const emp = await Employee.create(payload)
  await ensureLeaveAllocations(emp._id)
  return emp
}

const listEmployees = async (query = {}) => {
  const {
    page = 1,
    limit = 20,
    search,
    department,
    status,
    sort = '-createdAt',
  } = query

  const filter = {}
  if (status) filter.status = status
  if (department) filter.department = department
  if (search) {
    filter.$or = [
      { firstName: new RegExp(search, 'i') },
      { lastName: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
      { employeeId: new RegExp(search, 'i') },
      { jobTitle: new RegExp(search, 'i') },
    ]
  }

  const pageNum = Math.max(1, Number(page) || 1)
  const limitNum = Math.min(200, Math.max(1, Number(limit) || 20))
  const skip = (pageNum - 1) * limitNum

  const [data, total] = await Promise.all([
    Employee.find(filter)
      .populate('department', 'name code')
      .populate('schedule', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limitNum),
    Employee.countDocuments(filter),
  ])

  return {
    data,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1,
  }
}

module.exports = {
  generateEmployeeId,
  createEmployee,
  listEmployees,
}
