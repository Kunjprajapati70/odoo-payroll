/**
 * Demo seed data for PeoplePay360 (local MongoDB).
 */

const departments = [
  { name: 'Engineering', code: 'ENG', description: 'Product engineering' },
  { name: 'Human Resources', code: 'HR', description: 'People operations' },
  { name: 'Finance', code: 'FIN', description: 'Finance & accounting' },
  { name: 'Operations', code: 'OPS', description: 'Business operations' },
  { name: 'Sales', code: 'SALES', description: 'Revenue team' },
]

const users = [
  { name: 'Admin User', email: 'admin@peoplepay360.com', password: 'Admin@123', role: 'admin' },
  { name: 'HR Manager', email: 'hr@peoplepay360.com', password: 'Hr@123456', role: 'hr_manager' },
  { name: 'Payroll User', email: 'payroll.user@peoplepay360.com', password: 'PayUser@123', role: 'payroll_user' },
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
  { name: 'Unpaid Leave', code: 'UL', defaultDays: 5, isPaid: false, requiresApproval: true, color: '#94a3b8' },
]

const salaryRules = [
  { name: 'Basic Salary', code: 'BASIC', category: 'basic', computationType: 'fixed', amount: 0, sequence: 1 },
  { name: 'Housing Allowance', code: 'HRA', category: 'allowance', computationType: 'percentage_of_basic', percentage: 20, sequence: 2 },
  { name: 'Transport Allowance', code: 'TA', category: 'allowance', computationType: 'fixed', amount: 3000, sequence: 3 },
  { name: 'Income Tax', code: 'TAX', category: 'deduction', computationType: 'percentage_of_gross', percentage: 10, sequence: 4 },
  { name: 'Social Security', code: 'SS', category: 'deduction', computationType: 'percentage_of_basic', percentage: 5, sequence: 5 },
  { name: 'Net Salary', code: 'NET', category: 'net', computationType: 'formula', formula: 'GROSS - DEDUCTIONS', sequence: 6 },
]

const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Ananya', 'Aadhya', 'Diya', 'Myra', 'Sara', 'Anika', 'Pari', 'Aarohi', 'Kiara', 'Prisha',
  'Rohan', 'Kabir', 'Dev', 'Neil', 'Yash', 'Om', 'Atharv', 'Rudra', 'Shaurya', 'Dhruv',
  'Meera', 'Isha', 'Nisha', 'Riya', 'Sneha', 'Pooja', 'Kavya', 'Tanvi', 'Neha', 'Shreya',
]

const LAST_NAMES = [
  'Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Shah', 'Mehta', 'Joshi', 'Reddy', 'Nair',
  'Iyer', 'Chopra', 'Kapoor', 'Malhotra', 'Verma', 'Agarwal', 'Bansal', 'Desai', 'Jain', 'Rao',
]

const JOBS = [
  { title: 'Software Engineer', dept: 'ENG', wage: 75000 },
  { title: 'Senior Engineer', dept: 'ENG', wage: 95000 },
  { title: 'HR Specialist', dept: 'HR', wage: 55000 },
  { title: 'Recruiter', dept: 'HR', wage: 48000 },
  { title: 'Accountant', dept: 'FIN', wage: 60000 },
  { title: 'Financial Analyst', dept: 'FIN', wage: 70000 },
  { title: 'Ops Lead', dept: 'OPS', wage: 65000 },
  { title: 'Operations Associate', dept: 'OPS', wage: 45000 },
  { title: 'Sales Manager', dept: 'SALES', wage: 70000 },
  { title: 'Sales Executive', dept: 'SALES', wage: 50000 },
]

/** Generate 200 demo employees with unique emails */
const buildEmployeeSeeds = (count = 200) => {
  const seeds = []
  for (let i = 0; i < count; i += 1) {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length]
    const lastName = LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length]
    const job = JOBS[i % JOBS.length]
    const n = i + 1
    seeds.push({
      firstName,
      lastName,
      email: `emp${String(n).padStart(3, '0')}.${firstName.toLowerCase()}@peoplepay360.com`,
      jobTitle: job.title,
      employmentType: 'Full-time',
      deptCode: job.dept,
      wage: job.wage + (i % 7) * 1000,
      phone: `9${String(800000000 + n).slice(0, 9)}`,
    })
  }
  // Keep classic demo emails for known logins
  seeds[0] = {
    firstName: 'Alice',
    lastName: 'Nguyen',
    email: 'alice.nguyen@peoplepay360.com',
    jobTitle: 'Software Engineer',
    employmentType: 'Full-time',
    deptCode: 'ENG',
    wage: 75000,
    phone: '9876543210',
  }
  return seeds
}

const employeeSeeds = buildEmployeeSeeds(200)

module.exports = {
  departments,
  users,
  workingSchedules,
  timeOffTypes,
  salaryRules,
  employeeSeeds,
}
