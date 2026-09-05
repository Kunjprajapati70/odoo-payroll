const asyncHandler = require('../utils/asyncHandler')
const SalaryRule = require('../models/SalaryRule')
const { success, created, notFound, badRequest } = require('../utils/response')

const normalizeRuleBody = (body = {}) => {
  const data = { ...body }
  if (data.calculationType && !data.computationType) {
    data.computationType = data.calculationType
  }
  if (data.computationType === 'percentage') {
    data.computationType = 'percentage_of_basic'
  }
  return data
}

const serializeRule = (rule) => {
  if (!rule) return rule
  const obj = rule.toObject ? rule.toObject() : { ...rule }
  obj.calculationType = obj.computationType
  return obj
}

const getAll = asyncHandler(async (req, res) => {
  const filter = {}
  if (req.query.isActive === 'false') filter.isActive = false
  else if (req.query.isActive === 'all') { /* no filter */ }
  else filter.isActive = true
  if (req.query.category) filter.category = req.query.category

  const rules = await SalaryRule.find(filter).sort('sequence')
  success(res, rules.map(serializeRule))
})

const getById = asyncHandler(async (req, res) => {
  const r = await SalaryRule.findById(req.params.id)
  if (!r) return notFound(res, 'Rule not found')
  success(res, serializeRule(r))
})

const create = asyncHandler(async (req, res) => {
  const data = normalizeRuleBody(req.body)
  if (!data.name || !data.code || !data.category || !data.computationType) {
    return badRequest(res, 'name, code, category and computationType/calculationType are required')
  }

  // Sequential display IDs: 1, 2, 3...
  if (data.sequence == null || data.sequence === '') {
    const last = await SalaryRule.findOne().sort({ sequence: -1 }).select('sequence')
    data.sequence = (last?.sequence || 0) + 1
  } else {
    data.sequence = Number(data.sequence)
  }

  // Basic / fixed amounts must be positive (or zero for wage-driven BASIC)
  if (data.category === 'basic' && data.computationType === 'fixed') {
    if (data.amount != null && Number(data.amount) < 0) {
      return badRequest(res, 'Basic salary must be a positive number (or 0 to use contract wage)')
    }
  }
  if (data.amount != null && Number(data.amount) < 0) {
    return badRequest(res, 'Amount cannot be negative')
  }

  try {
    created(res, serializeRule(await SalaryRule.create(data)))
  } catch (err) {
    if (err.code === 11000) return badRequest(res, 'Rule code already exists')
    throw err
  }
})

const update = asyncHandler(async (req, res) => {
  const data = normalizeRuleBody(req.body)
  const r = await SalaryRule.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true })
  if (!r) return notFound(res, 'Rule not found')
  success(res, serializeRule(r))
})

const remove = asyncHandler(async (req, res) => {
  const r = await SalaryRule.findByIdAndDelete(req.params.id)
  if (!r) return notFound(res, 'Rule not found')
  success(res, null, 'Deleted')
})

module.exports = { getAll, getById, create, update, remove }
