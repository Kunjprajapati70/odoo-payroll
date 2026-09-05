const asyncHandler = require('../utils/asyncHandler')
const Contract = require('../models/Contract')
const { success, created, notFound, badRequest } = require('../utils/response')

const normalizeContractBody = (body) => {
  const data = { ...body }
  if (data.salary != null && data.wage == null) data.wage = data.salary
  if (data.wage != null && data.salary == null) data.salary = data.wage
  if (data.type && !data.contractType) data.contractType = data.type
  if (data.contractType && !data.type) data.type = data.contractType
  return data
}

const getAll = asyncHandler(async (req, res) => {
  const { employee, status } = req.query
  const filter = {}
  if (employee) filter.employee = employee
  if (status) filter.status = status

  const contracts = await Contract.find(filter)
    .populate('employee', 'firstName lastName employeeId')
    .populate('salaryStructure', 'name code')
    .sort({ createdAt: -1 })
  success(res, contracts)
})

const getById = asyncHandler(async (req, res) => {
  const c = await Contract.findById(req.params.id)
    .populate('employee')
    .populate('salaryStructure')
    .populate('schedule')
  if (!c) return notFound(res, 'Contract not found')
  success(res, c)
})

const create = asyncHandler(async (req, res) => {
  const data = normalizeContractBody(req.body)
  if (!data.employee || data.wage == null || !data.contractType || !data.startDate) {
    return badRequest(res, 'employee, wage/salary, contractType and startDate are required')
  }
  if (!data.salaryStructure) {
    const SalaryStructure = require('../models/SalaryStructure')
    const fallback = await SalaryStructure.findOne({ code: 'STD', isActive: true })
      || await SalaryStructure.findOne({ isActive: true })
    if (!fallback) {
      return badRequest(res, 'salaryStructure is required (no default structure found — run seed)')
    }
    data.salaryStructure = fallback._id
  }
  const c = await Contract.create(data)
  created(res, c)
})

const update = asyncHandler(async (req, res) => {
  const data = normalizeContractBody(req.body)
  const c = await Contract.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true })
  if (!c) return notFound(res, 'Contract not found')
  success(res, c)
})

const remove = asyncHandler(async (req, res) => {
  const c = await Contract.findByIdAndDelete(req.params.id)
  if (!c) return notFound(res, 'Contract not found')
  success(res, null, 'Contract deleted')
})

module.exports = { getAll, getById, create, update, remove }
