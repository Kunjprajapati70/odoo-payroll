import Skeleton from '../../components/common/Skeleton'
import { Link } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import { dashboardService } from '../../services/dashboardService'
import { departmentService } from '../../services/departmentService'

export const MONTHS = [
  { value: '1', label: 'January' }, { value: '2', label: 'February' },
  { value: '3', label: 'March' }, { value: '4', label: 'April' },
  { value: '5', label: 'May' }, { value: '6', label: 'June' },
  { value: '7', label: 'July' }, { value: '8', label: 'August' },
  { value: '9', label: 'September' }, { value: '10', label: 'October' },
  { value: '11', label: 'November' }, { value: '12', label: 'December' },
]

export function StatSkeleton() {
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

export function mapTimeOffOverview(rows = []) {
  const byStatus = Object.fromEntries((rows || []).map(r => [r.status, r.count || 0]))
  return [
    { label: 'Approved', approved: byStatus.approved || 0, pending: 0 },
    { label: 'Pending', approved: 0, pending: byStatus.pending || 0 },
    { label: 'Rejected', approved: 0, pending: byStatus.rejected || 0 },
  ]
}

export function QuickLinks({ links = [] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {links.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className="card p-4 hover:border-primary-300 border border-transparent transition-colors"
        >
          <p className="font-medium text-gray-900 text-sm">{link.title}</p>
          <p className="text-xs text-gray-500 mt-1">{link.subtitle}</p>
        </Link>
      ))}
    </div>
  )
}

export function useDashboardSummary({ enabled = true } = {}) {
  const [stats, setStats] = useState(null)
  const [salaryData, setSalaryData] = useState([])
  const [attendanceData, setAttendanceData] = useState([])
  const [departmentData, setDepartmentData] = useState([])
  const [timeOffData, setTimeOffData] = useState([])
  const [alerts, setAlerts] = useState([])
  const [recentUsers, setRecentUsers] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1))
  const [selectedDept, setSelectedDept] = useState('')

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (!enabled) return
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
        usersCreatedThisMonth: summary.usersCreatedThisMonth ?? 0,
        usersCreatedByHrThisMonth: summary.usersCreatedByHrThisMonth ?? 0,
      })
      setSalaryData(Array.isArray(summary.monthlySalaryTrend) ? summary.monthlySalaryTrend : [])
      setAttendanceData(Array.isArray(summary.attendanceOverview) ? summary.attendanceOverview : [])
      setDepartmentData(Array.isArray(summary.departmentDistribution) ? summary.departmentDistribution : [])
      setTimeOffData(mapTimeOffOverview(summary.timeOffOverview))
      setAlerts(Array.isArray(summary.alerts) ? summary.alerts : [])
      setRecentUsers(Array.isArray(summary.recentUsers) ? summary.recentUsers : [])
    } catch (_) {
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
  }, [enabled, selectedMonth, selectedDept])

  useEffect(() => {
    if (!enabled) return
    departmentService.getAll().then(res => {
      const list = Array.isArray(res) ? res : res?.data || []
      setDepartments(list.map(d => ({
        value: d._id,
        label: d.employeeCount != null ? `${d.name} (${d.employeeCount})` : d.name,
      })))
    }).catch(() => {})
  }, [enabled])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return {
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
  }
}
