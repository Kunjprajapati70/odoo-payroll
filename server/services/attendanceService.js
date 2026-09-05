const Attendance = require('../models/Attendance')
const { startOfMonth, endOfMonth } = require('../utils/dateUtils')

/**
 * Summarize attendance for an employee in a given month.
 */
const getMonthlySummary = async (employeeId, year, month) => {
  const start = new Date(year, month - 1, 1)
  const end = endOfMonth(start)
  const rows = await Attendance.aggregate([
    {
      $match: {
        employee: require('mongoose').Types.ObjectId.createFromHexString(String(employeeId)),
        date: { $gte: start, $lte: end },
      },
    },
    { $group: { _id: '$status', count: { $sum: 1 }, hours: { $sum: '$hoursWorked' } } },
  ])
  const byStatus = Object.fromEntries(rows.map((r) => [r._id, { count: r.count, hours: r.hours }]))
  return { year, month, byStatus, start, end }
}

module.exports = { getMonthlySummary }
