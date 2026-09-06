/** Canonical role values stored in MongoDB (lowercase snake_case). */
const ROLES = {
  ADMIN: 'admin',
  HR_MANAGER: 'hr_manager',
  HR_PAYROLL_USER: 'payroll_user',
  HR_PAYROLL_MANAGER: 'payroll_manager',
  EMPLOYEE: 'employee',
}

const ALL_ROLES = Object.values(ROLES)

const HR_ROLES = [
  ROLES.ADMIN,
  ROLES.HR_MANAGER,
  ROLES.HR_PAYROLL_USER,
  ROLES.HR_PAYROLL_MANAGER,
]

const PAYROLL_WRITE_ROLES = [
  ROLES.ADMIN,
  ROLES.HR_PAYROLL_USER,
  ROLES.HR_PAYROLL_MANAGER,
]

const PAYROLL_APPROVE_ROLES = [
  ROLES.ADMIN,
  ROLES.HR_PAYROLL_MANAGER,
]

const TIMEOFF_APPROVE_ROLES = [
  ROLES.ADMIN,
  ROLES.HR_MANAGER,
]

/** Who can manage user accounts */
const USER_MANAGE_ROLES = [
  ROLES.ADMIN,
  ROLES.HR_MANAGER,
]

/** Roles an HR Manager may assign when creating/updating users (not admin) */
const HR_ASSIGNABLE_ROLES = [
  ROLES.EMPLOYEE,
  ROLES.HR_MANAGER,
  ROLES.HR_PAYROLL_USER,
  ROLES.HR_PAYROLL_MANAGER,
]

module.exports = {
  ROLES,
  ALL_ROLES,
  HR_ROLES,
  PAYROLL_WRITE_ROLES,
  PAYROLL_APPROVE_ROLES,
  TIMEOFF_APPROVE_ROLES,
  USER_MANAGE_ROLES,
  HR_ASSIGNABLE_ROLES,
}
