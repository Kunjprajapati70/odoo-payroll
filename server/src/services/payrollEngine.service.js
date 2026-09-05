const Employee = require('../models/Employee');
const Contract = require('../models/Contract');
const Payrun = require('../models/Payrun');
const SalaryStructure = require('../models/SalaryStructure');
const SalaryRule = require('../models/SalaryRule');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const ContractService = require('./contract.service');
const SalaryRuleService = require('./salaryRule.service');
const SafeCalculator = require('../utils/safeCalculator.util');
const { AppError } = require('../utils/response.util');

class PayrollEngineService {
  // ==========================================
  // UNIT-TESTABLE RULE CALCULATION METHODS
  // ==========================================

  /**
   * Calculate a FIXED salary rule
   * @param {Object} rule - Salary rule definition
   * @returns {number} Evaluated amount rounded to 2 decimal places
   */
  static calculateFixedRule(rule) {
    if (!rule) throw new AppError('Rule definition is required', 422, 'INVALID_RULE');
    const amount = Number(rule.value) || 0;
    return Math.round((amount + Number.EPSILON) * 100) / 100;
  }

  /**
   * Calculate a PERCENTAGE salary rule against context
   * @param {Object} rule - Salary rule definition with baseCode and value
   * @param {Object} context - Calculation context containing evaluated rules and variables
   * @returns {number} Evaluated amount rounded to 2 decimal places
   */
  static calculatePercentageRule(rule, context = {}) {
    if (!rule) throw new AppError('Rule definition is required', 422, 'INVALID_RULE');

    const baseCode = (rule.baseCode || 'contract.salary').trim();
    if (!baseCode) {
      throw new AppError(`Rule '${rule.code}' is missing baseCode for percentage calculation`, 422, 'MISSING_BASE_CODE', { rule: rule.code });
    }

    const upperBase = baseCode.toUpperCase();
    let baseValue = 0;

    if (upperBase === 'CONTRACT.SALARY' || upperBase === 'CONTRACT.WAGE' || upperBase === 'SALARY' || upperBase === 'WAGE') {
      baseValue = Number(context.salary || context.wage || context['CONTRACT.SALARY'] || (context.contract && (context.contract.salary || context.contract.wage))) || 0;
    } else if (upperBase in context) {
      baseValue = Number(context[upperBase]) || 0;
    } else if (baseCode in context) {
      baseValue = Number(context[baseCode]) || 0;
    } else {
      throw new AppError(
        `Rule '${rule.code}' depends on baseCode '${baseCode}', which was not found in calculation context`,
        422,
        'INVALID_BASE_CODE',
        { rule: rule.code, baseCode }
      );
    }

    const percentage = Number(rule.value) || 0;
    const amount = (baseValue * percentage) / 100;
    return Math.round((amount + Number.EPSILON) * 100) / 100;
  }

  /**
   * Calculate a FORMULA salary rule safely using SafeCalculator (Zero-Eval)
   * @param {Object} rule - Salary rule definition with formula
   * @param {Object} context - Calculation context
   * @returns {number} Evaluated amount rounded to 2 decimal places
   */
  static calculateFormulaRule(rule, context = {}) {
    if (!rule) throw new AppError('Rule definition is required', 422, 'INVALID_RULE');

    const formula = (rule.formula || '').trim();
    if (!formula) {
      throw new AppError(`Rule '${rule.code}' has an empty formula`, 422, 'INVALID_FORMULA', { rule: rule.code });
    }

    try {
      const result = SafeCalculator.evaluate(formula, context);
      return Math.round((Number(result) + Number.EPSILON) * 100) / 100;
    } catch (err) {
      throw new AppError(
        `Failed to evaluate formula for rule '${rule.code}': ${err.message}`,
        422,
        'INVALID_FORMULA',
        { rule: rule.code, formula, error: err.message }
      );
    }
  }

  /**
   * Calculate Gross Total from evaluated lines or explicit GROSS rule
   * @param {Array} lines - Evaluated payslip lines
   * @param {number|null} explicitGross - Optional gross calculated from explicit GROSS rule
   * @returns {number}
   */
  static calculateGross(lines = [], explicitGross = null) {
    if (explicitGross !== null && explicitGross !== undefined && !isNaN(explicitGross)) {
      return Math.round((Number(explicitGross) + Number.EPSILON) * 100) / 100;
    }

    let total = 0;
    for (const line of lines) {
      if (line.category === 'BASIC' || line.category === 'ALLOWANCE') {
        total += Number(line.amount) || 0;
      }
    }
    return Math.round((total + Number.EPSILON) * 100) / 100;
  }

