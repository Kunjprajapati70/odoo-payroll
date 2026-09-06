const Employee = require('../models/Employee')
const Payslip = require('../models/Payslip')
const Attendance = require('../models/Attendance')
const TimeOffRequest = require('../models/TimeOffRequest')
const Contract = require('../models/Contract')
const Department = require('../models/Department')
const User = require('../models/User')
const { ROLES } = require('../utils/roles')
const { startOfMonth, endOfMonth } = require('../utils/dateUtils')

const toNumber = (v) => (typeof v === 'number' ? v : 0)

/**
 * Full dashboard summary with real MongoDB aggregations.
 * Supports month (1-12) and department filters.
 */
const getSummary = async ({ month, year, department } = {}) => {
  const now = new Date()
  const y = year ? Number(year) : now.getFullYear()
  const m = month ? Number(month) : now.getMonth() + 1
  const rangeStart = new Date(y, m - 1, 1)
  const rangeEnd = endOfMonth(rangeStart)

  const empFilter = { status: 'active' }
  if (department) empFilter.department = department

  const activeEmployees = await Employee.find(empFilter).select('_id')
  const employeeIds = activeEmployees.map((e) => e._id)

  const payslipMatch = {
    status: { $in: ['done', 'paid'] },
    periodStart: { $lte: rangeEnd },
    periodEnd: { $gte: rangeStart },
  }
  if (department) {
    payslipMatch.employee = { $in: employeeIds }
  }

  const [totalEmployees, payslipAgg, approvedTimeOff, attendanceAgg, deptDist, alerts] =
    await Promise.all([
      Employee.countDocuments(empFilter),
      Payslip.aggregate([
        { $match: payslipMatch },
        {
          $group: {
            _id: null,
            totalNet: { $sum: '$netSalary' },
            totalGross: { $sum: '$grossSalary' },
            count: { $sum: 1 },
            avgNet: { $avg: '$netSalary' },
          },
        },
      ]),
      TimeOffRequest.countDocuments({
        status: 'approved',
        startDate: { $lte: rangeEnd },
        endDate: { $gte: rangeStart },
        ...(department ? { employee: { $in: employeeIds } } : {}),
      }),
      Attendance.aggregate([
        {
          $match: {
            date: { $gte: rangeStart, $lte: rangeEnd },
            ...(department || employeeIds.length
              ? { employee: { $in: employeeIds.length ? employeeIds : [null] } }
              : {}),
          },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      Employee.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        {
          $lookup: {
            from: 'departments',
            localField: '_id',
            foreignField: '_id',
            as: 'dept',
          },
        },
        { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            name: { $ifNull: ['$dept.name', 'Unassigned'] },
            count: 1,
          },
        },
        { $sort: { count: -1 } },
      ]),
      buildAlerts(rangeStart, rangeEnd),
    ])

  const payslipStats = payslipAgg[0] || {}
  const attMap = Object.fromEntries(attendanceAgg.map((a) => [a._id, a.count]))
  const present = toNumber(attMap.present) + toNumber(attMap.late) + toNumber(attMap.half_day)
  const totalAtt = attendanceAgg.reduce((s, a) => s + a.count, 0)
  const attendanceHealth = totalAtt > 0 ? Math.round((present / totalAtt) * 100) : 100

  const [salaryByDept, monthlyTrend, attendanceOverview, timeOffOverview, recentUsers, hrCreatedThisMonth] = await Promise.all([
    getSalaryByDepartment(rangeStart, rangeEnd),
    getMonthlySalaryTrend(y),
    getAttendanceOverview(rangeStart, rangeEnd, employeeIds),
    getTimeOffOverview(y, employeeIds),
    User.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .select('name email role isActive createdAt createdBy')
      .populate('createdBy', 'name role')
      .lean(),
    User.countDocuments({
      createdAt: { $gte: rangeStart, $lte: rangeEnd },
    }),
  ])

  // Count users created by HR managers (for admin activity)
  const hrManagerIds = await User.find({ role: ROLES.HR_MANAGER }).select('_id').lean()
  const hrIds = hrManagerIds.map((u) => u._id)
  const usersCreatedByHr = hrIds.length
    ? await User.countDocuments({
        createdBy: { $in: hrIds },
        createdAt: { $gte: rangeStart, $lte: rangeEnd },
      })
    : 0

  return {
    totalEmployees,
    totalNetSalaryPaid: Math.round((payslipStats.totalNet || 0) * 100) / 100,
    totalPayslips: payslipStats.count || 0,
    averageSalary: Math.round((payslipStats.avgNet || 0) * 100) / 100,
    approvedTimeOff,
    attendanceHealth,
    salaryCostByDepartment: salaryByDept,
    monthlySalaryTrend: monthlyTrend,
    attendanceOverview,
    timeOffOverview,
    departmentDistribution: deptDist,
    alerts,
    recentUsers,
    usersCreatedThisMonth: hrCreatedThisMonth,
    usersCreatedByHrThisMonth: usersCreatedByHr,
    filters: { month: m, year: y, department: department || null },
  }
}

