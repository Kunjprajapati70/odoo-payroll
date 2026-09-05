export const ROLES = {
  ADMIN: 'admin',
  HR_MANAGER: 'hr_manager',
  PAYROLL_MANAGER: 'payroll_manager',
  EMPLOYEE: 'employee',
}

export const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Intern']
export const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say']
export const MARITAL_STATUS = ['Single', 'Married', 'Divorced', 'Widowed']

export const CONTRACT_STATUSES = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  TERMINATED: 'terminated',
}

export const ATTENDANCE_STATUSES = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  HALF_DAY: 'half_day',
  ON_LEAVE: 'on_leave',
}

export const TIME_OFF_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
}

export const PAYRUN_STATUSES = {
  DRAFT: 'draft',
  PROCESSING: 'processing',
  DONE: 'done',
  APPROVED: 'approved',
  CANCELLED: 'cancelled',
}

export const SALARY_RULE_TYPES = {
  BASIC: 'basic',
  ALLOWANCE: 'allowance',
  DEDUCTION: 'deduction',
}

export const PAGINATION_LIMIT = 20