  /**
   * Calculate Total Deductions from evaluated lines
   * @param {Array} lines - Evaluated payslip lines
   * @returns {number}
   */
  static calculateDeductions(lines = []) {
    let total = 0;
    for (const line of lines) {
      if (line.category === 'DEDUCTION') {
        total += Number(line.amount) || 0;
      }
    }
    return Math.round((total + Number.EPSILON) * 100) / 100;
  }

  /**
   * Calculate Net Pay from gross, deductions, or explicit NET rule
   * @param {number} gross
   * @param {number} deductions
   * @param {number|null} explicitNet - Optional net calculated from explicit NET rule
   * @returns {number}
   */
  static calculateNet(gross, deductions, explicitNet = null) {
    if (explicitNet !== null && explicitNet !== undefined && !isNaN(explicitNet)) {
      return Math.round((Number(explicitNet) + Number.EPSILON) * 100) / 100;
    }

    const net = (Number(gross) || 0) - (Number(deductions) || 0);
    return Math.round((net + Number.EPSILON) * 100) / 100;
  }

  // ==========================================
  // CONTEXT & ATTENDANCE AGGREGATION HELPERS
  // ==========================================

  /**
   * Aggregate attendance records for an employee during the payrun period
   */
  static async aggregateAttendance(employeeId, periodStart, periodEnd) {
    const records = await Attendance.find({
      employeeId,
      date: { $gte: new Date(periodStart), $lte: new Date(periodEnd) }
    });

    let workedDays = 0;
    let workedMinutes = 0;
    let scheduledMinutes = 0;
    let overtimeMinutes = 0;

    for (const rec of records) {
      if (rec.status === 'PRESENT') workedDays += 1;
      else if (rec.status === 'HALF_DAY') workedDays += 0.5;

      workedMinutes += Number(rec.workedMinutes) || 0;
      scheduledMinutes += Number(rec.scheduledMinutes) || 0;
      overtimeMinutes += Number(rec.overtimeMinutes) || 0;
    }

    return {
      workedDays,
      workedHours: Math.round(((workedMinutes / 60) + Number.EPSILON) * 100) / 100,
      scheduledHours: Math.round(((scheduledMinutes / 60) + Number.EPSILON) * 100) / 100,
      overtimeHours: Math.round(((overtimeMinutes / 60) + Number.EPSILON) * 100) / 100
    };
  }

  /**
   * Aggregate approved leaves for an employee during the payrun period
   */
  static async aggregateLeaves(employeeId, periodStart, periodEnd) {
    const leaves = await LeaveRequest.find({
      employeeId,
      status: 'APPROVED',
      startDate: { $lte: new Date(periodEnd) },
      endDate: { $gte: new Date(periodStart) }
    }).populate('timeOffTypeId');

    let paidLeaves = 0;
    let unpaidLeaves = 0;
    let halfPaidLeaves = 0;

    for (const leave of leaves) {
      const integration = leave.timeOffTypeId?.payrollIntegration || 'PAID';
      const duration = Number(leave.duration) || 0;

      if (integration === 'PAID') paidLeaves += duration;
      else if (integration === 'UNPAID') unpaidLeaves += duration;
      else if (integration === 'HALF_PAID') halfPaidLeaves += duration;
    }

    return {
      paidLeaves,
      unpaidLeaves,
      halfPaidLeaves
    };
  }

  // ==========================================
  // MAIN CORE PAYROLL ENGINE CALCULATION
  // ==========================================

