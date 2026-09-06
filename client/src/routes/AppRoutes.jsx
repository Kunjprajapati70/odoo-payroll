import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import MainLayout from '../components/layout/MainLayout'

import Login from '../pages/auth/Login'
import ForgotPassword from '../pages/auth/ForgotPassword'
import ResetPassword from '../pages/auth/ResetPassword'

import Dashboard from '../pages/dashboard/Dashboard'
import Users from '../pages/users/Users'
import Employees from '../pages/employees/Employees'
import EmployeeDetails from '../pages/employees/EmployeeDetails'
import EmployeeFormPage from '../pages/employees/EmployeeFormPage'
import Departments from '../pages/departments/Departments'
import Contracts from '../pages/contracts/Contracts'
import Schedules from '../pages/schedules/Schedules'
import Attendance from '../pages/attendance/Attendance'
import TimeOffTypes from '../pages/timeoff/TimeOffTypes'
import TimeOffAllocations from '../pages/timeoff/TimeOffAllocations'
import TimeOffRequests from '../pages/timeoff/TimeOffRequests'
import SalaryStructures from '../pages/payroll/SalaryStructures'
import SalaryRules from '../pages/payroll/SalaryRules'
import Payruns from '../pages/payroll/Payruns'
import CreatePayrun from '../pages/payroll/CreatePayrun'
import Payslips from '../pages/payroll/Payslips'
import PayslipDetails from '../pages/payroll/PayslipDetails'
import Reports from '../pages/reports/Reports'
import Settings from '../pages/settings/Settings'
import { ROLES } from '../utils/constants'
import { useAuth } from '../hooks/useAuth'
import { can } from '../utils/permissions'

function StaffOnly({ children }) {
  const { user } = useAuth()
  if (user?.role === ROLES.EMPLOYEE) return <Navigate to="/dashboard" replace />
  return children
}

/** Route guard aligned with client permission matrix (access-based pages). */
function RequireCan({ action, children }) {
  const { user } = useAuth()
  if (!can(user, action)) return <Navigate to="/dashboard" replace />
  return children
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/users" element={<RequireCan action="users:read"><Users /></RequireCan>} />

          <Route path="/employees" element={<StaffOnly><RequireCan action="employees:read"><Employees /></RequireCan></StaffOnly>} />
          <Route path="/employees/new" element={<StaffOnly><RequireCan action="employees:write"><EmployeeFormPage /></RequireCan></StaffOnly>} />
          <Route path="/employees/:id" element={<StaffOnly><RequireCan action="employees:read"><EmployeeDetails /></RequireCan></StaffOnly>} />
          <Route path="/employees/:id/edit" element={<StaffOnly><RequireCan action="employees:write"><EmployeeFormPage /></RequireCan></StaffOnly>} />

          <Route path="/departments" element={<StaffOnly><RequireCan action="departments:read"><Departments /></RequireCan></StaffOnly>} />
          <Route path="/contracts" element={<StaffOnly><RequireCan action="contracts:read"><Contracts /></RequireCan></StaffOnly>} />
          <Route path="/schedules" element={<StaffOnly><RequireCan action="schedules:read"><Schedules /></RequireCan></StaffOnly>} />
          <Route path="/attendance" element={<RequireCan action="attendance:read"><Attendance /></RequireCan>} />

          <Route path="/time-off/types" element={<StaffOnly><RequireCan action="timeoff:write"><TimeOffTypes /></RequireCan></StaffOnly>} />
          <Route path="/time-off/allocations" element={<StaffOnly><RequireCan action="timeoff:write"><TimeOffAllocations /></RequireCan></StaffOnly>} />
          <Route path="/time-off/requests" element={<RequireCan action="timeoff:read"><TimeOffRequests /></RequireCan>} />

          <Route path="/payroll/structures" element={<StaffOnly><RequireCan action="payroll:read"><SalaryStructures /></RequireCan></StaffOnly>} />
          <Route path="/payroll/rules" element={<StaffOnly><RequireCan action="payroll:read"><SalaryRules /></RequireCan></StaffOnly>} />
          <Route path="/payroll/payruns" element={<StaffOnly><RequireCan action="payroll:read"><Payruns /></RequireCan></StaffOnly>} />
          <Route path="/payroll/payruns/new" element={<StaffOnly><RequireCan action="payroll:write"><CreatePayrun /></RequireCan></StaffOnly>} />
          <Route path="/payroll/payslips" element={<Payslips />} />
          <Route path="/payroll/payslips/:id" element={<PayslipDetails />} />

          <Route path="/reports" element={<StaffOnly><RequireCan action="reports:read"><Reports /></RequireCan></StaffOnly>} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
