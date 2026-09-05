const Employee = require('../models/Employee');
const Contract = require('../models/Contract');
const Payrun = require('../models/Payrun');
const Payslip = require('../models/Payslip');
const SalaryStructure = require('../models/SalaryStructure');
const ContractService = require('./contract.service');
const SalaryRuleService = require('./salaryRule.service');
const PayrollEngineService = require('./payrollEngine.service');
const { AppError } = require('../utils/response.util');

class ValidationService {
  /**
   * Validate a single employee for a payrun period
   * @param {Object|string} employeeOrId - Employee document or ID
   * @param {Object} payrun - Payrun document
   * @returns {Promise<Array>} List of warnings/errors
   */
  static async validateEmployeeForPayrun(employeeOrId, payrun) {
    const warnings = [];
    const empId = employeeOrId?._id || employeeOrId;

    // 1. Employee exists
    let employee = employeeOrId;
    if (!employee || !employee.employeeCode) {
      employee = await Employee.findById(empId);
    }

    if (!employee) {
      warnings.push({
        severity: 'ERROR',
        code: 'EMPLOYEE_NOT_FOUND',
        employeeId: empId,
        message: `Employee with ID '${empId}' was not found in the system`
      });
      return warnings;
    }

    // 2. Employee active
    if (employee.status !== 'ACTIVE') {
      warnings.push({
        severity: 'ERROR',
        code: 'EMPLOYEE_NOT_ACTIVE',
        employeeId: empId,
        message: `Employee '${employee.firstName} ${employee.lastName}' (${employee.employeeCode}) is not ACTIVE (current status: ${employee.status})`
      });
    }

    // 3. Bank details
    const bank = employee.bankDetails || {};
    if (!bank.accountNumber || !bank.ifscCode) {
      warnings.push({
        severity: 'WARNING',
        code: 'MISSING_BANK_DETAILS',
        employeeId: empId,
        message: `Employee '${employee.firstName} ${employee.lastName}' (${employee.employeeCode}) is missing bank account or IFSC details`
      });
    }

    // 4. Contract exists & contract conflict
    let contract = null;
    try {
      contract = await ContractService.findApplicableContract(empId, payrun.periodStart, payrun.periodEnd);
      if (!contract) {
        warnings.push({
          severity: 'ERROR',
          code: 'MISSING_CONTRACT',
          employeeId: empId,
          message: `No active or applicable contract found for employee '${employee.employeeCode}' in payrun period`
        });
      }
    } catch (err) {
      if (err.code === 'CONTRACT_CONFLICT') {
        warnings.push({
          severity: 'ERROR',
          code: 'CONTRACT_CONFLICT',
          employeeId: empId,
          message: err.message
        });
      } else {
        warnings.push({
          severity: 'ERROR',
          code: 'CONTRACT_ERROR',
          employeeId: empId,
          message: err.message
        });
      }
    }

    // 5. Duplicate payslip in another payrun for same period
    const duplicatePayslip = await Payslip.findOne({
      employeeId: empId,
      payrunId: { $ne: payrun._id },
      periodStart: payrun.periodStart,
      periodEnd: payrun.periodEnd,
      status: { $ne: 'CANCELLED' }
    });

    if (duplicatePayslip) {
      warnings.push({
        severity: 'ERROR',
        code: 'DUPLICATE_PAYSLIP',
        employeeId: empId,
        message: `Employee '${employee.employeeCode}' already has an active payslip in another payrun for period ${new Date(payrun.periodStart).toISOString().slice(0, 10)} to ${new Date(payrun.periodEnd).toISOString().slice(0, 10)}`
      });
    }

    // 6. Test calculation / formula evaluation
    if (contract && employee.status === 'ACTIVE') {
      try {
        await PayrollEngineService.computePayslip({
          employeeId: empId,
          payrunId: payrun._id,
          options: { employee, payrun, contract }
        });
      } catch (err) {
        warnings.push({
          severity: 'ERROR',
          code: 'INVALID_CALCULATION',
          employeeId: empId,
          message: `Payroll calculation failed for '${employee.employeeCode}': ${err.message}`
        });
      }
    }

    return warnings;
  }

  /**
   * Validate complete payrun before state transition to VALIDATED
   * @param {string|Object} payrunOrId - Payrun ID or document
   * @returns {Promise<Object>} { valid: boolean, warnings: Array }
   */
  static async validatePayrun(payrunOrId) {
    let payrun = payrunOrId;
    if (!payrun || !payrun.salaryStructureId) {
      payrun = await Payrun.findById(payrunOrId).populate('salaryStructureId');
    }

    if (!payrun) {
      throw new AppError('Payrun not found', 404, 'PAYRUN_NOT_FOUND');
    }

    const allWarnings = [];

    // 1. Validate Structure & Rules
    const structureId = payrun.salaryStructureId?._id || payrun.salaryStructureId;
    if (!structureId) {
      allWarnings.push({
        severity: 'ERROR',
        code: 'MISSING_SALARY_STRUCTURE',
        employeeId: null,
        message: 'Payrun has no salary structure attached'
      });
    } else {
      const structure = await SalaryStructure.findById(structureId);
      if (!structure) {
        allWarnings.push({
          severity: 'ERROR',
          code: 'STRUCTURE_NOT_FOUND',
          employeeId: null,
          message: 'Referenced salary structure was not found'
        });
      } else {
        const ruleIds = structure.ruleIds || [];
        if (ruleIds.length === 0) {
          allWarnings.push({
            severity: 'ERROR',
            code: 'NO_SALARY_RULES',
            employeeId: null,
            message: `Salary structure '${structure.name}' contains no rules`
          });
        }
      }
    }

    // 2. Validate Selected Employees
    const employeeIds = payrun.employeeIds || [];
    if (employeeIds.length === 0) {
      allWarnings.push({
        severity: 'ERROR',
        code: 'NO_EMPLOYEES_SELECTED',
        employeeId: null,
        message: 'Payrun has no employees selected'
      });
    } else {
      for (const empId of employeeIds) {
        const empWarnings = await ValidationService.validateEmployeeForPayrun(empId, payrun);
        allWarnings.push(...empWarnings);
      }
    }

    // Determine overall validity (false if any ERROR severity exists)
    const hasErrors = allWarnings.some((w) => w.severity === 'ERROR');

    return {
      valid: !hasErrors,
      warnings: allWarnings
    };
  }
}

module.exports = ValidationService;