  /**
   * Compute complete payslip calculation for an employee in a payrun
   * @param {Object} params
   * @param {string|ObjectId} params.employeeId - Employee ID or pre-loaded employee object
   * @param {string|ObjectId} params.payrunId - Payrun ID or pre-loaded payrun object
   * @param {Object} [params.options] - Optional pre-loaded models (contract, salaryStructure, etc.)
   * @returns {Promise<Object>} Detailed calculation result with lines and totals
   */
  static async computePayslip({ employeeId, payrunId, options = {} }) {
    // 1. Load Employee
    let employee = options.employee;
    const empId = employee ? employee._id : (employeeId?._id || employeeId);
    if (!employee) {
      if (!empId) throw new AppError('employeeId is required for payslip computation', 422, 'VALIDATION_ERROR');
      employee = await Employee.findById(empId);
      if (!employee) {
        throw new AppError(`Employee with ID '${empId}' not found`, 404, 'EMPLOYEE_NOT_FOUND', { employeeId: empId });
      }
    }

    // 2. Load Payrun
    let payrun = options.payrun;
    const prId = payrun ? payrun._id : (payrunId?._id || payrunId);
    if (!payrun) {
      if (!prId) throw new AppError('payrunId is required for payslip computation', 422, 'VALIDATION_ERROR');
      payrun = await Payrun.findById(prId);
      if (!payrun) {
        throw new AppError(`Payrun with ID '${prId}' not found`, 404, 'PAYRUN_NOT_FOUND', { payrunId: prId });
      }
    }

    const periodStart = payrun.periodStart || payrun.startDate;
    const periodEnd = payrun.periodEnd || payrun.endDate;
    if (!periodStart || !periodEnd) {
      throw new AppError('Payrun is missing periodStart or periodEnd dates', 422, 'INVALID_PAYRUN_PERIOD');
    }

    // 3. Find applicable contract for period (handles missing contract and 409 conflict)
    let contract = options.contract;
    if (!contract) {
      contract = await ContractService.findApplicableContract(empId, periodStart, periodEnd);
      if (!contract) {
        throw new AppError(
          `No active or applicable contract found for employee '${employee.firstName} ${employee.lastName}' (${employee.employeeCode}) in period ${new Date(periodStart).toISOString().slice(0, 10)} to ${new Date(periodEnd).toISOString().slice(0, 10)}`,
          404,
          'MISSING_CONTRACT',
          { employeeId: empId, periodStart, periodEnd }
        );
      }
    }

    // 4. Load Salary Structure (from payrun or contract)
    const structureId = payrun.salaryStructureId || contract.salaryStructureId;
    if (!structureId) {
      throw new AppError(
        `No salary structure defined on payrun '${payrun.name}' or contract for employee '${employee.employeeCode}'`,
        422,
        'MISSING_SALARY_STRUCTURE',
        { employeeId: empId, payrunId: prId }
      );
    }

    let structure = options.salaryStructure;
    if (!structure || structure._id?.toString() !== structureId.toString()) {
      structure = await SalaryStructure.findById(structureId);
      if (!structure) {
        throw new AppError(
          `Salary structure '${structureId}' referenced by payrun/contract was not found`,
          404,
          'STRUCTURE_NOT_FOUND',
          { salaryStructureId: structureId }
        );
      }
    }

    // 5 & 6. Load all active salary rules and sort by sequence ascending
    const ruleIds = structure.ruleIds || [];
    if (!Array.isArray(ruleIds) || ruleIds.length === 0) {
      throw new AppError(
        `Salary structure '${structure.name}' does not contain any salary rules`,
        422,
        'NO_SALARY_RULES',
        { structureId: structure._id, structureName: structure.name }
      );
    }

    const sortedRules = await SalaryRuleService.getRulesSortedBySequence(ruleIds, true);
    if (!sortedRules || sortedRules.length === 0) {
      throw new AppError(
        `No active rules found for salary structure '${structure.name}'`,
        422,
        'NO_SALARY_RULES',
        { structureId: structure._id }
      );
    }

    // 7. Aggregate Attendance & Leaves for context
    const [attendanceTotals, leaveTotals] = await Promise.all([
      PayrollEngineService.aggregateAttendance(empId, periodStart, periodEnd),
      PayrollEngineService.aggregateLeaves(empId, periodStart, periodEnd)
    ]);

    // Calculate total calendar days in payrun period
    const msPerDay = 1000 * 60 * 60 * 24;
    const totalDaysInPeriod = Math.round((new Date(periodEnd).getTime() - new Date(periodStart).getTime()) / msPerDay) + 1;
    const workingDays = totalDaysInPeriod >= 28 ? 30 : totalDaysInPeriod; // Standard monthly basis

    const wage = Number(contract.salary || contract.wage) || 0;

    // Build controlled payroll calculation context
    const context = {
      employee: {
        _id: employee._id,
        employeeCode: employee.employeeCode,
        firstName: employee.firstName,
        lastName: employee.lastName,
        department: employee.department
      },
      contract: {
        _id: contract._id,
        salary: wage,
        wage: wage
      },
      payrun: {
        _id: payrun._id,
        name: payrun.name,
        periodStart,
        periodEnd
      },
      wage,
      salary: wage,
      'CONTRACT.SALARY': wage,
      'CONTRACT.WAGE': wage,
      worked_days: attendanceTotals.workedDays,
      worked_hours: attendanceTotals.workedHours,
      scheduled_hours: attendanceTotals.scheduledHours,
      overtime_hours: attendanceTotals.overtimeHours,
      working_days: workingDays,
      paid_leaves: leaveTotals.paidLeaves,
      unpaid_leaves: leaveTotals.unpaidLeaves,
      half_paid_leaves: leaveTotals.halfPaidLeaves
    };

    // 8 & 9. Execute each rule sequentially and record lines
    const lines = [];
    let explicitGross = null;
    let explicitNet = null;

    for (const rule of sortedRules) {
      let amount = 0;

      switch (rule.calculationType) {
        case 'FIXED':
          amount = PayrollEngineService.calculateFixedRule(rule);
          break;
        case 'PERCENTAGE':
          amount = PayrollEngineService.calculatePercentageRule(rule, context);
          break;
        case 'FORMULA':
          amount = PayrollEngineService.calculateFormulaRule(rule, context);
          break;
        default:
          throw new AppError(`Unknown calculationType '${rule.calculationType}' for rule '${rule.code}'`, 422, 'INVALID_RULE');
      }

      const lineItem = {
        ruleId: rule._id,
        name: rule.name,
        code: rule.code.toUpperCase(),
        category: rule.category,
        sequence: rule.sequence,
        calculationType: rule.calculationType,
        rate: rule.calculationType === 'PERCENTAGE' ? rule.value : 0,
        amount
      };

      lines.push(lineItem);

      // Add rule result into runtime context for subsequent dependent rules
      context[rule.code] = amount;
      context[rule.code.toUpperCase()] = amount;

      if (rule.category === 'GROSS') explicitGross = amount;
      if (rule.category === 'NET') explicitNet = amount;
    }

    // 10. Calculate basic, allowances, gross, deductions, net totals
    let basicTotal = 0;
    let allowancesTotal = 0;

    for (const line of lines) {
      if (line.category === 'BASIC') basicTotal += line.amount;
      else if (line.category === 'ALLOWANCE') allowancesTotal += line.amount;
    }

    basicTotal = Math.round((basicTotal + Number.EPSILON) * 100) / 100;
    allowancesTotal = Math.round((allowancesTotal + Number.EPSILON) * 100) / 100;

    const grossTotal = PayrollEngineService.calculateGross(lines, explicitGross);
    const deductionsTotal = PayrollEngineService.calculateDeductions(lines);
    const netTotal = PayrollEngineService.calculateNet(grossTotal, deductionsTotal, explicitNet);

    // 12. Return complete payslip calculation result
    return {
      employeeId: empId,
      payrunId: prId,
      contractId: contract._id,
      salaryStructureId: structure._id,
      periodStart,
      periodEnd,
      workedDays: attendanceTotals.workedDays,
      workedHours: attendanceTotals.workedHours,
      lines,
      totals: {
        basic: basicTotal,
        allowances: allowancesTotal,
        gross: grossTotal,
        deductions: deductionsTotal,
        net: netTotal
      },
      attendanceSummary: {
        ...attendanceTotals,
        ...leaveTotals
      },
      employeeSnapshot: {
        employeeCode: employee.employeeCode,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        department: employee.department,
        jobPosition: employee.jobPosition
      },
      contractSnapshot: {
        startDate: contract.startDate,
        endDate: contract.endDate,
        salary: wage,
        department: contract.department,
        jobPosition: contract.jobPosition
      }
    };
  }
}

module.exports = PayrollEngineService;
