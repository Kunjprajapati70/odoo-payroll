const Attendance = require('../models/Attendance')
const { success, created, notFound } = require('../utils/response')

const getAll = async (req, res) => {
  const { employee, from, to, status } = req.query
  const filter = {}
  if (employee) filter.employee = employee
  if (status) filter.status = status
  if (from || to) filter.date = {}
  if (from) filter.date.$gte = new Date(from)
  if (to) filter.date.$lte = new Date(to)
  const records = await Attendance.find(filter).populate('employee', 'firstName lastName employeeId').sort({ date: -1 })
  success(res, records)
}

const getById = async (req, res) => {
  const r = await Attendance.findById(req.params.id).populate('employee')
  if (!r) return notFound(res, 'Record not found')
  success(res, r)
}

const create = async (req, res) => created(res, await Attendance.create(req.body))

const update = async (req, res) => {
  const r = await Attendance.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!r) return notFound(res, 'Record not found')
  success(res, r)
}

const remove = async (req, res) => {
  await Attendance.findByIdAndDelete(req.params.id)
  success(res, null, 'Record deleted')
}

module.exports = { getAll, getById, create, update, remove }
