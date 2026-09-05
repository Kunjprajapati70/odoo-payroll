const Payrun = require('../models/Payrun');
const Payslip = require('../models/Payslip');
const Employee = require('../models/Employee');
const Contract = require('../models/Contract');
const SalaryStructure = require('../models/SalaryStructure');
const ContractService = require('./contract.service');
const PayrollEngineService = require('./payrollEngine.service');
const ValidationService = require('./validation.service');
const { AppError } = require('../utils/response.util');

class PayrunService {
  /**
   * Step 1: Preview payrun - Discover eligible employees for period & structure.
   * STRICT: Does NOT create any Payrun in the database.
   */
  static async previewPayrun({ salaryStructureId, periodStart, periodEnd }) {
    if (!salaryStructureId) {
      throw new AppError('salaryStructureId is required for payrun preview', 422, 'VALIDATION_ERROR', { field: 'salaryStructureId' });
    }
    if (!periodStart || !periodEnd) {
      throw new AppError('periodStart and periodEnd are required', 422, 'VALIDATION_ERROR');
    }

    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    if (end < start) {
      throw new AppError('periodEnd cannot be earlier than periodStart', 422, 'VALIDATION_ERROR');
    }

    const structure = await SalaryStructure.findById(salaryStructureId).populate('ruleIds');
    if (!structure) {
      throw new AppError('Salary structure not found', 404, 'STRUCTURE_NOT_FOUND');
    }

    // Find all active contracts that overlap with this period
    const contracts = await Contract.find({
      salaryStructureId,
      status: { $in: ['ACTIVE', 'EXPIRED'] },
      startDate: { $lte: end },
      $or: [{ endDate: null }, { endDate: { $gte: start } }]
    }).populate('employeeId');

    const eligibleEmployees = [];
    const seenEmpIds = new Set();

    for (const contract of contracts) {
      const emp = contract.employeeId;
      if (emp && emp.status === 'ACTIVE' && !seenEmpIds.has(emp._id.toString())) {
        seenEmpIds.add(emp._id.toString());
        eligibleEmployees.push({
          _id: emp._id,
          employeeCode: emp.employeeCode,
          firstName: emp.firstName,
          lastName: emp.lastName,
          email: emp.email,
          department: emp.department,
          jobPosition: emp.jobPosition,
          salary: contract.salary,
          contractId: contract._id
        });
      }
    }

    return {
      salaryStructure: {
        _id: structure._id,
        name: structure.name,
        code: structure.code
      },
      periodStart: start,
      periodEnd: end,
      totalEligible: eligibleEmployees.length,
      eligibleEmployees
    };
  }

  /**
   * Step 2: Create payrun with explicitly selected employees in DRAFT status
   */
  static async createPayrun({ name, salaryStructureId, periodStart, periodEnd, employeeIds, createdBy }) {
    if (!salaryStructureId) {
      throw new AppError('salaryStructureId is required', 422, 'VALIDATION_ERROR', { field: 'salaryStructureId' });
    }
    if (!periodStart || !periodEnd) {
      throw new AppError('periodStart and periodEnd are required', 422, 'VALIDATION_ERROR');
    }

    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    if (end < start) {
      throw new AppError('periodEnd cannot be earlier than periodStart', 422, 'VALIDATION_ERROR');
    }

    const structure = await SalaryStructure.findById(salaryStructureId);
    if (!structure) {
      throw new AppError('Salary structure not found', 404, 'STRUCTURE_NOT_FOUND');
    }

    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
      throw new AppError('Payrun must contain at least one selected employee', 422, 'VALIDATION_ERROR', { field: 'employeeIds' });
    }

    const payrunName = (name || '').trim() || `${structure.name} - ${start.toISOString().slice(0, 7)}`;

    const payrun = await Payrun.create({
      name: payrunName,
      periodStart: start,
      periodEnd: end,
      salaryStructureId,
      employeeIds,
      payslipIds: [],
      status: 'DRAFT',
      totals: {
        totalBasic: 0,
        totalGross: 0,
        totalDeductions: 0,
        totalNet: 0,
        employeeCount: employeeIds.length
      },
      createdBy: createdBy || null
    });

