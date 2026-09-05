/**
 * Smoke test for salary rule engine (no MongoDB required).
 * Run: node tests/salaryRuleEngine.smoke.js
 */
const { compute } = require('../services/salaryRuleEngine')

const rules = [
  { _id: '1', name: 'Basic Salary', code: 'BASIC', category: 'basic', computationType: 'fixed', amount: 0, sequence: 1 },
  { _id: '2', name: 'Housing Allowance', code: 'HRA', category: 'allowance', computationType: 'percentage_of_basic', percentage: 20, sequence: 2 },
  { _id: '3', name: 'Transport Allowance', code: 'TA', category: 'allowance', computationType: 'fixed', amount: 200, sequence: 3 },
  { _id: '4', name: 'Income Tax', code: 'TAX', category: 'deduction', computationType: 'percentage_of_gross', percentage: 10, sequence: 10 },
  { _id: '5', name: 'Social Security', code: 'SS', category: 'deduction', computationType: 'percentage_of_basic', percentage: 5, sequence: 11 },
  { _id: '6', name: 'Net Salary', code: 'NET', category: 'net', computationType: 'formula', formula: 'GROSS - DEDUCTIONS', sequence: 99 },
]

const result = compute(rules, 5000)

// Expected:
// BASIC = 5000
// HRA = 1000
// TA = 200
// ALLOWANCES = 1200
// GROSS = 6200
// TAX = 620
// SS = 250
// DEDUCTIONS = 870
// NET = 5330

const assert = (cond, msg) => {
  if (!cond) throw new Error(msg)
}

assert(result.basicSalary === 5000, `basic expected 5000 got ${result.basicSalary}`)
assert(result.totalAllowances === 1200, `allowances expected 1200 got ${result.totalAllowances}`)
assert(result.grossSalary === 6200, `gross expected 6200 got ${result.grossSalary}`)
assert(result.totalDeductions === 870, `deductions expected 870 got ${result.totalDeductions}`)
assert(result.netSalary === 5330, `net expected 5330 got ${result.netSalary}`)
assert(result.lines.length === 6, `expected 6 lines got ${result.lines.length}`)

console.log('salaryRuleEngine smoke test PASSED')
console.log(JSON.stringify(result, null, 2))
