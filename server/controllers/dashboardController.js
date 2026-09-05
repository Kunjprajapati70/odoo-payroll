const asyncHandler = require('../utils/asyncHandler')
const dashboardService = require('../services/dashboardService')
const { success } = require('../utils/response')

const getSummary = asyncHandler(async (req, res) => {
  const data = await dashboardService.getSummary({
    month: req.query.month,
    year: req.query.year,
    department: req.query.department,
  })
  success(res, data)
})

const getStats = asyncHandler(async (req, res) => {
  success(res, await dashboardService.getStats())
})

const getSalaryChart = asyncHandler(async (req, res) => {
  success(res, await dashboardService.getSalaryChart(req.query))
})

const getAttendanceChart = asyncHandler(async (req, res) => {
  success(res, await dashboardService.getAttendanceChart(req.query))
})

const getDepartmentChart = asyncHandler(async (req, res) => {
  success(res, await dashboardService.getDepartmentChart())
})

const getAlerts = asyncHandler(async (req, res) => {
  const now = new Date()
  const month = req.query.month ? Number(req.query.month) : now.getMonth() + 1
  const year = req.query.year ? Number(req.query.year) : now.getFullYear()
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0, 23, 59, 59)
  success(res, await dashboardService.buildAlerts(start, end))
})

module.exports = {
  getSummary,
  getStats,
  getSalaryChart,
  getAttendanceChart,
  getDepartmentChart,
  getAlerts,
}
