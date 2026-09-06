import { Users, DollarSign, Umbrella, FileText, Clock, RefreshCw, LogIn, UserPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import StatCard from '../../components/dashboard/StatCard'
import SalaryChart from '../../components/dashboard/SalaryChart'
import AttendanceChart from '../../components/dashboard/AttendanceChart'
import DepartmentChart from '../../components/dashboard/DepartmentChart'
import AlertsPanel from '../../components/dashboard/AlertsPanel'
import TimeOffChart from '../../components/dashboard/TimeOffChart'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/common/Button'
import Select from '../../components/common/Select'
import { attendanceService } from '../../services/attendanceService'
import { timeOffService } from '../../services/timeOffService'
import { payslipService } from '../../services/payslipService'
import { authService } from '../../services/authService'
import { formatCurrency, formatFullName, formatClockTime, formatWorkedDuration, calcHoursWorked } from '../../utils/formatters'
import { useAuth } from '../../hooks/useAuth'
import { ROLES } from '../../utils/constants'
import { MONTHS, StatSkeleton, useDashboardSummary } from './dashboardShared'
import HrDashboard from './HrDashboard'
import PayrollDashboard from './PayrollDashboard'

function EmployeeHome({ user }) {
  const [today, setToday] = useState(null)
  const [pendingLeaves, setPendingLeaves] = useState(0)
  const [payslipCount, setPayslipCount] = useState(0)
  const [basicSalary, setBasicSalary] = useState(user?.basicSalary ?? 0)
  const [loading, setLoading] = useState(true)
  const [punchLoading, setPunchLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [t, leaves, slips, me] = await Promise.all([
        attendanceService.today().catch(() => null),
        timeOffService.getRequests({ status: 'pending' }).catch(() => []),
        payslipService.getAll().catch(() => []),
        authService.me().catch(() => null),
      ])
      setToday(t || null)
      setPendingLeaves((Array.isArray(leaves) ? leaves : leaves?.data || []).length)
      setPayslipCount((Array.isArray(slips) ? slips : slips?.data || []).length)
      if (me?.basicSalary != null) setBasicSalary(me.basicSalary)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const punch = async (type) => {
    setPunchLoading(true)
    setMsg('')
    try {
      if (type === 'in') await attendanceService.checkIn()
      else await attendanceService.checkOut()
      setMsg(type === 'in' ? 'Checked in' : 'Checked out')
      load()
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Action failed')
    } finally {
      setPunchLoading(false)
    }
  }

  const name = user?.employee ? formatFullName(user.employee) : (user?.name || 'Employee')

  return (
    <div>
      <PageHeader title={`Welcome, ${name}`} subtitle="Your personal HR dashboard — attendance, leave, and payslips" />
      <div className="card mb-4 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">Today&apos;s attendance</p>
          <p className="text-xs text-gray-500 mt-1">
            {today?.checkIn
              ? `In ${formatClockTime(today.checkIn) || today.checkInTime}${today.checkOut ? ` · Out ${formatClockTime(today.checkOut) || today.checkOutTime}` : ' · Still working'}`
              : 'You have not checked in yet'}
            {today?.checkIn && today?.checkOut
              ? ` · ${formatWorkedDuration(today.checkIn, today.checkOut)}`
              : ''}
          </p>
          {msg && <p className="text-xs text-primary-600 mt-1">{msg}</p>}
        </div>
        <div className="flex gap-2">
          <Button icon={LogIn} variant="secondary" loading={punchLoading} disabled={!!today?.checkIn} onClick={() => punch('in')}>Check In</Button>
          <Button icon={Clock} loading={punchLoading} disabled={!today?.checkIn || !!today?.checkOut} onClick={() => punch('out')}>Check Out</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {loading ? Array(4).fill(0).map((_, i) => <StatSkeleton key={i} />) : (
          <>
            <StatCard title="Basic Salary" value={formatCurrency(basicSalary || 0)} icon={DollarSign} color="green" />
            <StatCard title="Hours Today" value={today?.checkIn && today?.checkOut ? calcHoursWorked(today.checkIn, today.checkOut) : (today?.hoursWorked ?? 0)} icon={Clock} color="primary" />
            <StatCard title="Pending Leave" value={pendingLeaves} icon={Umbrella} color="orange" />
            <StatCard title="My Payslips" value={payslipCount} icon={FileText} color="blue" />
          </>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link to="/attendance" className="card p-4 hover:border-primary-300 border border-transparent transition-colors">
          <p className="font-medium text-gray-900 text-sm">Attendance</p>
          <p className="text-xs text-gray-500 mt-1">View history and punch times</p>
        </Link>
        <Link to="/time-off/requests" className="card p-4 hover:border-primary-300 border border-transparent transition-colors">
          <p className="font-medium text-gray-900 text-sm">Request Leave</p>
          <p className="text-xs text-gray-500 mt-1">Current and future months only</p>
        </Link>
        <Link to="/payroll/payslips" className="card p-4 hover:border-primary-300 border border-transparent transition-colors">
          <p className="font-medium text-gray-900 text-sm">My Payslips</p>
          <p className="text-xs text-gray-500 mt-1">Salary from payroll runs</p>
        </Link>
      </div>
    </div>
  )
}

function RecentUsersPanel({ users = [], loading }) {
  const list = Array.isArray(users) ? users : []
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Recent users</h3>
        <Link to="/users" className="text-xs font-medium text-primary-600 hover:text-primary-700">
          Manage users
        </Link>
      </div>
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
        </div>
      ) : list.length === 0 ? (
        <p className="text-sm text-gray-400">No users yet.</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {list.map((u) => (
            <div key={u._id} className="flex items-start justify-between gap-3 p-2.5 rounded-lg bg-gray-50 border border-gray-100">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                <p className="text-xs text-gray-500 truncate">{u.email}</p>
                <p className="text-xs text-gray-400 mt-0.5 capitalize">
                  {String(u.role || '').replace(/_/g, ' ')}
                  {u.createdBy?.name ? ` · by ${u.createdBy.name}` : ''}
                </p>
              </div>
              <span className="text-[10px] text-gray-400 shrink-0">
                {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AdminDashboard() {
  const {
    stats,
    salaryData,
    attendanceData,
    departmentData,
    timeOffData,
    alerts,
    recentUsers,
    departments,
    loading,
    refreshing,
    selectedMonth,
    setSelectedMonth,
    selectedDept,
    setSelectedDept,
    fetchAll,
  } = useDashboardSummary()

  const deptOptions = [{ value: '', label: 'All Departments' }, ...departments]

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Full workforce overview — includes HR Manager activity and new users"
        actions={
          <div className="flex flex-nowrap items-end gap-2 overflow-x-auto">
            <Select
              label="Month"
              options={MONTHS}
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="w-36 py-1.5"
            />
            <Select
              label="Department"
              options={deptOptions}
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              placeholder="All Departments"
              className="w-48 py-1.5"
            />
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              loading={refreshing}
              onClick={() => fetchAll(true)}
            >
              Refresh
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          <>
            <StatCard title="Active Employees" value={stats?.totalEmployees ?? '—'} icon={Users} color="primary" />
            <StatCard
              title="Net Salary Paid"
              value={stats?.totalNetSalary != null ? formatCurrency(stats.totalNetSalary) : '—'}
              icon={DollarSign}
              color="green"
            />
            <StatCard title="Users this month" value={stats?.usersCreatedThisMonth ?? 0} icon={UserPlus} color="blue" />
            <StatCard
              title="Created by HR"
              value={stats?.usersCreatedByHrThisMonth ?? 0}
              icon={UserPlus}
              color="orange"
              trendLabel="HR onboarding"
              trend={1}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {loading ? (
          Array(3).fill(0).map((_, i) => <StatSkeleton key={`b-${i}`} />)
        ) : (
          <>
            <StatCard title="Total Payslips" value={stats?.totalPayslips ?? '—'} icon={FileText} color="blue" />
            <StatCard title="Approved Time Off" value={stats?.approvedTimeOff ?? '—'} icon={Umbrella} color="primary" />
            <StatCard
              title="Attendance Health"
              value={stats?.attendanceHealth != null ? `${stats.attendanceHealth}%` : '—'}
              icon={Clock}
              color="green"
              trendLabel={stats?.attendanceHealth >= 80 ? 'Good' : 'Needs attention'}
              trend={stats?.attendanceHealth >= 80 ? 1 : -1}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
        <SalaryChart data={salaryData} loading={loading} />
        <AttendanceChart data={attendanceData} loading={loading} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
        <DepartmentChart data={departmentData} loading={loading} />
        <div className="grid grid-rows-2 gap-4">
          <TimeOffChart data={timeOffData} loading={loading} />
          <AlertsPanel alerts={alerts} loading={loading} />
        </div>
      </div>

      <RecentUsersPanel users={recentUsers} loading={loading} />
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()

  if (user?.role === ROLES.EMPLOYEE) return <EmployeeHome user={user} />
  if (user?.role === ROLES.HR_MANAGER) return <HrDashboard user={user} />
  if (user?.role === ROLES.PAYROLL_MANAGER) return <PayrollDashboard user={user} mode="manager" />
  if (user?.role === ROLES.PAYROLL_USER) return <PayrollDashboard user={user} mode="user" />

  return <AdminDashboard />
}
