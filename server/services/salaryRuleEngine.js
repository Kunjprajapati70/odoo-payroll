const AppError = require('../utils/AppError')

/**
 * Safely evaluate a salary formula using known context tokens.
 * Allowed tokens: BASIC, GROSS, ALLOWANCES, DEDUCTIONS, NET, and numbers/operators.
 */
const evaluateFormula = (formula, ctx) => {
  if (!formula || typeof formula !== 'string') {
    throw new AppError('Formula rule is missing a formula expression')
  }

  let expr = formula.trim().toUpperCase()
  const replacements = {
    BASIC: ctx.BASIC ?? 0,
    GROSS: ctx.GROSS ?? 0,
    ALLOWANCES: ctx.ALLOWANCES ?? 0,
    DEDUCTIONS: ctx.DEDUCTIONS ?? 0,
    NET: ctx.NET ?? 0,
  }

  for (const [token, value] of Object.entries(replacements)) {
    expr = expr.replace(new RegExp(`\\b${token}\\b`, 'g'), String(Number(value)))
  }

  if (!/^[\d+\-*/().\s]+$/.test(expr)) {
    throw new AppError(`Invalid or unsafe formula: ${formula}`)
  }

  try {
    // Isolated Function scope — expression already sanitized to math-only chars
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${expr});`)()
    if (typeof result !== 'number' || Number.isNaN(result) || !Number.isFinite(result)) {
      throw new AppError(`Formula produced an invalid result: ${formula}`)
    }
    return roundMoney(result)
  } catch (err) {
    if (err instanceof AppError) throw err
    throw new AppError(`Failed to evaluate formula: ${formula}`)
  }
}

const roundMoney = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100

const normalizeComputationType = (type) => {
  if (type === 'percentage') return 'percentage_of_basic'
  return type
}

/**
 * Compute salary for one employee from ordered salary rules + base wage.
 *
 * @param {Array} rules - salary rule documents (will be sorted by sequence)
 * @param {number} baseWage - contract wage / basic salary input
 * @returns {{
 *   basicSalary: number,
 *   totalAllowances: number,
 *   grossSalary: number,
 *   totalDeductions: number,
 *   netSalary: number,
 *   lines: Array
 * }}
 */
const compute = (rules = [], baseWage = 0) => {
  if (baseWage == null || Number(baseWage) < 0) {
    throw new AppError('Base wage must be a non-negative number')
  }

  const wage = Number(baseWage)
  const sorted = [...rules]
    .filter((r) => r && r.isActive !== false)
    .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))

  if (!sorted.length) {
    throw new AppError('Salary structure has no active rules')
  }

  const ctx = {
    BASIC: 0,
    ALLOWANCES: 0,
    GROSS: 0,
    DEDUCTIONS: 0,
    NET: 0,
  }

  const lines = []
  let basicSet = false

  for (const rule of sorted) {
    const type = normalizeComputationType(rule.computationType)
    let amount = 0

    switch (type) {
      case 'fixed':
        if (rule.category === 'basic') {
          amount = rule.amount > 0 ? Number(rule.amount) : wage
        } else {
          amount = Number(rule.amount) || 0
        }
        break
      case 'percentage_of_basic':
        amount = roundMoney(ctx.BASIC * (Number(rule.percentage) || 0) / 100)
        break
      case 'percentage_of_gross':
        amount = roundMoney(ctx.GROSS * (Number(rule.percentage) || 0) / 100)
        break
      case 'formula':
        amount = evaluateFormula(rule.formula, ctx)
        break
      default:
        throw new AppError(`Unsupported computation type: ${rule.computationType}`)
    }

    amount = roundMoney(amount)

    // Update running context by category
    switch (rule.category) {
      case 'basic':
        ctx.BASIC = amount
        basicSet = true
        ctx.GROSS = roundMoney(ctx.BASIC + ctx.ALLOWANCES)
        break
      case 'allowance':
        ctx.ALLOWANCES = roundMoney(ctx.ALLOWANCES + amount)
        ctx.GROSS = roundMoney(ctx.BASIC + ctx.ALLOWANCES)
        break
      case 'gross':
        ctx.GROSS = amount
        break
      case 'deduction':
      case 'tax':
        ctx.DEDUCTIONS = roundMoney(ctx.DEDUCTIONS + amount)
        break
      case 'net':
        ctx.NET = amount
        break
      default:
        break
    }

    // Keep net in sync after deductions unless an explicit NET rule will override later
    if (rule.category !== 'net') {
      ctx.NET = roundMoney(ctx.GROSS - ctx.DEDUCTIONS)
    }

    if (rule.appears_on_payslip !== false) {
      lines.push({
        salaryRule: rule._id,
        name: rule.name,
        code: rule.code,
        category: rule.category === 'tax' ? 'deduction' : rule.category,
        amount,
        sequence: rule.sequence ?? 0,
      })
    }
  }

  if (!basicSet) {
    ctx.BASIC = wage
    ctx.GROSS = roundMoney(ctx.BASIC + ctx.ALLOWANCES)
    ctx.NET = roundMoney(ctx.GROSS - ctx.DEDUCTIONS)
  }

  return {
    basicSalary: roundMoney(ctx.BASIC),
    totalAllowances: roundMoney(ctx.ALLOWANCES),
    grossSalary: roundMoney(ctx.GROSS),
    totalDeductions: roundMoney(ctx.DEDUCTIONS),
    netSalary: roundMoney(ctx.NET),
    lines,
  }
}

module.exports = { compute, evaluateFormula, roundMoney }
