const asyncHandler = require('../utils/asyncHandler')
const Department = require('../models/Department')
const Employee = require('../models/Employee')
const { success, created, notFound, badRequest } = require('../utils/response')

const getAll = asyncHandler(async (req, res) => {
  const departments = await Department.find().populate('manager', 'firstName lastName').sort({ name: 1 })

  const counts = await Employee.aggregate([
    { $match: { status: 'active', department: { $ne: null } } },
    { $group: { _id: '$department', count: { $sum: 1 } } },
  ])
  const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]))

  const withCounts = departments.map((d) => {
    const obj = d.toObject ? d.toObject() : { ...d }
    obj.employeeCount = countMap[String(d._id)] || 0
    return obj
  })

  success(res, withCounts)
})

const getById = asyncHandler(async (req, res) => {
  const dept = await Department.findById(req.params.id).populate('manager')
  if (!dept) return notFound(res, 'Department not found')
  const employeeCount = await Employee.countDocuments({ department: dept._id, status: 'active' })
  const obj = dept.toObject()
  obj.employeeCount = employeeCount
  success(res, obj)
})

const create = asyncHandler(async (req, res) => {
  if (!req.body.name) return badRequest(res, 'name is required')
  const dept = await Department.create(req.body)
  created(res, { ...dept.toObject(), employeeCount: 0 })
})

const update = asyncHandler(async (req, res) => {
  const dept = await Department.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('manager', 'firstName lastName')
  if (!dept) return notFound(res, 'Department not found')
  const employeeCount = await Employee.countDocuments({ department: dept._id, status: 'active' })
  success(res, { ...dept.toObject(), employeeCount })
})

const remove = asyncHandler(async (req, res) => {
  const dept = await Department.findByIdAndDelete(req.params.id)
  if (!dept) return notFound(res, 'Department not found')
  success(res, null, 'Department deleted')
})

module.exports = { getAll, getById, create, update, remove }
