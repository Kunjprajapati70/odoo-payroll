const Payrun = require('../models/Payrun')
const Payslip = require('../models/Payslip')
const PayslipLine = require('../models/PayslipLine')
const Employee = require('../models/Employee')
const AppError = require('../utils/AppError')
const { calculateEmployeePayroll } = require('./payrollService')
const { sendPayslipEmail } = require('./emailService')

/**
 * Compute a draft payrun:
 * - validate employees & contracts
 * - calculate salaries via engine
 * - create payslips + lines (snapshot)
 * - set status to computed
 */
const computePayrun = async (payrunId, userId) => {
  const payrun = await Payrun.findById(payrunId)
  if (!payrun) throw new AppError('Payrun not found', 404)
  if (payrun.status !== 'draft') {
    throw new AppError(`Only draft payruns can be computed (current: ${payrun.status})`)
  }
  if (new Date(payrun.periodEnd) < new Date(payrun.periodStart)) {
    throw new AppError('periodEnd must be on or after periodStart')
  }

  const employeeIds = payrun.employees?.length
    ? payrun.employees
    : (await Employee.find({ status: 'active' }).select('_id')).map((e) => e._id)

  if (!employeeIds.length) {
    throw new AppError('No employees selected for this payrun')
  }

  // Clear any previous draft slips if re-computing after failed attempt
  const existing = await Payslip.find({ payrun: payrun._id })
  if (existing.length) {
    const ids = existing.map((p) => p._id)
    await PayslipLine.deleteMany({ payslip: { $in: ids } })
    await Payslip.deleteMany({ payrun: payrun._id })
  }

  const employees = await Employee.find({ _id: { $in: employeeIds }, status: 'active' })
  const errors = []
  const createdPayslips = []

  let totalGross = 0
  let totalNet = 0
  let totalAllowances = 0
  let totalDeductions = 0

  for (const employee of employees) {
    try {
      const calc = await calculateEmployeePayroll({
        employee,
        periodStart: payrun.periodStart,
        periodEnd: payrun.periodEnd,
        salaryStructureId: payrun.salaryStructure,
      })

      const payslip = await Payslip.create({
        payrun: payrun._id,
        employee: employee._id,
        contract: calc.contract,
        salaryStructure: calc.salaryStructure,
        periodStart: payrun.periodStart,
        periodEnd: payrun.periodEnd,
        basicSalary: calc.basicSalary,
        totalAllowances: calc.totalAllowances,
        grossSalary: calc.grossSalary,
        totalDeductions: calc.totalDeductions,
        netSalary: calc.netSalary,
        status: 'done',
        breakdown: calc.lines.map((l) => ({
          name: l.name,
          code: l.code,
          category: l.category,
          amount: l.amount,
          sequence: l.sequence,
        })),
      })

      const lineDocs = await PayslipLine.insertMany(
        calc.lines.map((l) => ({
          payslip: payslip._id,
          salaryRule: l.salaryRule,
          name: l.name,
          code: l.code,
          category: l.category,
          amount: l.amount,
          sequence: l.sequence,
        }))
      )

      payslip.lines = lineDocs.map((d) => d._id)
      await payslip.save()

      createdPayslips.push(payslip)
      totalGross += calc.grossSalary
      totalNet += calc.netSalary
      totalAllowances += calc.totalAllowances
      totalDeductions += calc.totalDeductions
    } catch (err) {
      errors.push({
        employeeId: employee.employeeId || String(employee._id),
        name: `${employee.firstName} ${employee.lastName}`,
        message: err.message,
      })
    }
  }

  if (!createdPayslips.length) {
    throw new AppError(
      `Payroll computation failed for all employees. ${errors.map((e) => e.message).join('; ')}`
    )
  }

  payrun.status = 'computed'
  payrun.totalGross = Math.round(totalGross * 100) / 100
  payrun.totalNet = Math.round(totalNet * 100) / 100
  payrun.totalAllowances = Math.round(totalAllowances * 100) / 100
  payrun.totalDeductions = Math.round(totalDeductions * 100) / 100
  payrun.employeeCount = createdPayslips.length
  payrun.employees = createdPayslips.map((p) => p.employee)
  await payrun.save()

  return { payrun, payslips: createdPayslips, errors }
}

const validatePayrun = async (payrunId, userId) => {
  const payrun = await Payrun.findById(payrunId)
  if (!payrun) throw new AppError('Payrun not found', 404)
  if (payrun.status !== 'computed') {
    throw new AppError(`Only computed payruns can be validated (current: ${payrun.status})`)
  }

  const count = await Payslip.countDocuments({ payrun: payrun._id })
  if (!count) throw new AppError('Cannot validate a payrun with no payslips')

  payrun.status = 'validated'
  payrun.validatedBy = userId
  payrun.validatedAt = new Date()
  payrun.approvedBy = userId
  payrun.approvedAt = new Date()
  await payrun.save()
  return payrun
}

const markPaid = async (payrunId) => {
  const payrun = await Payrun.findById(payrunId)
  if (!payrun) throw new AppError('Payrun not found', 404)
  if (payrun.status !== 'validated') {
    throw new AppError(`Only validated payruns can be marked paid (current: ${payrun.status})`)
  }

  payrun.status = 'paid'
  payrun.paidAt = new Date()
  await payrun.save()

  await Payslip.updateMany({ payrun: payrun._id }, { $set: { status: 'paid' } })
  return payrun
}

const cancelPayrun = async (payrunId) => {
  const payrun = await Payrun.findById(payrunId)
  if (!payrun) throw new AppError('Payrun not found', 404)
  if (payrun.status === 'paid') {
    throw new AppError('Paid payruns cannot be cancelled')
  }
  if (payrun.status === 'cancelled') return payrun

  payrun.status = 'cancelled'
  await payrun.save()
  return payrun
}

const sendPayslips = async (payrunId) => {
  const payrun = await Payrun.findById(payrunId)
  if (!payrun) throw new AppError('Payrun not found', 404)
  if (!['validated', 'paid'].includes(payrun.status)) {
    throw new AppError('Payslips can only be sent after the payrun is validated')
  }

  const payslips = await Payslip.find({ payrun: payrunId })
    .populate('employee')
    .populate('lines')

  const results = []
  for (const slip of payslips) {
    try {
      await sendPayslipEmail(slip)
      results.push({ payslipId: slip._id, status: 'sent' })
    } catch (err) {
      results.push({ payslipId: slip._id, status: 'failed', message: err.message })
    }
  }
  return { payrun, results }
}

module.exports = {
  computePayrun,
  validatePayrun,
  markPaid,
  cancelPayrun,
  sendPayslips,
}
