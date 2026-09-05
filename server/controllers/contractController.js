const Contract = require('../models/Contract')
const { success, created, notFound } = require('../utils/response')

const getAll = async (req, res) => {
  const contracts = await Contract.find().populate('employee', 'firstName lastName employeeId').populate('salaryStructure', 'name')
  success(res, contracts)
}

const getById = async (req, res) => {
  const c = await Contract.findById(req.params.id).populate('employee').populate('salaryStructure').populate('schedule')
  if (!c) return notFound(res, 'Contract not found')
  success(res, c)
}

const create = async (req, res) => {
  const c = await Contract.create(req.body)
  created(res, c)
}

const update = async (req, res) => {
  const c = await Contract.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!c) return notFound(res, 'Contract not found')
  success(res, c)
}

const remove = async (req, res) => {
  const c = await Contract.findByIdAndDelete(req.params.id)
  if (!c) return notFound(res, 'Contract not found')
  success(res, null, 'Contract deleted')
}

module.exports = { getAll, getById, create, update, remove }
