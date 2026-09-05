import { useState, useEffect, useCallback } from 'react'
import { Users, DollarSign, Umbrella, RefreshCw } from 'lucide-react'
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
import Skeleton from '../../components/common/Skeleton'

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

export default function Dashboard() {
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
    try {
      const params = { month: selectedMonth, department: selectedDept || undefined }
      const [statsRes, salaryRes, attendanceRes, deptChartRes, alertsRes] = await Promise.allSettled([
        dashboardService.getStats(),
        dashboardService.getSalaryChart(params),
        dashboardService.getAttendanceChart(params),
        dashboardService.getDepartmentChart(),
        dashboardService.getAlerts(),
      ])
      if (statsRes.status === 'fulfilled') setStats(statsRes.value)
      if (salaryRes.status === 'fulfilled') setSalaryData(Array.isArray(salaryRes.value) ? salaryRes.value : salaryRes.value?.data || [])
      if (attendanceRes.status === 'fulfilled') setAttendanceData(Array.isArray(attendanceRes.value) ? attendanceRes.value : attendanceRes.value?.data || [])
      if (deptChartRes.status === 'fulfilled') setDepartmentData(Array.isArray(deptChartRes.value) ? deptChartRes.value : deptChartRes.value?.data || [])
      if (alertsRes.status === 'fulfilled') {
        const raw = alertsRes.value
        const alertList = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : []
        setAlerts(alertList)
        setTimeOffData(Array.isArray(raw?.timeOffChart) ? raw.timeOffChart : [])
      }
    } catch (_) {
      // errors handled per-promise
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [selectedMonth, selectedDept])

  useEffect(() => {
    departmentService.getAll().then(res => {
      const list = Array.isArray(res) ? res : res?.data || []
      setDepartments(list.map(d => ({ value: d._id, label: d.name })))
    }).catch(() => {})
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const deptOptions = [{ value: '', label: 'All Departments' }, ...departments]

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Your workforce overview at a glance"
        actions={
          <div className="flex items-center gap-2">
            <Select
              options={MONTHS}
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="w-36 py-1.5"
            />
            <Select
              options={deptOptions}
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              placeholder="All Departments"
              className="w-44 py-1.5"
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

      {/* Stat Cards — fields match /dashboard/stats API */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {loading ? (
          Array(3).fill(0).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              title="Active Employees"
              value={stats?.totalEmployees ?? '—'}
              icon={Users}
              color="primary"
            />
            <StatCard
              title="Pending Leave Requests"
              value={stats?.pendingLeaves ?? '—'}
              icon={Umbrella}
              color="orange"
            />
            <StatCard
              title="Active Pay Runs"
              value={stats?.activePayruns ?? '—'}
              icon={DollarSign}
              color="green"
            />
          </>
        )}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
        <SalaryChart data={salaryData} loading={loading} />
        <AttendanceChart data={attendanceData} loading={loading} />
      </div>

      {/* Charts row 2 */}
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