const getSalaryByDepartment = async (rangeStart, rangeEnd) =>
  Payslip.aggregate([
    {
      $match: {
        status: { $in: ['done', 'paid'] },
        periodStart: { $lte: rangeEnd },
        periodEnd: { $gte: rangeStart },
      },
    },
    {
      $lookup: {
        from: 'employees',
        localField: 'employee',
        foreignField: '_id',
        as: 'emp',
      },
    },
    { $unwind: '$emp' },
    {
      $lookup: {
        from: 'departments',
        localField: 'emp.department',
        foreignField: '_id',
        as: 'dept',
      },
    },
    { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$emp.department',
        name: { $first: { $ifNull: ['$dept.name', 'Unassigned'] } },
        total: { $sum: '$netSalary' },
      },
    },
    { $project: { _id: 0, name: 1, total: { $round: ['$total', 2] } } },
    { $sort: { total: -1 } },
  ])

const getMonthlySalaryTrend = async (year) => {
  const start = new Date(year, 0, 1)
  const end = new Date(year, 11, 31, 23, 59, 59)
  const rows = await Payslip.aggregate([
    {
      $match: {
        status: { $in: ['done', 'paid'] },
        periodStart: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: { $month: '$periodStart' },
        total: { $sum: '$netSalary' },
      },
    },
  ])
  const map = Object.fromEntries(rows.map((r) => [r._id, r.total]))
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return months.map((month, i) => ({
    month,
    total: Math.round((map[i + 1] || 0) * 100) / 100,
  }))
}

const getAttendanceOverview = async (rangeStart, rangeEnd, employeeIds) => {
  const match = { date: { $gte: rangeStart, $lte: rangeEnd } }
  if (employeeIds?.length) match.employee = { $in: employeeIds }

  const rows = await Attendance.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          d: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          status: '$status',
        },
        count: { $sum: 1 },
      },
    },
  ])

  const byDate = {}
  for (const row of rows) {
    const key = row._id.d
    if (!byDate[key]) byDate[key] = { date: key, present: 0, absent: 0, late: 0 }
    if (row._id.status === 'present' || row._id.status === 'half_day') byDate[key].present += row.count
    else if (row._id.status === 'absent') byDate[key].absent += row.count
    else if (row._id.status === 'late') byDate[key].late += row.count
  }
  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date))
}

const getTimeOffOverview = async (year, employeeIds) => {
  const match = {
    startDate: { $gte: new Date(year, 0, 1), $lte: new Date(year, 11, 31, 23, 59, 59) },
  }
  if (employeeIds?.length) match.employee = { $in: employeeIds }

  return TimeOffRequest.aggregate([
    { $match: match },
    { $group: { _id: '$status', count: { $sum: 1 }, days: { $sum: '$days' } } },
    { $project: { _id: 0, status: '$_id', count: 1, days: 1 } },
  ])
}

