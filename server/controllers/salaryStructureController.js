const SalaryStructure = require('../models/SalaryStructure')
const { success, created, notFound } = require('../utils/response')

const getAll = async (req, res) => success(res, await SalaryStructure.find().populate('rules'))
const getById = async (req, res) => {
  const s = await SalaryStructure.findById(req.params.id).populate('rules')
  if (!s) return notFound(res, 'Structure not found')
  success(res, s)
}
const create = async (req, res) => created(res, await SalaryStructure.create(req.body))
const update = async (req, res) => {
  const s = await SalaryStructure.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!s) return notFound(res, 'Structure not found')
  success(res, s)
}
const remove = async (req, res) => {
  await SalaryStructure.findByIdAndDelete(req.params.id)
  success(res, null, 'Deleted')
}

module.exports = { getAll, getById, create, update, remove }
