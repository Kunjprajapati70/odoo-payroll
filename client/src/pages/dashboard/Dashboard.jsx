import { useState, useEffect, useCallback } from 'react'
import { Users, DollarSign, Umbrella, FileText, TrendingUp, Clock, RefreshCw, LogIn } from 'lucide-react'
import { Link } from 'react-router-dom'
import StatCard from '../../components/dashboard/StatCard'
import SalaryChart from '../../components/dashboard/SalaryChart'
import AttendanceChart from '../../components/dashboard/AttendanceChart'
import DepartmentChart from '../../components/dashboard/DepartmentChart'
import AlertsPanel from '../../components/dashboard/AlertsPanel'
import TimeOffChart from '../../components/dashboard/TimeOffChart'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/common/Button'
import Select from '../../components/common/Select'
import { dashboardService } from '../../services/dashboardService'
import { departmentService } from '../../services/departmentService'
import { attendanceService } from '../../services/attendanceService'
import { timeOffService } from '../../services/timeOffService'
import { payslipService } from '../../services/payslipService'
import { authService } from '../../services/authService'
import { formatCurrency, formatFullName, formatClockTime, formatWorkedDuration, calcHoursWorked } from '../../utils/formatters'
import Skeleton from '../../components/common/Skeleton'
import { useAuth } from '../../hooks/useAuth'
import { ROLES } from '../../utils/constants'

const MONTHS = [
  { value: '1', label: 'January' }, { value: '2', label: 'February' },
  { value: '3', label: 'March' }, { value: '4', label: 'April' },
  { value: '5', label: 'May' }, { value: '6', label: 'June' },
  { value: '7', label: 'July' }, { value: '8', label: 'August' },
  { value: '9', label: 'September' }, { value: '10', label: 'October' },
  { value: '11', label: 'November' }, { value: '12', label: 'December' },
]

function StatSkeleton() {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-7 w-20 mb-2" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
    </div>
  )
}

function mapTimeOffOverview(rows = []) {
  const byStatus = Object.fromEntries((rows || []).map(r => [r.status, r.count || 0]))
  return [
    { label: 'Approved', approved: byStatus.approved || 0, pending: 0 },
    { label: 'Pending', approved: 0, pending: byStatus.pending || 0 },
    { label: 'Rejected', approved: 0, pending: byStatus.rejected || 0 },
  ]
}

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

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [salaryData, setSalaryData] = useState([])
  const [attendanceData, setAttendanceData] = useState([])
  const [departmentData, setDepartmentData] = useState([])
  const [timeOffData, setTimeOffData] = useState([])
  const [alerts, setAlerts] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1))
  const [selectedDept, setSelectedDept] = useState('')

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    const params = {
      month: selectedMonth,
      year: new Date().getFullYear(),
      department: selectedDept || undefined,
    }
    try {
      const summary = await dashboardService.getSummary(params)
      setStats({
        totalEmployees: summary.totalEmployees,
        pendingLeaves: (summary.timeOffOverview || []).find(t => t.status === 'pending')?.count
          ?? summary.alerts?.filter(a => a.type === 'pending').length
          ?? 0,
        totalNetSalary: summary.totalNetSalaryPaid,
        totalPayslips: summary.totalPayslips,
        avgSalary: summary.averageSalary,
        approvedTimeOff: summary.approvedTimeOff,
        attendanceHealth: summary.attendanceHealth,
      })
      setSalaryData(Array.isArray(summary.monthlySalaryTrend) ? summary.monthlySalaryTrend : [])
      setAttendanceData(Array.isArray(summary.attendanceOverview) ? summary.attendanceOverview : [])
      setDepartmentData(Array.isArray(summary.departmentDistribution) ? summary.departmentDistribution : [])
      setTimeOffData(mapTimeOffOverview(summary.timeOffOverview))
      setAlerts(Array.isArray(summary.alerts) ? summary.alerts : [])
    } catch (_) {
      // Fallback to individual endpoints if summary fails
      try {
        const [statsRes, salaryRes, attendanceRes, deptChartRes, alertsRes] = await Promise.allSettled([
          dashboardService.getStats(),
          dashboardService.getSalaryChart(params),
          dashboardService.getAttendanceChart(params),
          dashboardService.getDepartmentChart(),
          dashboardService.getAlerts(),
        ])
        if (statsRes.status === 'fulfilled') setStats(statsRes.value)
        if (salaryRes.status === 'fulfilled') setSalaryData(Array.isArray(salaryRes.value) ? salaryRes.value : [])
        if (attendanceRes.status === 'fulfilled') setAttendanceData(Array.isArray(attendanceRes.value) ? attendanceRes.value : [])
        if (deptChartRes.status === 'fulfilled') setDepartmentData(Array.isArray(deptChartRes.value) ? deptChartRes.value : [])
        if (alertsRes.status === 'fulfilled') {
          const raw = alertsRes.value
          setAlerts(Array.isArray(raw) ? raw : [])
        }
      } catch {
        // keep previous state
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [selectedMonth, selectedDept])

  useEffect(() => {
    if (user?.role === ROLES.EMPLOYEE) return
    departmentService.getAll().then(res => {
      const list = Array.isArray(res) ? res : res?.data || []
      setDepartments(list.map(d => ({
        value: d._id,
        label: d.employeeCount != null ? `${d.name} (${d.employeeCount})` : d.name,
      })))
    }).catch(() => {})
  }, [user?.role])

  useEffect(() => {
    if (user?.role === ROLES.EMPLOYEE) return
    fetchAll()
  }, [fetchAll, user?.role])

  if (user?.role === ROLES.EMPLOYEE) return <EmployeeHome user={user} />

  const deptOptions = [{ value: '', label: 'All Departments' }, ...departments]

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Your workforce overview at a glance"
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

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
        {loading ? (
          Array(3).fill(0).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          <>
            <StatCard title="Active Employees" value={stats?.totalEmployees ?? '—'} icon={Users} color="primary" />
            <StatCard
              title="Net Salary Paid"
              value={stats?.totalNetSalary != null ? formatCurrency(stats.totalNetSalary) : '—'}
              icon={DollarSign}
              color="green"
            />
            <StatCard title="Total Payslips" value={stats?.totalPayslips ?? '—'} icon={FileText} color="blue" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {loading ? (
          Array(3).fill(0).map((_, i) => <StatSkeleton key={`b-${i}`} />)
        ) : (
          <>
            <StatCard
              title="Average Net Salary"
              value={stats?.avgSalary != null ? formatCurrency(stats.avgSalary) : '—'}
              icon={TrendingUp}
              color="orange"
            />
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <DepartmentChart data={departmentData} loading={loading} />
        <div className="grid grid-rows-2 gap-4">
          <TimeOffChart data={timeOffData} loading={loading} />
          <AlertsPanel alerts={alerts} loading={loading} />
        </div>
      </div>
    </div>
  )
}
