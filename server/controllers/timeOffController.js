const TimeOffType = require('../models/TimeOffType')
const TimeOffAllocation = require('../models/TimeOffAllocation')
const TimeOffRequest = require('../models/TimeOffRequest')
const { success, created, notFound } = require('../utils/response')

// Types
const getTypes = async (req, res) => success(res, await TimeOffType.find({ isActive: true }))
const createType = async (req, res) => created(res, await TimeOffType.create(req.body))
const updateType = async (req, res) => {
  const t = await TimeOffType.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!t) return notFound(res, 'Type not found')
  success(res, t)
}
const deleteType = async (req, res) => {
  await TimeOffType.findByIdAndDelete(req.params.id)
  success(res, null, 'Deleted')
}

// Allocations
const getAllocations = async (req, res) => {
  const { employee, year } = req.query
  const filter = {}
  if (employee) filter.employee = employee
  if (year) filter.year = year
  success(res, await TimeOffAllocation.find(filter).populate('employee', 'firstName lastName').populate('timeOffType', 'name code'))
}
const createAllocation = async (req, res) => created(res, await TimeOffAllocation.create(req.body))
const updateAllocation = async (req, res) => {
  const a = await TimeOffAllocation.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!a) return notFound(res, 'Allocation not found')
  success(res, a)
}

// Requests
const getRequests = async (req, res) => {
  const { employee, status } = req.query
  const filter = {}
  if (employee) filter.employee = employee
  if (status) filter.status = status
  success(res, await TimeOffRequest.find(filter).populate('employee', 'firstName lastName').populate('timeOffType', 'name'))
}
const createRequest = async (req, res) => created(res, await TimeOffRequest.create(req.body))
const approveRequest = async (req, res) => {
  const r = await TimeOffRequest.findByIdAndUpdate(req.params.id, { status: 'approved', approvedBy: req.user._id, approvedAt: new Date() }, { new: true })
  if (!r) return notFound(res, 'Request not found')
  success(res, r)
}
const rejectRequest = async (req, res) => {
  const r = await TimeOffRequest.findByIdAndUpdate(req.params.id, { status: 'rejected', rejectionReason: req.body.reason }, { new: true })
  if (!r) return notFound(res, 'Request not found')
  success(res, r)
}

module.exports = { getTypes, createType, updateType, deleteType, getAllocations, createAllocation, updateAllocation, getRequests, createRequest, approveRequest, rejectRequest }
