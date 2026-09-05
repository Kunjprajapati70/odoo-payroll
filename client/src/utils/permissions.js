import { ROLES } from './constants'

export const can = (user, action) => {
  if (!user) return false
  const role = user.role

  const permissions = {
    [ROLES.ADMIN]: ['*'],

    [ROLES.HR_MANAGER]: [
      'employees:read', 'employees:write',
      'departments:read', 'departments:write',
      'contracts:read', 'contracts:write',
      'attendance:read', 'attendance:write',
      'timeoff:read', 'timeoff:write', 'timeoff:approve',
      'payroll:read',
      'reports:read',
    ],

    // HR Payroll User — can process payroll but not approve
    [ROLES.PAYROLL_USER]: [
      'employees:read',
      'payroll:read', 'payroll:write',
      'reports:read',
    ],

    // HR Payroll Manager — full payroll control
    [ROLES.PAYROLL_MANAGER]: [
      'employees:read',
      'payroll:read', 'payroll:write', 'payroll:approve',
      'reports:read',
    ],

    [ROLES.EMPLOYEE]: [
      'employees:read:own',
      'payslips:read:own',
      'timeoff:read:own', 'timeoff:write:own',
      'attendance:read:own',
    ],
  }

  const allowed = permissions[role] || []
  return allowed.includes('*') || allowed.includes(action)
}
