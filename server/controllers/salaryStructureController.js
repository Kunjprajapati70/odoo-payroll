const asyncHandler = require('../utils/asyncHandler')
const SalaryStructure = require('../models/SalaryStructure')
const { success, created, notFound, badRequest } = require('../utils/response')

const getAll = asyncHandler(async (req, res) => {
  success(res, await SalaryStructure.find().populate('rules').sort({ createdAt: -1 }))
})

const getById = asyncHandler(async (req, res) => {
  const s = await SalaryStructure.findById(req.params.id).populate('rules')
  if (!s) return notFound(res, 'Structure not found')
  success(res, s)
})

const create = asyncHandler(async (req, res) => {
  if (!req.body.name || !req.body.code) {
    return badRequest(res, 'name and code are required')
  }
  created(res, await SalaryStructure.create(req.body))
})

const update = asyncHandler(async (req, res) => {
  const s = await SalaryStructure.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('rules')
  if (!s) return notFound(res, 'Structure not found')
  success(res, s)
})

const remove = asyncHandler(async (req, res) => {
  const s = await SalaryStructure.findByIdAndDelete(req.params.id)
  if (!s) return notFound(res, 'Structure not found')
  success(res, null, 'Deleted')
})

module.exports = { getAll, getById, create, update, remove }
