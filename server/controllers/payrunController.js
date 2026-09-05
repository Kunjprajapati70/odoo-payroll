const Payrun = require('../models/Payrun')
const { success, created, notFound } = require('../utils/response')

const getAll = async (req, res) => success(res, await Payrun.find().sort({ createdAt: -1 }).populate('createdBy', 'name'))

const getById = async (req, res) => {
  const p = await Payrun.findById(req.params.id).populate('employees', 'firstName lastName employeeId')
  if (!p) return notFound(res, 'Payrun not found')
  success(res, p)
}

const create = async (req, res) => {
  const p = await Payrun.create({ ...req.body, createdBy: req.user._id })
  created(res, p)
}

const compute = async (req, res) => {
  // TODO: implement salary rule engine computation
  const p = await Payrun.findByIdAndUpdate(req.params.id, { status: 'processing' }, { new: true })
  if (!p) return notFound(res, 'Payrun not found')
  success(res, p, 'Payrun computation started')
}

const approve = async (req, res) => {
  const p = await Payrun.findByIdAndUpdate(req.params.id, { status: 'approved', approvedBy: req.user._id, approvedAt: new Date() }, { new: true })
  if (!p) return notFound(res, 'Payrun not found')
  success(res, p)
}

const cancel = async (req, res) => {
  const p = await Payrun.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { new: true })
  if (!p) return notFound(res, 'Payrun not found')
  success(res, p)
}

module.exports = { getAll, getById, create, compute, approve, cancel }
