const Contract = require('../models/Contract')
const SalaryStructure = require('../models/SalaryStructure')
const AppError = require('../utils/AppError')
const { compute } = require('./salaryRuleEngine')

/**
 * Find the contract applicable to an employee for a payroll period.
 * Must be active (or not terminated) and cover the period start date.
 */
const findApplicableContract = async (employeeId, periodStart, periodEnd) => {
  const start = new Date(periodStart)
  const end = new Date(periodEnd)

  const contract = await Contract.findOne({
    employee: employeeId,
    status: { $in: ['active'] },
    startDate: { $lte: end },
    $or: [
      { endDate: null },
      { endDate: { $exists: false } },
      { endDate: { $gte: start } },
    ],
  })
    .populate({
      path: 'salaryStructure',
      populate: { path: 'rules' },
    })
    .sort({ startDate: -1 })

  return contract
}

/**
 * Calculate payroll for one employee for a given period.
 */
const calculateEmployeePayroll = async ({
  employee,
  periodStart,
  periodEnd,
  salaryStructureId,
}) => {
  const empId = employee._id || employee
  let contract = await findApplicableContract(empId, periodStart, periodEnd)

  // Auto-create/repair contract for manually added employees so payrun doesn't fail
  if (!contract) {
    const { ensureContractForEmployee } = require('./employeeLinkService')
    await ensureContractForEmployee(empId)
    contract = await findApplicableContract(empId, periodStart, periodEnd)
  }

  if (!contract) {
    throw new AppError(
      `No valid active contract for employee ${employee.employeeId || empId} covering the payroll period`
    )
  }

  let structure = contract.salaryStructure
  if (salaryStructureId) {
    structure = await SalaryStructure.findById(salaryStructureId).populate('rules')
  }
  if (!structure) {
    throw new AppError('Contract is missing a salary structure')
  }
  if (!structure.isActive) {
    throw new AppError(`Salary structure ${structure.code} is inactive`)
  }

  const rules = structure.rules || []
  const wage = contract.wage ?? contract.salary ?? 0
  if (!wage && wage !== 0) {
    throw new AppError('Contract wage/salary is required for payroll calculation')
  }

  const result = compute(rules, wage)

  return {
    employee: employee._id || employee,
    contract: contract._id,
    salaryStructure: structure._id,
    ...result,
  }
}

module.exports = {
  findApplicableContract,
  calculateEmployeePayroll,
}
