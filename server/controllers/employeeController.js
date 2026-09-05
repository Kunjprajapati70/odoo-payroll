const asyncHandler = require('../utils/asyncHandler')
const employeeService = require('../services/employeeService')
const Employee = require('../models/Employee')
const { success, created, notFound, badRequest } = require('../utils/response')
const AppError = require('../utils/AppError')

const getAll = asyncHandler(async (req, res) => {
  const result = await employeeService.listEmployees(req.query)
  success(res, result)
})

const getById = asyncHandler(async (req, res) => {
  const emp = await Employee.findById(req.params.id)
    .populate('department')
    .populate('schedule')
  if (!emp) return notFound(res, 'Employee not found')

  const Contract = require('../models/Contract')
  const contract = await Contract.findOne({
    employee: emp._id,
    status: 'active',
  })
    .populate('salaryStructure', 'name code currency')
    .populate('schedule', 'name hoursPerWeek')
    .sort({ startDate: -1 })

  const payload = emp.toObject({ virtuals: true })
  payload.contract = contract
  success(res, payload)
})

const create = asyncHandler(async (req, res) => {
  try {
    const emp = await employeeService.createEmployee(req.body)
    created(res, emp)
  } catch (err) {
    if (err instanceof AppError) return badRequest(res, err.message)
    throw err
  }
})

const update = asyncHandler(async (req, res) => {
  if (req.body.employeeId) {
    const dup = await Employee.findOne({
      employeeId: req.body.employeeId,
      _id: { $ne: req.params.id },
    })
    if (dup) return badRequest(res, 'Employee ID already exists')
  }
  const emp = await Employee.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
  if (!emp) return notFound(res, 'Employee not found')
  success(res, emp)
})

const remove = asyncHandler(async (req, res) => {
  const emp = await Employee.findByIdAndDelete(req.params.id)
  if (!emp) return notFound(res, 'Employee not found')
  success(res, null, 'Employee deleted')
})

module.exports = { getAll, getById, create, update, remove }
