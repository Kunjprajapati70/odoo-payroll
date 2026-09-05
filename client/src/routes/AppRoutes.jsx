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

function AdminOnly({ children }) {
  const { user } = useAuth()
  if (user?.role !== ROLES.ADMIN) return <Navigate to="/dashboard" replace />
  return children
}

function StaffOnly({ children }) {
  const { user } = useAuth()
  if (user?.role === ROLES.EMPLOYEE) return <Navigate to="/dashboard" replace />
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

          <Route path="/users" element={<AdminOnly><Users /></AdminOnly>} />

          <Route path="/employees" element={<StaffOnly><Employees /></StaffOnly>} />
          <Route path="/employees/new" element={<StaffOnly><EmployeeFormPage /></StaffOnly>} />
          <Route path="/employees/:id" element={<StaffOnly><EmployeeDetails /></StaffOnly>} />
          <Route path="/employees/:id/edit" element={<StaffOnly><EmployeeFormPage /></StaffOnly>} />

          <Route path="/departments" element={<StaffOnly><Departments /></StaffOnly>} />
          <Route path="/contracts" element={<StaffOnly><Contracts /></StaffOnly>} />
          <Route path="/schedules" element={<StaffOnly><Schedules /></StaffOnly>} />
          <Route path="/attendance" element={<Attendance />} />

          <Route path="/time-off/types" element={<StaffOnly><TimeOffTypes /></StaffOnly>} />
          <Route path="/time-off/allocations" element={<StaffOnly><TimeOffAllocations /></StaffOnly>} />
          <Route path="/time-off/requests" element={<TimeOffRequests />} />

          <Route path="/payroll/structures" element={<StaffOnly><SalaryStructures /></StaffOnly>} />
          <Route path="/payroll/rules" element={<StaffOnly><SalaryRules /></StaffOnly>} />
          <Route path="/payroll/payruns" element={<StaffOnly><Payruns /></StaffOnly>} />
          <Route path="/payroll/payruns/new" element={<StaffOnly><CreatePayrun /></StaffOnly>} />
          <Route path="/payroll/payslips" element={<Payslips />} />
          <Route path="/payroll/payslips/:id" element={<PayslipDetails />} />

          <Route path="/reports" element={<StaffOnly><Reports /></StaffOnly>} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
