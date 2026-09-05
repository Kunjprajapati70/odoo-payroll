import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import MainLayout from '../components/layout/MainLayout'

// Auth pages
import Login from '../pages/auth/Login'
import ForgotPassword from '../pages/auth/ForgotPassword'

// App pages
import Dashboard from '../pages/dashboard/Dashboard'
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

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/employees" element={<Employees />} />
          <Route path="/employees/new" element={<EmployeeFormPage />} />
          <Route path="/employees/:id" element={<EmployeeDetails />} />
          <Route path="/employees/:id/edit" element={<EmployeeFormPage />} />

          <Route path="/departments" element={<Departments />} />
          <Route path="/contracts" element={<Contracts />} />
          <Route path="/schedules" element={<Schedules />} />
          <Route path="/attendance" element={<Attendance />} />

          <Route path="/time-off/types" element={<TimeOffTypes />} />
          <Route path="/time-off/allocations" element={<TimeOffAllocations />} />
          <Route path="/time-off/requests" element={<TimeOffRequests />} />

          <Route path="/payroll/structures" element={<SalaryStructures />} />
          <Route path="/payroll/rules" element={<SalaryRules />} />
          <Route path="/payroll/payruns" element={<Payruns />} />
          <Route path="/payroll/payruns/new" element={<CreatePayrun />} />
          <Route path="/payroll/payslips" element={<Payslips />} />
          <Route path="/payroll/payslips/:id" element={<PayslipDetails />} />

          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
