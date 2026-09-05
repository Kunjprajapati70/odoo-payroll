/**
 * Demo seed data for PeoplePay360.
 * Used by seed.js to populate local MongoDB for development.
 */

const departments = [
  { name: 'Engineering', code: 'ENG' },
  { name: 'Human Resources', code: 'HR' },
  { name: 'Finance', code: 'FIN' },
  { name: 'Operations', code: 'OPS' },
  { name: 'Sales', code: 'SALES' },
]

const users = [
  { name: 'Admin User', email: 'admin@peoplepay360.com', password: 'Admin@123', role: 'admin' },
  { name: 'HR Manager', email: 'hr@peoplepay360.com', password: 'Hr@123456', role: 'hr_manager' },
  { name: 'Payroll Manager', email: 'payroll@peoplepay360.com', password: 'Pay@12345', role: 'payroll_manager' },
]

const workingSchedules = [
  {
    name: 'Standard 40h',
    hoursPerWeek: 40,
    workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    startTime: '09:00',
    endTime: '17:00',
    isDefault: true,
  },
]

const timeOffTypes = [
  { name: 'Annual Leave', code: 'AL', defaultDays: 20, isPaid: true, requiresApproval: true, color: '#6366f1' },
  { name: 'Sick Leave', code: 'SL', defaultDays: 10, isPaid: true, requiresApproval: false, color: '#ef4444' },
  { name: 'Unpaid Leave', code: 'UL', defaultDays: 0, isPaid: false, requiresApproval: true, color: '#94a3b8' },
]

const salaryRules = [
  { name: 'Basic Salary', code: 'BASIC', category: 'basic', computationType: 'fixed', sequence: 1 },
  { name: 'Housing Allowance', code: 'HRA', category: 'allowance', computationType: 'percentage_of_basic', percentage: 20, sequence: 2 },
  { name: 'Transport Allowance', code: 'TA', category: 'allowance', computationType: 'fixed', amount: 200, sequence: 3 },
  { name: 'Income Tax', code: 'TAX', category: 'deduction', computationType: 'percentage_of_gross', percentage: 10, sequence: 10 },
  { name: 'Social Security', code: 'SS', category: 'deduction', computationType: 'percentage_of_basic', percentage: 5, sequence: 11 },
  { name: 'Net Salary', code: 'NET', category: 'net', computationType: 'formula', formula: 'GROSS - DEDUCTIONS', sequence: 99 },
]

module.exports = { departments, users, workingSchedules, timeOffTypes, salaryRules }