const buildAlerts = async (rangeStart, rangeEnd) => {
  const alerts = []
  const soon = new Date(rangeEnd)
  soon.setDate(soon.getDate() + 30)

  const [expiringContracts, pendingLeaves, inactiveDepts] = await Promise.all([
    Contract.find({
      status: 'active',
      endDate: { $gte: new Date(), $lte: soon },
    })
      .populate({
        path: 'employee',
        select: 'firstName lastName employeeId department',
        populate: { path: 'department', select: 'name' },
      })
      .limit(10),
    TimeOffRequest.countDocuments({ status: 'pending' }),
    Department.countDocuments({ isActive: false }),
  ])

  for (const c of expiringContracts) {
    alerts.push({
      type: 'contract',
      message: `Contract for ${c.employee?.firstName || ''} ${c.employee?.lastName || ''} expires on ${new Date(c.endDate).toLocaleDateString()}`,
    })

    // One-time email + in-app notify for HR when contract enters the expiry window
    if (!c.expiryNotifiedAt) {
      try {
        const {
          safeNotify,
          findHrApproverUsers,
          createNotification,
        } = require('./notificationService')
        const { sendContractExpiryEmail } = require('./emailService')
        const remainingDays = Math.max(
          0,
          Math.ceil((new Date(c.endDate) - new Date()) / (1000 * 60 * 60 * 24))
        )
        const employeeName = `${c.employee?.firstName || ''} ${c.employee?.lastName || ''}`.trim() || 'Employee'
        await safeNotify('contract-expiry', async () => {
          const departmentName = c.employee?.department?.name || ''
          const hrs = await findHrApproverUsers()
          for (const hr of hrs) {
            if (hr.email) {
              await sendContractExpiryEmail({
                to: hr.email,
                employeeName,
                endDate: c.endDate,
                remainingDays,
                department: departmentName,
              })
            }
            await createNotification({
              userId: hr._id,
              title: 'Contract Expiring',
              message: `${employeeName}'s contract expires in ${remainingDays} day(s).`,
              type: 'contract',
              metadata: { contractId: String(c._id), employeeId: String(c.employee?._id || '') },
            })
          }
          c.expiryNotifiedAt = new Date()
          await c.save()
        })
      } catch (err) {
        console.error('[contract-expiry-notify]', err.message)
      }
    }
  }
  if (pendingLeaves > 0) {
    alerts.push({
      type: 'pending',
      message: `${pendingLeaves} time-off request(s) awaiting approval`,
    })
  }
  if (inactiveDepts > 0) {
    alerts.push({
      type: 'info',
      message: `${inactiveDepts} inactive department(s) in the system`,
    })
  }
  return alerts
}

// Chart helpers used by existing dashboard endpoints
const getSalaryChart = async (params = {}) => {
  const year = params.year ? Number(params.year) : new Date().getFullYear()
  return getMonthlySalaryTrend(year)
}

const getAttendanceChart = async (params = {}) => {
  const now = new Date()
  const y = params.year ? Number(params.year) : now.getFullYear()
  const m = params.month ? Number(params.month) : now.getMonth() + 1
  const start = new Date(y, m - 1, 1)
  const end = endOfMonth(start)
  return getAttendanceOverview(start, end)
}

const getDepartmentChart = async () => {
  return Employee.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: '$department', count: { $sum: 1 } } },
    {
      $lookup: {
        from: 'departments',
        localField: '_id',
        foreignField: '_id',
        as: 'dept',
      },
    },
    { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
    { $project: { name: { $ifNull: ['$dept.name', 'Unassigned'] }, count: 1 } },
  ])
}

const getStats = async () => {
  const summary = await getSummary({})
  return {
    totalEmployees: summary.totalEmployees,
    pendingLeaves: await TimeOffRequest.countDocuments({ status: 'pending' }),
    activePayruns: await require('../models/Payrun').countDocuments({
      status: { $in: ['draft', 'computed'] },
    }),
    totalNetSalary: summary.totalNetSalaryPaid,
    totalPayslips: summary.totalPayslips,
    avgSalary: summary.averageSalary,
    approvedTimeOff: summary.approvedTimeOff,
    attendanceHealth: summary.attendanceHealth,
  }
}

module.exports = {
  getSummary,
  getStats,
  getSalaryChart,
  getAttendanceChart,
  getDepartmentChart,
  buildAlerts,
}
