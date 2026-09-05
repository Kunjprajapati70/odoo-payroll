const SalaryRule = require('../models/SalaryRule')
const { success, created, notFound } = require('../utils/response')

const getAll = async (req, res) => success(res, await SalaryRule.find({ isActive: true }).sort('sequence'))
const getById = async (req, res) => {
  const r = await SalaryRule.findById(req.params.id)
  if (!r) return notFound(res, 'Rule not found')
  success(res, r)
}
const create = async (req, res) => created(res, await SalaryRule.create(req.body))
const update = async (req, res) => {
  const r = await SalaryRule.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!r) return notFound(res, 'Rule not found')
  success(res, r)
}
const remove = async (req, res) => {
  await SalaryRule.findByIdAndDelete(req.params.id)
  success(res, null, 'Deleted')
}

module.exports = { getAll, getById, create, update, remove }
