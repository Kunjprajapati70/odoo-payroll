const Employee = require('../models/Employee')
const { success, created, notFound } = require('../utils/response')

const getAll = async (req, res) => {
  const { page = 1, limit = 20, search, department, status } = req.query
  const filter = {}
  if (status) filter.status = status
  if (department) filter.department = department
  if (search) filter.$or = [
    { firstName: new RegExp(search, 'i') },
    { lastName: new RegExp(search, 'i') },
    { email: new RegExp(search, 'i') },
    { employeeId: new RegExp(search, 'i') },
  ]
  const skip = (page - 1) * limit
  const [data, total] = await Promise.all([
    Employee.find(filter).populate('department', 'name').skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
    Employee.countDocuments(filter),
  ])
  success(res, { data, total, page: Number(page), totalPages: Math.ceil(total / limit) })
}

const getById = async (req, res) => {
  const emp = await Employee.findById(req.params.id).populate('department')
  if (!emp) return notFound(res, 'Employee not found')
  success(res, emp)
}

const create = async (req, res) => {
  const emp = await Employee.create(req.body)
  created(res, emp)
}

const update = async (req, res) => {
  const emp = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
  if (!emp) return notFound(res, 'Employee not found')
  success(res, emp)
}

const remove = async (req, res) => {
  const emp = await Employee.findByIdAndDelete(req.params.id)
  if (!emp) return notFound(res, 'Employee not found')
  success(res, null, 'Employee deleted')
}

module.exports = { getAll, getById, create, update, remove }
