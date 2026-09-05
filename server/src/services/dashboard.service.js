const Payslip = require('../models/Payslip');
const Payrun = require('../models/Payrun');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const LeaveAllocation = require('../models/LeaveAllocation');
const Contract = require('../models/Contract');

class DashboardService {
  /**
   * Get consolidated Payroll Dashboard statistics, aggregations, trends, and system alerts.
   * @param {Object} filters - { periodStart, periodEnd, department, employeeType }
   * @param {Object} currentUser - Authenticated user info
   */
  static async getDashboardData(filters = {}, currentUser = {}) {
    const { periodStart, periodEnd, department, employeeType } = filters;

    // 1. Build Base Match Queries for Employee filtering
    const empFilter = {};
    if (department) {
      empFilter.department = department;
    }
    if (employeeType) {
      empFilter.employeeType = employeeType;
    }

    let matchingEmployeeIds = null;
    if (department || employeeType) {
      const emps = await Employee.find(empFilter, { _id: 1 });
      matchingEmployeeIds = emps.map((e) => e._id);
    }

    // Date range filter helper
    const dateRange = {};
    if (periodStart) dateRange.$gte = new Date(periodStart);
    if (periodEnd) dateRange.$lte = new Date(periodEnd);
    const hasDateRange = Object.keys(dateRange).length > 0;

    // 2. Payslip match criteria
    const payslipMatch = {};
    if (matchingEmployeeIds) {
      payslipMatch.employeeId = { $in: matchingEmployeeIds };
    }
    if (hasDateRange) {
      payslipMatch.periodStart = dateRange;
    }

    // 3. Attendance match criteria
    const attendanceMatch = {};
    if (matchingEmployeeIds) {
      attendanceMatch.employeeId = { $in: matchingEmployeeIds };
    }
    if (hasDateRange) {
      attendanceMatch.date = dateRange;
    }

    // 4. LeaveRequest match criteria
    const leaveMatch = {};
    if (matchingEmployeeIds) {
      leaveMatch.employeeId = { $in: matchingEmployeeIds };
    }
    if (hasDateRange) {
      leaveMatch.startDate = dateRange;
    }

    // 5. Execute parallel aggregations for dashboard metrics
    const [
      payslipAgg,
      salaryByDeptAgg,
      monthlyTrendAgg,
      attendanceAgg,
      timeOffApprovedAgg,
      pendingLeavesCount,
      leaveBalancesAgg,
      deptBreakdownAgg,
      alerts
    ] = await Promise.all([
      // A. KPI: Total Net, Payslips Count, Average Salary
      Payslip.aggregate([
        { $match: payslipMatch },
        {
          $group: {
            _id: null,
            totalPayslips: { $sum: 1 },
            paidPayslips: {
              $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, 1, 0] }
            },
            totalNetSalaryPaid: {
              $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, '$totals.net', 0] }
            },
            totalNetComputed: { $sum: '$totals.net' },
            avgNetSalary: { $avg: '$totals.net' }
          }
        }
      ]),

      // B. Salary by Department
      Payslip.aggregate([
        { $match: payslipMatch },
        {
          $lookup: {
            from: 'employees',
            localField: 'employeeId',
            foreignField: '_id',
            as: 'employee'
          }
        },
        { $unwind: '$employee' },
        {
          $group: {
            _id: '$employee.department',
            totalNet: { $sum: '$totals.net' },
            totalGross: { $sum: '$totals.gross' },
            totalBasic: { $sum: '$totals.basic' },
            totalDeductions: { $sum: '$totals.deductions' },
            payslipCount: { $sum: 1 },
            avgSalary: { $avg: '$totals.net' }
          }
        },
        {
          $project: {
            _id: 0,
            department: '$_id',
            totalNet: { $round: ['$totalNet', 2] },
            totalGross: { $round: ['$totalGross', 2] },
            totalBasic: { $round: ['$totalBasic', 2] },
            totalDeductions: { $round: ['$totalDeductions', 2] },
            payslipCount: 1,
            avgSalary: { $round: ['$avgSalary', 2] }
          }
        },
        { $sort: { totalNet: -1 } }
      ]),

      // C. Monthly Salary Trend
      Payslip.aggregate([
        {
          $match: {
            ...payslipMatch,
            periodStart: { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$periodStart' },
              month: { $month: '$periodStart' }
            },
            totalNet: { $sum: '$totals.net' },
            totalGross: { $sum: '$totals.gross' },
            totalDeductions: { $sum: '$totals.deductions' },
            payslipsCount: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            year: '$_id.year',
            month: '$_id.month',
            period: {
              $concat: [
                { $toString: '$_id.year' },
                '-',
                {
                  $cond: [
                    { $lt: ['$_id.month', 10] },
                    { $concat: ['0', { $toString: '$_id.month' }] },
                    { $toString: '$_id.month' }
                  ]
                }
              ]
            },
            totalNet: { $round: ['$totalNet', 2] },
            totalGross: { $round: ['$totalGross', 2] },
            totalDeductions: { $round: ['$totalDeductions', 2] },
            payslipsCount: 1
          }
        },
        { $sort: { year: 1, month: 1 } }
      ]),

      // D. Attendance Overview & Coverage
      Attendance.aggregate([
        { $match: attendanceMatch },
        {
          $group: {
            _id: null,
            totalRecords: { $sum: 1 },
            present: {
              $sum: { $cond: [{ $in: ['$status', ['PRESENT', 'HALF_DAY']] }, 1, 0] }
            },
            late: {
              $sum: { $cond: [{ $eq: ['$isLate', true] }, 1, 0] }
            },
            absent: {
              $sum: { $cond: [{ $eq: ['$status', 'ABSENT'] }, 1, 0] }
            },
            overtimeMinutes: { $sum: '$overtimeMinutes' },
            missingCheckouts: {
              $sum: { $cond: [{ $eq: ['$isMissingCheckout', true] }, 1, 0] }
            },
            manualEdits: {
              $sum: { $cond: [{ $eq: ['$manualCorrection.isManuallyCorrected', true] }, 1, 0] }
            }
          }
        }
      ]),

      // E. Time Off: Approved Days
      LeaveRequest.aggregate([
        {
          $match: {
            ...leaveMatch,
            status: 'APPROVED'
          }
        },
        {
          $group: {
            _id: null,
            totalApprovedDays: { $sum: '$duration' }
          }
        }
      ]),

      // F. Time Off: Pending Requests Count
      LeaveRequest.countDocuments({
        ...leaveMatch,
        status: 'PENDING'
      }),

      // G. Time Off: Leave Balances Aggregation
      LeaveAllocation.aggregate([
        {
          $match: matchingEmployeeIds
            ? { employeeId: { $in: matchingEmployeeIds }, status: 'APPROVED' }
            : { status: 'APPROVED' }
        },
        {
          $group: {
            _id: null,
            totalAllocated: { $sum: '$allocated' },
            totalUsed: { $sum: '$used' },
            totalRemaining: { $sum: '$remaining' }
          }
        }
      ]),

      // H. Department Breakdown (Headcount, Active Contracts, Total Wages)
      Employee.aggregate([
        { $match: empFilter },
        {
          $lookup: {
            from: 'contracts',
            let: { empId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$employeeId', '$$empId'] },
                      { $eq: ['$status', 'ACTIVE'] }
                    ]
                  }
                }
              }
            ],
            as: 'activeContracts'
          }
        },
        {
          $group: {
            _id: '$department',
            employeeCount: { $sum: 1 },
            activeContractCount: {
              $sum: { $size: '$activeContracts' }
            },
            totalBaseWages: {
              $sum: {
                $reduce: {
                  input: '$activeContracts',
                  initialValue: 0,
                  in: { $add: ['$$value', '$$this.salary'] }
                }
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            department: '$_id',
            employeeCount: 1,
            activeContractCount: 1,
            totalBaseWages: { $round: ['$totalBaseWages', 2] }
          }
        },
        { $sort: { employeeCount: -1 } }
      ]),

      // I. Real-time System Alerts (Auditing issues in database)
      DashboardService.detectAlerts()
    ]);

    // KPI extractions
    const pKpi = payslipAgg[0] || {};
    const attKpi = attendanceAgg[0] || {};
    const approvedDays = timeOffApprovedAgg[0]?.totalApprovedDays || 0;
    const leaveBal = leaveBalancesAgg[0] || { totalAllocated: 0, totalUsed: 0, totalRemaining: 0 };

    const totalNetSalaryPaid = pKpi.totalNetSalaryPaid || 0;
    const payslipsGenerated = pKpi.totalPayslips || 0;
    const averageSalary = pKpi.avgNetSalary ? Math.round(pKpi.avgNetSalary * 100) / 100 : 0;

    // Attendance health percentage: (present / totalRecords) * 100
    const totalAttRecords = attKpi.totalRecords || 0;
    const presentRecords = attKpi.present || 0;
    const attendanceHealth = totalAttRecords > 0
      ? `${Math.round((presentRecords / totalAttRecords) * 100)}%`
      : '100%';

    // Attendance coverage: percentage of active employees having attendance in period
    const totalActiveEmployees = await Employee.countDocuments({ status: 'ACTIVE', ...empFilter });
    let attendanceCoverage = '0%';
    if (totalActiveEmployees > 0 && totalAttRecords > 0) {
      const distinctEmpsWithAttendance = await Attendance.distinct('employeeId', attendanceMatch);
      attendanceCoverage = `${Math.round((distinctEmpsWithAttendance.length / totalActiveEmployees) * 100)}%`;
    }

    return {
      kpis: {
        totalNetSalaryPaid,
        payslipsGenerated,
        averageSalary,
        approvedTimeOff: approvedDays,
        attendanceHealth
      },
      salaryByDepartment: salaryByDeptAgg,
      monthlySalaryTrend: monthlyTrendAgg,
      attendanceOverview: {
        present: attKpi.present || 0,
        late: attKpi.late || 0,
        absent: attKpi.absent || 0,
        overtime: Math.round(((attKpi.overtimeMinutes || 0) / 60) * 10) / 10, // hours
        missingCheckouts: attKpi.missingCheckouts || 0,
        manualEdits: attKpi.manualEdits || 0,
        attendanceCoverage
      },
      timeOffOverview: {
        approvedDays,
        pendingRequests: pendingLeavesCount,
        leaveBalances: {
          allocated: leaveBal.totalAllocated || 0,
          used: leaveBal.totalUsed || 0,
          remaining: leaveBal.totalRemaining || 0
        }
      },
      departmentBreakdown: deptBreakdownAgg,
      alerts
    };
  }

  /**
   * Scan database records for real actionable alerts:
   * - missing bank details
   * - duplicate payslips
   * - contract conflicts
   * - payroll statuses (draft/unpaid payruns)
   * - pending payroll issues
   */
  static async detectAlerts() {
    const alerts = [];

    // 1. Missing Bank Details for Active Employees
    const employeesMissingBank = await Employee.find(
      {
        status: 'ACTIVE',
        $or: [
          { 'bankDetails.accountNumber': { $in: [null, ''] } },
          { 'bankDetails.ifscCode': { $in: [null, ''] } },
          { bankDetails: { $exists: false } }
        ]
      },
      { employeeCode: 1, firstName: 1, lastName: 1, department: 1 }
    ).limit(10);

    if (employeesMissingBank.length > 0) {
      alerts.push({
        type: 'MISSING_BANK_DETAILS',
        severity: 'WARNING',
        title: 'Missing Bank Details',
        message: `${employeesMissingBank.length} active employee(s) are missing bank account or IFSC details for salary disbursement.`,
        count: employeesMissingBank.length,
        items: employeesMissingBank.map((e) => ({
          employeeId: e._id,
          employeeCode: e.employeeCode,
          name: `${e.firstName} ${e.lastName}`,
          department: e.department
        }))
      });
    }

    // 2. Duplicate Payslips (Same employee with multiple active payslips in identical period)
    const duplicatePayslips = await Payslip.aggregate([
      {
        $group: {
          _id: {
            employeeId: '$employeeId',
            periodStart: '$periodStart',
            periodEnd: '$periodEnd'
          },
          count: { $sum: 1 },
          payslipIds: { $push: '$_id' }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      },
      {
        $lookup: {
          from: 'employees',
          localField: '_id.employeeId',
          foreignField: '_id',
          as: 'employee'
        }
      },
      { $unwind: { path: '$employee', preserveNullAndEmptyArrays: true } }
    ]);

    if (duplicatePayslips.length > 0) {
      alerts.push({
        type: 'DUPLICATE_PAYSLIPS',
        severity: 'ERROR',
        title: 'Duplicate Payslips Detected',
        message: `Found ${duplicatePayslips.length} instances where an employee has multiple payslips for the identical period.`,
        count: duplicatePayslips.length,
        items: duplicatePayslips.map((d) => ({
          employeeCode: d.employee?.employeeCode || 'N/A',
          periodStart: d._id.periodStart,
          periodEnd: d._id.periodEnd,
          duplicateCount: d.count
        }))
      });
    }

    // 3. Contract Conflicts (Employees with multiple overlapping ACTIVE contracts)
    const activeContracts = await Contract.find({ status: 'ACTIVE' });
    const empContractMap = {};
    for (const c of activeContracts) {
      const empIdStr = c.employeeId.toString();
      if (!empContractMap[empIdStr]) empContractMap[empIdStr] = [];
      empContractMap[empIdStr].push(c);
    }

    const conflictedEmpIds = [];
    for (const [empId, contracts] of Object.entries(empContractMap)) {
      if (contracts.length > 1) {
        // Check for date overlaps
        let hasOverlap = false;
        for (let i = 0; i < contracts.length; i++) {
          for (let j = i + 1; j < contracts.length; j++) {
            const c1Start = new Date(contracts[i].startDate);
            const c1End = contracts[i].endDate ? new Date(contracts[i].endDate) : new Date('2099-12-31');
            const c2Start = new Date(contracts[j].startDate);
            const c2End = contracts[j].endDate ? new Date(contracts[j].endDate) : new Date('2099-12-31');

            if (c1Start <= c2End && c2Start <= c1End) {
              hasOverlap = true;
              break;
            }
          }
          if (hasOverlap) break;
        }
        if (hasOverlap) conflictedEmpIds.push(empId);
      }
    }

    if (conflictedEmpIds.length > 0) {
      alerts.push({
        type: 'CONTRACT_CONFLICTS',
        severity: 'ERROR',
        title: 'Contract Conflicts',
        message: `${conflictedEmpIds.length} employee(s) have multiple overlapping active employment contracts.`,
        count: conflictedEmpIds.length,
        items: conflictedEmpIds
      });
    }

    // 4. Payroll Statuses (Pending or Draft Payruns awaiting attention)
    const pendingPayruns = await Payrun.find({ status: { $in: ['DRAFT', 'COMPUTED', 'VALIDATED'] } })
      .select('name status periodStart periodEnd totals')
      .sort({ createdAt: -1 })
      .limit(5);

    if (pendingPayruns.length > 0) {
      alerts.push({
        type: 'PAYROLL_STATUSES',
        severity: 'INFO',
        title: 'Pending Payruns',
        message: `There are ${pendingPayruns.length} payrun(s) in unfinalized state awaiting review, computation, or payment.`,
        count: pendingPayruns.length,
        items: pendingPayruns.map((p) => ({
          payrunId: p._id,
          name: p.name,
          status: p.status,
          totalNet: p.totals?.totalNet || 0
        }))
      });
    }

    // 5. Pending Payroll Issues (Payruns with warning flags or uncomputed errors)
    const payrunsWithWarnings = await Payrun.find(
      { 'warnings.0': { $exists: true } },
      { name: 1, status: 1, warnings: 1 }
    ).limit(5);

    if (payrunsWithWarnings.length > 0) {
      const totalWarnings = payrunsWithWarnings.reduce((acc, p) => acc + (p.warnings?.length || 0), 0);
      alerts.push({
        type: 'PENDING_PAYROLL_ISSUES',
        severity: 'WARNING',
        title: 'Payrun Calculation Warnings',
        message: `${payrunsWithWarnings.length} payrun(s) have unresolved calculation warnings or errors (${totalWarnings} total warnings).`,
        count: totalWarnings,
        items: payrunsWithWarnings.map((p) => ({
          payrunId: p._id,
          name: p.name,
          warningCount: p.warnings.length
        }))
      });
    }

    return alerts;
  }
}

module.exports = DashboardService;
