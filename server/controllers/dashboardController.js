const Employee = require('../models/Employee')
const Payrun = require('../models/Payrun')
const Attendance = require('../models/Attendance')
const TimeOffRequest = require('../models/TimeOffRequest')
const Department = require('../models/Department')
const { success } = require('../utils/response')

const getStats = async (req, res) => {
  const [totalEmployees, pendingLeaves, activePayruns] = await Promise.all([
    Employee.countDocuments({ status: 'active' }),
    TimeOffRequest.countDocuments({ status: 'pending' }),
    Payrun.countDocuments({ status: { $in: ['draft', 'processing'] } }),
  ])
  success(res, { totalEmployees, pendingLeaves, activePayruns })
}

const getSalaryChart = async (req, res) => {
  // TODO: aggregate payslip totals by month
  success(res, [])
}

const getAttendanceChart = async (req, res) => {
  // TODO: aggregate attendance by date
  success(res, [])
}

const getDepartmentChart = async (req, res) => {
  const data = await Employee.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: '$department', count: { $sum: 1 } } },
    { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
    { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
    { $project: { name: { $ifNull: ['$dept.name', 'Unassigned'] }, count: 1 } },
  ])
  success(res, data)
}

const getAlerts = async (req, res) => {
  // TODO: return real alerts (expired contracts, pending leaves, etc.)
  success(res, [])
}

module.exports = { getStats, getSalaryChart, getAttendanceChart, getDepartmentChart, getAlerts }
