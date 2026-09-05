const asyncHandler = require('../utils/asyncHandler')
const payrunService = require('../services/payrunService')
const Payrun = require('../models/Payrun')
const { success, created, notFound, badRequest } = require('../utils/response')
const AppError = require('../utils/AppError')

const getAll = asyncHandler(async (req, res) => {
  const payruns = await Payrun.find()
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name')
    .populate('salaryStructure', 'name code')
  success(res, payruns)
})

const getById = asyncHandler(async (req, res) => {
  const p = await Payrun.findById(req.params.id)
    .populate('employees', 'firstName lastName employeeId')
    .populate('salaryStructure', 'name code')
    .populate('createdBy', 'name')
  if (!p) return notFound(res, 'Payrun not found')
  success(res, p)
})

const create = asyncHandler(async (req, res) => {
  const { name, periodStart, periodEnd, employees, salaryStructure, notes } = req.body
  if (!name || !periodStart || !periodEnd) {
    return badRequest(res, 'name, periodStart and periodEnd are required')
  }
  if (new Date(periodEnd) < new Date(periodStart)) {
    return badRequest(res, 'periodEnd must be on or after periodStart')
  }

  const p = await Payrun.create({
    name,
    periodStart,
    periodEnd,
    employees: employees || [],
    salaryStructure,
    notes,
    status: 'draft',
    createdBy: req.user._id,
    employeeCount: employees?.length || 0,
  })
  created(res, p)
})

const compute = asyncHandler(async (req, res) => {
  try {
    const result = await payrunService.computePayrun(req.params.id, req.user._id)
    success(res, result, 'Payrun computed successfully')
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode || 400).json({ success: false, message: err.message })
    }
    throw err
  }
})

const approve = asyncHandler(async (req, res) => {
  // Spec: validate step (COMPUTED → VALIDATED). Kept as /approve for client compatibility.
  try {
    const p = await payrunService.validatePayrun(req.params.id, req.user._id)
    success(res, p, 'Payrun validated')
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode || 400).json({ success: false, message: err.message })
    }
    throw err
  }
})

const validate = approve

const markPaid = asyncHandler(async (req, res) => {
  try {
    const p = await payrunService.markPaid(req.params.id)
    success(res, p, 'Payrun marked as paid')
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode || 400).json({ success: false, message: err.message })
    }
    throw err
  }
})

const sendPayslips = asyncHandler(async (req, res) => {
  try {
    const result = await payrunService.sendPayslips(req.params.id)
    success(res, result, 'Payslip send completed')
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode || 400).json({ success: false, message: err.message })
    }
    throw err
  }
})

const cancel = asyncHandler(async (req, res) => {
  try {
    const p = await payrunService.cancelPayrun(req.params.id)
    success(res, p, 'Payrun cancelled')
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode || 400).json({ success: false, message: err.message })
    }
    throw err
  }
})

module.exports = {
  getAll,
  getById,
  create,
  compute,
  approve,
  validate,
  markPaid,
  sendPayslips,
  cancel,
}
