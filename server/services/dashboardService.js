/**
 * Dashboard Service
 * Aggregates KPIs and chart data.
 * TODO: implement monthly salary totals, attendance summaries
 */

const getMonthlySalaryTotals = async (year) => {
  // Returns [{ month: 'Jan', total: 0 }, ...]
  return []
}

const getMonthlyAttendanceSummary = async (year) => {
  // Returns [{ date: '2026-01-01', present: 0, absent: 0 }, ...]
  return []
}

module.exports = { getMonthlySalaryTotals, getMonthlyAttendanceSummary }
