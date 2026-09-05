const Payslip = require('../models/Payslip');
const { AppError } = require('../utils/response.util');

class PayslipService {
  /**
   * Get all payslips with role-based filtering
   */
  static async getPayslips(query = {}, user) {
    const { employeeId, payrunId, status, periodStart, periodEnd, page = 1, limit = 20 } = query;
    const filter = {};

    // RBAC: Employee users may only access their own payslips
    if (user.role === 'EMPLOYEE') {
      if (!user.employeeId) {
        throw new AppError('User has no linked employee profile', 403, 'FORBIDDEN');
      }
      filter.employeeId = user.employeeId;
    } else if (employeeId) {
      filter.employeeId = employeeId;
    }

    if (payrunId) filter.payrunId = payrunId;
    if (status) filter.status = status;

    if (periodStart || periodEnd) {
      if (periodStart) filter.periodStart = { $gte: new Date(periodStart) };
      if (periodEnd) filter.periodEnd = { ...(filter.periodEnd || {}), $lte: new Date(periodEnd) };
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [payslips, total] = await Promise.all([
      Payslip.find(filter)
        .populate('employeeId', 'employeeCode firstName lastName email department jobPosition')
        .populate('contractId', 'salary startDate endDate')
        .populate('salaryStructureId', 'name code')
        .populate('payrunId', 'name periodStart periodEnd status')
        .sort({ periodStart: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Payslip.countDocuments(filter)
    ]);

    return {
      payslips,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10))
      }
    };
  }

  /**
   * Get a single payslip by ID with RBAC guard
   */
  static async getPayslipById(id, user) {
    const payslip = await Payslip.findById(id)
      .populate('employeeId')
      .populate('contractId')
      .populate('salaryStructureId')
      .populate('payrunId');

    if (!payslip) {
      throw new AppError('Payslip not found', 404, 'PAYSLIP_NOT_FOUND');
    }

    // RBAC: Employee users may only access their own payslips
    if (user.role === 'EMPLOYEE') {
      const empId = payslip.employeeId?._id ? payslip.employeeId._id.toString() : payslip.employeeId.toString();
      if (empId !== user.employeeId?.toString()) {
        throw new AppError('You are not authorized to view another employee\'s payslip', 403, 'FORBIDDEN');
      }
    }

    return payslip;
  }
}

module.exports = PayslipService;