    return payrun.populate([
      { path: 'salaryStructureId', select: 'name code' },
      { path: 'employeeIds', select: 'employeeCode firstName lastName email department' }
    ]);
  }

  /**
   * Get all payruns
   */
  static async getPayruns(query = {}) {
    const { status, page = 1, limit = 20 } = query;
    const filter = {};
    if (status) filter.status = status;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [payruns, total] = await Promise.all([
      Payrun.find(filter)
        .populate('salaryStructureId', 'name code')
        .sort({ periodStart: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Payrun.countDocuments(filter)
    ]);

    return {
      payruns,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10))
      }
    };
  }

  /**
   * Get payrun by ID with populated structure, employees, and payslips
   */
  static async getPayrunById(id) {
    const payrun = await Payrun.findById(id)
      .populate('salaryStructureId')
      .populate('employeeIds', 'employeeCode firstName lastName email department jobPosition')
      .populate({
        path: 'payslipIds',
        populate: { path: 'employeeId', select: 'employeeCode firstName lastName department' }
      });

    if (!payrun) {
      throw new AppError('Payrun not found', 404, 'PAYRUN_NOT_FOUND');
    }

    return payrun;
  }

  /**
   * Compute Payrun: DRAFT -> COMPUTED
   * Evaluates payroll engine for every selected employee, upserts payslips, calculates payrun totals.
   */
  static async computePayrun(id) {
    const payrun = await Payrun.findById(id);
    if (!payrun) {
      throw new AppError('Payrun not found', 404, 'PAYRUN_NOT_FOUND');
    }

    // Enforce state transitions: only DRAFT or COMPUTED can be computed
    if (payrun.status === 'PAID') {
      throw new AppError(
        'Cannot re-compute a PAID payrun. Historical payroll data is permanently preserved.',
        400,
        'IMMUTABLE_PAID_PAYRUN'
      );
    }
    if (payrun.status === 'VALIDATED') {
      throw new AppError(
        'Payrun is already VALIDATED. Reset or proceed to PAY.',
        400,
        'INVALID_STATE_TRANSITION'
      );
    }

    const employeeIds = payrun.employeeIds || [];
    if (employeeIds.length === 0) {
      throw new AppError('Payrun has no selected employees to compute', 422, 'NO_EMPLOYEES_SELECTED');
    }

    const payslipIds = [];
    const warnings = [];

    let totalBasic = 0;
    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;

    for (const empId of employeeIds) {
      try {
        // Check duplicate payslip in ANOTHER payrun for same employee and period
        const existingPayslipInOtherPayrun = await Payslip.findOne({
          employeeId: empId,
          payrunId: { $ne: payrun._id },
          periodStart: payrun.periodStart,
          periodEnd: payrun.periodEnd,
          status: { $ne: 'CANCELLED' }
        });

        if (existingPayslipInOtherPayrun) {
          throw new AppError(
            `Duplicate payslip detected: Employee already has an active payslip in another payrun for this period`,
            409,
            'DUPLICATE_PAYSLIP'
          );
        }

        // Run Core Payroll Engine
        const calcResult = await PayrollEngineService.computePayslip({
          employeeId: empId,
          payrunId: payrun._id,
          options: { payrun }
        });

        const yearMonth = new Date(payrun.periodStart).toISOString().slice(0, 7).replace('-', '');
        const empCode = calcResult.employeeSnapshot?.employeeCode || empId.toString().slice(-4).toUpperCase();
        const randHash = Math.random().toString(36).substring(2, 6).toUpperCase();
        const generatedPayslipNumber = `SLIP-${yearMonth}-${empCode}-${randHash}`;

        // Upsert payslip for this employee in this payrun
        const payslip = await Payslip.findOneAndUpdate(
          { payrunId: payrun._id, employeeId: empId },
          {
            $set: {
              contractId: calcResult.contractId,
              salaryStructureId: calcResult.salaryStructureId,
              periodStart: payrun.periodStart,
              periodEnd: payrun.periodEnd,
              workedDays: calcResult.workedDays,
              workedHours: calcResult.workedHours,
              lines: calcResult.lines,
              totals: calcResult.totals,
              status: 'COMPUTED'
            },
            $setOnInsert: {
              payslipNumber: generatedPayslipNumber
            }
          },
          { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );

        payslipIds.push(payslip._id);

        totalBasic += calcResult.totals.basic;
        totalGross += calcResult.totals.gross;
        totalDeductions += calcResult.totals.deductions;
        totalNet += calcResult.totals.net;
      } catch (err) {
        warnings.push({
          severity: 'ERROR',
          code: err.code || 'COMPUTE_ERROR',
          employeeId: empId,
          message: err.message
        });
      }
    }

    // Update payrun with computed results & state transition
    payrun.status = 'COMPUTED';
    payrun.payslipIds = payslipIds;
    payrun.warnings = warnings;
    payrun.totals = {
      totalBasic: Math.round((totalBasic + Number.EPSILON) * 100) / 100,
      totalGross: Math.round((totalGross + Number.EPSILON) * 100) / 100,
      totalDeductions: Math.round((totalDeductions + Number.EPSILON) * 100) / 100,
      totalNet: Math.round((totalNet + Number.EPSILON) * 100) / 100,
      employeeCount: payslipIds.length
    };

    await payrun.save();

    return payrun.populate([
      { path: 'salaryStructureId', select: 'name code' },
      { path: 'payslipIds', populate: { path: 'employeeId', select: 'employeeCode firstName lastName department' } }
    ]);
  }

  /**
   * Validate Payrun: COMPUTED -> VALIDATED
   * Executes validation service checks. Prevents invalid state transitions.
   */
  static async validatePayrun(id) {
    const payrun = await Payrun.findById(id);
    if (!payrun) {
      throw new AppError('Payrun not found', 404, 'PAYRUN_NOT_FOUND');
    }

    // State machine check: must be in COMPUTED state
    if (payrun.status === 'DRAFT') {
      throw new AppError(
        'Payrun must be in COMPUTED state before it can be validated. Please compute payrun first.',
        400,
        'INVALID_STATE_TRANSITION',
        { currentStatus: payrun.status, requiredStatus: 'COMPUTED' }
      );
    }
    if (payrun.status === 'PAID') {
      throw new AppError('Payrun has already been paid and closed.', 400, 'ALREADY_PAID');
    }

    // Run Validation Service
    const validationResult = await ValidationService.validatePayrun(id);
    payrun.warnings = validationResult.warnings;

    if (!validationResult.valid) {
      await payrun.save();
      const errorCount = validationResult.warnings.filter((w) => w.severity === 'ERROR').length;
      throw new AppError(
        `Payrun validation failed with ${errorCount} error(s). Resolve errors before validating.`,
        422,
        'VALIDATION_FAILED',
        { validation: validationResult }
      );
    }

    // Transition state
    payrun.status = 'VALIDATED';
    await payrun.save();

    // Transition all payslips to VALIDATED
    await Payslip.updateMany(
      { payrunId: payrun._id, status: 'COMPUTED' },
      { $set: { status: 'VALIDATED' } }
    );

    return {
      message: 'Payrun successfully validated and ready for payment',
      payrun,
      validation: validationResult
    };
  }

  /**
   * Mark Paid: VALIDATED -> PAID
   * STRICT: Only VALIDATED payruns can become PAID.
   * Preserves historical payroll data permanently.
   */
  static async payPayrun(id) {
    const payrun = await Payrun.findById(id);
    if (!payrun) {
      throw new AppError('Payrun not found', 404, 'PAYRUN_NOT_FOUND');
    }

    // State machine check: ONLY VALIDATED payruns can become PAID
    if (payrun.status !== 'VALIDATED') {
      throw new AppError(
        `Cannot pay a payrun in '${payrun.status}' state. Only VALIDATED payruns can become PAID.`,
        400,
        'INVALID_STATE_TRANSITION',
        { currentStatus: payrun.status, requiredStatus: 'VALIDATED' }
      );
    }

    // Transition state to PAID
    payrun.status = 'PAID';
    await payrun.save();

    // Mark all payslips as PAID
    await Payslip.updateMany(
      { payrunId: payrun._id },
      { $set: { status: 'PAID' } }
    );

    return {
      message: 'Payrun successfully finalized and marked as PAID',
      payrun
    };
  }

  /**
   * Send Payslips to employees via bulk email
   */
  static async sendPayslips(id) {
    const payrun = await Payrun.findById(id);
    if (!payrun) {
      throw new AppError('Payrun not found', 404, 'PAYRUN_NOT_FOUND');
    }

    if (payrun.status !== 'PAID' && payrun.status !== 'VALIDATED') {
      throw new AppError(
        `Cannot send payslips for a payrun in '${payrun.status}' state. Payrun must be VALIDATED or PAID.`,
        400,
        'INVALID_STATE'
      );
    }

    const EmailService = require('./email.service');
    return EmailService.sendBulkPayrunPayslips(id);
  }
}

module.exports = PayrunService;
