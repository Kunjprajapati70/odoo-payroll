const asyncHandler = require('../utils/asyncHandler')
const timeOffService = require('../services/timeOffService')
const TimeOffType = require('../models/TimeOffType')
const TimeOffAllocation = require('../models/TimeOffAllocation')
const TimeOffRequest = require('../models/TimeOffRequest')
const { success, created, notFound, badRequest } = require('../utils/response')
const AppError = require('../utils/AppError')

const slugCode = (name = '') =>
  name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 12) || `T${Date.now().toString().slice(-6)}`

const normalizeTypeBody = (body = {}) => {
  const data = { ...body }
  if (data.maxDaysPerYear != null && data.defaultDays == null) {
    data.defaultDays = Number(data.maxDaysPerYear)
  }
  if (!data.code && data.name) data.code = slugCode(data.name)
  return data
}

const serializeType = (t) => {
  if (!t) return t
  const obj = t.toObject ? t.toObject() : { ...t }
  obj.maxDaysPerYear = obj.defaultDays
  return obj
}

const normalizeAllocationBody = (body = {}) => {
  const data = { ...body }
  if (data.leaveType && !data.timeOffType) data.timeOffType = data.leaveType
  if (data.allocatedDays != null && data.totalDays == null) {
    data.totalDays = Number(data.allocatedDays)
  }
  return data
}

// Types
const getTypes = asyncHandler(async (req, res) => {
  const types = await TimeOffType.find({ isActive: true })
  success(res, types.map(serializeType))
})

const createType = asyncHandler(async (req, res) => {
  const data = normalizeTypeBody(req.body)
  if (!data.name) return badRequest(res, 'name is required')
  if (!data.code) return badRequest(res, 'code is required')
  created(res, serializeType(await TimeOffType.create(data)))
})

const updateType = asyncHandler(async (req, res) => {
  const data = normalizeTypeBody(req.body)
  const t = await TimeOffType.findByIdAndUpdate(req.params.id, data, {
    new: true,
    runValidators: true,
  })
  if (!t) return notFound(res, 'Type not found')
  success(res, serializeType(t))
})

const deleteType = asyncHandler(async (req, res) => {
  await TimeOffType.findByIdAndDelete(req.params.id)
  success(res, null, 'Deleted')
})

// Allocations
const getAllocations = asyncHandler(async (req, res) => {
  const { employee, year } = req.query
  const filter = {}
  if (employee) filter.employee = employee
  if (year) filter.year = Number(year)
  const list = await TimeOffAllocation.find(filter)
    .populate('employee', 'firstName lastName employeeId')
    .populate('timeOffType', 'name code color')
  success(res, list)
})

const createAllocation = asyncHandler(async (req, res) => {
  const data = normalizeAllocationBody(req.body)
  if (!data.employee || !data.timeOffType || data.year == null || data.totalDays == null) {
    return badRequest(res, 'employee, timeOffType, year and totalDays/allocatedDays are required')
  }
  created(res, await TimeOffAllocation.create(data))
})

const updateAllocation = asyncHandler(async (req, res) => {
  const data = normalizeAllocationBody(req.body)
  const a = await TimeOffAllocation.findByIdAndUpdate(req.params.id, data, {
    new: true,
    runValidators: true,
  })
  if (!a) return notFound(res, 'Allocation not found')
  success(res, a)
})

// Requests
const getRequests = asyncHandler(async (req, res) => {
  const { employee, status } = req.query
  const filter = {}
  if (req.user?.role === 'employee') {
    const { resolveEmployeeIdForUser } = require('../services/employeeLinkService')
    const empId = await resolveEmployeeIdForUser(req.user)
    if (!empId) return badRequest(res, 'Your account is not linked to an employee record')
    filter.employee = empId
  } else if (employee) {
    filter.employee = employee
  }
  if (status) filter.status = status
  success(
    res,
    await TimeOffRequest.find(filter)
      .populate('employee', 'firstName lastName employeeId')
      .populate('timeOffType', 'name code color')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 })
  )
})

const createRequest = asyncHandler(async (req, res) => {
  try {
    const body = { ...req.body }
    if (body.leaveType && !body.timeOffType) body.timeOffType = body.leaveType
    // For employee self-service, employee id is resolved server-side
    if (req.user?.role === 'employee' && !body.employee) {
      body.employee = 'self'
    }
    const r = await timeOffService.createRequest(body, req.user)
    created(res, r)
  } catch (err) {
    if (err instanceof AppError) return badRequest(res, err.message)
    throw err
  }
})

const updateRequest = asyncHandler(async (req, res) => {
  try {
    const body = { ...req.body }
    if (body.leaveType && !body.timeOffType) body.timeOffType = body.leaveType
    const r = await timeOffService.updateRequest(req.params.id, body, req.user)
    success(res, r, 'Request updated')
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode || 400).json({ success: false, message: err.message })
    }
    throw err
  }
})

const approveRequest = asyncHandler(async (req, res) => {
  try {
    const r = await timeOffService.approveRequest(req.params.id, req.user)
    success(res, r, 'Request approved')
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode || 400).json({ success: false, message: err.message })
    }
    throw err
  }
})

const rejectRequest = asyncHandler(async (req, res) => {
  try {
    const r = await timeOffService.rejectRequest(req.params.id, req.body.reason, req.user)
    success(res, r, 'Request rejected')
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode || 400).json({ success: false, message: err.message })
    }
    throw err
  }
})

module.exports = {
  getTypes,
  createType,
  updateType,
  deleteType,
  getAllocations,
  createAllocation,
  updateAllocation,
  getRequests,
  createRequest,
  updateRequest,
  approveRequest,
  rejectRequest,
}
