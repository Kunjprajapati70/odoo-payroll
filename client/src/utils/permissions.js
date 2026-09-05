import { ROLES } from './constants'

export const can = (user, action) => {
  if (!user) return false
  const role = user.role

  const permissions = {
    [ROLES.ADMIN]: ['*'],

    [ROLES.HR_MANAGER]: [
      'users:read',
      'employees:read', 'employees:write',
      'departments:read', 'departments:write',
      'contracts:read', 'contracts:write',
      'schedules:read', 'schedules:write',
      'attendance:read', 'attendance:write',
      'timeoff:read', 'timeoff:write', 'timeoff:approve',
      'payroll:read',
      'reports:read',
    ],

    [ROLES.PAYROLL_USER]: [
      'employees:read',
      'payroll:read', 'payroll:write',
      'reports:read',
    ],

    [ROLES.PAYROLL_MANAGER]: [
      'employees:read',
      'payroll:read', 'payroll:write', 'payroll:approve',
      'reports:read',
    ],

    [ROLES.EMPLOYEE]: [
      'dashboard:own',
      'employees:read:own',
      'payslips:read:own',
      'timeoff:read:own', 'timeoff:write:own',
      'attendance:read:own', 'attendance:write:own',
      'settings:own',
    ],
  }

  const allowed = permissions[role] || []
  if (allowed.includes('*') || allowed.includes(action)) return true

  // Broad actions also match own-scoped grants for employees
  if (allowed.includes(`${action}:own`)) return true
  // Own-scoped request matches if user has the broad permission
  if (action.endsWith(':own')) {
    const base = action.replace(/:own$/, '')
    if (allowed.includes(base)) return true
  }
  return false
}

/** Nav items visible per role */
export const navPermission = {
  dashboard: null, // everyone authenticated
  users: 'users:read',
  employees: 'employees:read',
  departments: 'departments:read',
  contracts: 'contracts:read',
  schedules: 'schedules:read',
  attendance: 'attendance:read',
  timeoff: 'timeoff:read',
  payroll: 'payroll:read',
  reports: 'reports:read',
  settings: null,
}

export const canSeeNav = (user, key) => {
  if (!user) return false
  if (user.role === ROLES.ADMIN) return true
  if (user.role === ROLES.EMPLOYEE) {
    return ['dashboard', 'attendance', 'timeoff', 'payroll', 'settings'].includes(key)
  }
  const action = navPermission[key]
  if (!action) return true
  return can(user, action) || can(user, `${action}:own`)
}
