import { Users, Umbrella, Clock, FileText, Building2, Calendar } from 'lucide-react'
import { RefreshCw } from 'lucide-react'
import StatCard from '../../components/dashboard/StatCard'
import AttendanceChart from '../../components/dashboard/AttendanceChart'
import DepartmentChart from '../../components/dashboard/DepartmentChart'
import TimeOffChart from '../../components/dashboard/TimeOffChart'
import AlertsPanel from '../../components/dashboard/AlertsPanel'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/common/Button'
import Select from '../../components/common/Select'
import { MONTHS, StatSkeleton, QuickLinks, useDashboardSummary } from './dashboardShared'

const HR_ALERT_TYPES = new Set(['pending', 'contract', 'warning', 'danger'])

const QUICK_LINKS = [
  { to: '/users', title: 'Users', subtitle: 'Create accounts — credentials emailed automatically' },
  { to: '/employees', title: 'Employees', subtitle: 'Manage workforce records' },
  { to: '/time-off/requests', title: 'Leave Approvals', subtitle: 'Review pending time-off requests' },
  { to: '/attendance', title: 'Attendance', subtitle: 'Daily presence and hours' },
  { to: '/contracts', title: 'Contracts', subtitle: 'Active and expiring contracts' },
  { to: '/departments', title: 'Departments', subtitle: 'Org structure and headcount' },
  { to: '/schedules', title: 'Schedules', subtitle: 'Work calendars and shifts' },
]

export default function HrDashboard({ user }) {
  const {
    stats,
    attendanceData,
    departmentData,
    timeOffData,
    alerts,
    departments,
    loading,
    refreshing,
    selectedMonth,
    setSelectedMonth,
    selectedDept,
    setSelectedDept,
    fetchAll,
  } = useDashboardSummary()

  const hrAlerts = (alerts || []).filter(a => HR_ALERT_TYPES.has(a.type) || /leave|contract|attendance/i.test(a.message || ''))
  const deptOptions = [{ value: '', label: 'All Departments' }, ...departments]
  const name = user?.name || 'HR Manager'

  return (
    <div>
      <PageHeader
        title={`HR Dashboard`}
        subtitle={`Welcome, ${name} — workforce, attendance, and leave at a glance`}
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
            <Button variant="secondary" size="sm" icon={RefreshCw} loading={refreshing} onClick={() => fetchAll(true)}>
              Refresh
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {loading ? (
          Array(4).fill(0).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          <>
            <StatCard title="Active Employees" value={stats?.totalEmployees ?? '—'} icon={Users} color="primary" />
            <StatCard title="Pending Leave" value={stats?.pendingLeaves ?? '—'} icon={Umbrella} color="orange" />
            <StatCard title="Approved Time Off" value={stats?.approvedTimeOff ?? '—'} icon={Calendar} color="blue" />
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
        <AttendanceChart data={attendanceData} loading={loading} />
        <DepartmentChart data={departmentData} loading={loading} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
        <TimeOffChart data={timeOffData} loading={loading} />
        <AlertsPanel alerts={hrAlerts} loading={loading} />
      </div>

      <div className="mb-2 flex items-center gap-2">
        <FileText size={14} className="text-gray-400" />
        <Building2 size={14} className="text-gray-400" />
        <p className="text-sm font-semibold text-gray-700">HR shortcuts</p>
      </div>
      <QuickLinks links={QUICK_LINKS} />
    </div>
  )
}
