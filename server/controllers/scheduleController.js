const WorkingSchedule = require('../models/WorkingSchedule')
const { success, created, notFound } = require('../utils/response')

const getAll = async (req, res) => success(res, await WorkingSchedule.find())
const getById = async (req, res) => {
  const s = await WorkingSchedule.findById(req.params.id)
  if (!s) return notFound(res, 'Schedule not found')
  success(res, s)
}
const create = async (req, res) => created(res, await WorkingSchedule.create(req.body))
const update = async (req, res) => {
  const s = await WorkingSchedule.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!s) return notFound(res, 'Schedule not found')
  success(res, s)
}
const remove = async (req, res) => {
  await WorkingSchedule.findByIdAndDelete(req.params.id)
  success(res, null, 'Schedule deleted')
}

module.exports = { getAll, getById, create, update, remove }
