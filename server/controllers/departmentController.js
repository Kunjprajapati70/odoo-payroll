const Department = require('../models/Department')
const { success, created, notFound } = require('../utils/response')

const getAll = async (req, res) => {
  const departments = await Department.find().populate('manager', 'firstName lastName')
  success(res, departments)
}

const getById = async (req, res) => {
  const dept = await Department.findById(req.params.id).populate('manager')
  if (!dept) return notFound(res, 'Department not found')
  success(res, dept)
}

const create = async (req, res) => {
  const dept = await Department.create(req.body)
  created(res, dept)
}

const update = async (req, res) => {
  const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!dept) return notFound(res, 'Department not found')
  success(res, dept)
}

const remove = async (req, res) => {
  const dept = await Department.findByIdAndDelete(req.params.id)
  if (!dept) return notFound(res, 'Department not found')
  success(res, null, 'Department deleted')
}

module.exports = { getAll, getById, create, update, remove }
