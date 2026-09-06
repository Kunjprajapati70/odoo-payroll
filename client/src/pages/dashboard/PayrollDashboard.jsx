import { useCallback, useEffect, useState } from 'react'
import { DollarSign, FileText, TrendingUp, Users, Layers, CheckCircle2, PencilLine, RefreshCw } from 'lucide-react'
import StatCard from '../../components/dashboard/StatCard'
import SalaryChart from '../../components/dashboard/SalaryChart'
import DepartmentChart from '../../components/dashboard/DepartmentChart'
import AlertsPanel from '../../components/dashboard/AlertsPanel'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/common/Button'
import Select from '../../components/common/Select'
import { formatCurrency } from '../../utils/formatters'
import { payrunService } from '../../services/payrunService'
import { PAYRUN_STATUSES } from '../../utils/constants'
import { MONTHS, StatSkeleton, QuickLinks, useDashboardSummary } from './dashboardShared'

const MANAGER_LINKS = [
  { to: '/payroll/payruns', title: 'Pay Runs', subtitle: 'Review, validate, and mark paid' },
  { to: '/payroll/payslips', title: 'Payslips', subtitle: 'Employee salary documents' },
  { to: '/payroll/structures', title: 'Salary Structures', subtitle: 'Compensation frameworks' },
  { to: '/payroll/rules', title: 'Salary Rules', subtitle: 'Allowances and deductions' },
  { to: '/employees', title: 'Employees', subtitle: 'Payroll-linked headcount' },
  { to: '/reports', title: 'Reports', subtitle: 'Payroll and cost analytics' },
]

const USER_LINKS = [
  { to: '/payroll/payruns/new', title: 'Create Pay Run', subtitle: 'Start a new payroll period' },
  { to: '/payroll/payruns', title: 'Pay Runs', subtitle: 'Draft, compute, and send payslips' },
  { to: '/payroll/structures', title: 'Salary Structures', subtitle: 'Maintain structures' },
  { to: '/payroll/rules', title: 'Salary Rules', subtitle: 'Configure pay rules' },
  { to: '/payroll/payslips', title: 'Payslips', subtitle: 'Generated payslip list' },
  { to: '/reports', title: 'Reports', subtitle: 'Payroll summaries' },
]

function countByStatus(list = []) {
  const counts = { draft: 0, computed: 0, validated: 0, paid: 0 }
  for (const p of list) {
    const s = p.status
    if (s === PAYRUN_STATUSES.DRAFT || s === 'draft') counts.draft += 1
    else if (s === PAYRUN_STATUSES.COMPUTED || s === 'computed' || s === 'processing') counts.computed += 1
    else if (s === PAYRUN_STATUSES.VALIDATED || s === 'validated' || s === 'approved') counts.validated += 1
    else if (s === PAYRUN_STATUSES.PAID || s === 'paid') counts.paid += 1
  }
  return counts
}

export default function PayrollDashboard({ user, mode = 'user' }) {
  const isManager = mode === 'manager'
  const {
    stats,
    salaryData,
    departmentData,
    alerts,
    loading,
    refreshing,
    selectedMonth,
    setSelectedMonth,
    fetchAll,
  } = useDashboardSummary()

  const [payrunCounts, setPayrunCounts] = useState({ draft: 0, computed: 0, validated: 0, paid: 0 })
  const [payrunLoading, setPayrunLoading] = useState(true)

  const loadPayruns = useCallback(async () => {
    setPayrunLoading(true)
    try {
      const res = await payrunService.getAll({ limit: 100 })
      const list = Array.isArray(res) ? res : res?.data || []
      setPayrunCounts(countByStatus(list))
    } catch {
      setPayrunCounts({ draft: 0, computed: 0, validated: 0, paid: 0 })
    } finally {
      setPayrunLoading(false)
    }
  }, [])

  useEffect(() => { loadPayruns() }, [loadPayruns])

  const refresh = async () => {
    await Promise.all([fetchAll(true), loadPayruns()])
  }

  const name = user?.name || (isManager ? 'Payroll Manager' : 'Payroll User')
  const title = isManager ? 'Payroll Manager Dashboard' : 'Payroll User Dashboard'
  const subtitle = isManager
    ? `Welcome, ${name} — approve pay runs and track payroll outcomes`
    : `Welcome, ${name} — prepare pay runs, compute, and send payslips`

  const busy = loading || payrunLoading

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <div className="flex flex-nowrap items-end gap-2 overflow-x-auto">
            <Select
              label="Month"
              options={MONTHS}
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="w-36 py-1.5"
            />
            <Button variant="secondary" size="sm" icon={RefreshCw} loading={refreshing} onClick={refresh}>
              Refresh
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        {busy ? (
          Array(4).fill(0).map((_, i) => <StatSkeleton key={i} />)
        ) : isManager ? (
          <>
            <StatCard title="Awaiting Approval" value={payrunCounts.computed} icon={CheckCircle2} color="orange" />
            <StatCard title="Validated" value={payrunCounts.validated} icon={Layers} color="blue" />
            <StatCard
              title="Net Salary Paid"
              value={stats?.totalNetSalary != null ? formatCurrency(stats.totalNetSalary) : '—'}
              icon={DollarSign}
              color="green"
            />
            <StatCard title="Total Payslips" value={stats?.totalPayslips ?? '—'} icon={FileText} color="primary" />
          </>
        ) : (
          <>
            <StatCard title="Draft Pay Runs" value={payrunCounts.draft} icon={PencilLine} color="orange" />
            <StatCard title="Computed" value={payrunCounts.computed} icon={Layers} color="blue" />
            <StatCard title="Total Payslips" value={stats?.totalPayslips ?? '—'} icon={FileText} color="primary" />
            <StatCard
              title="Average Net Salary"
              value={stats?.avgSalary != null ? formatCurrency(stats.avgSalary) : '—'}
              icon={TrendingUp}
              color="green"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {busy ? (
          Array(3).fill(0).map((_, i) => <StatSkeleton key={`b-${i}`} />)
        ) : (
          <>
            <StatCard title="Active Employees" value={stats?.totalEmployees ?? '—'} icon={Users} color="primary" />
            <StatCard title="Paid Pay Runs" value={payrunCounts.paid} icon={DollarSign} color="green" />
            {isManager ? (
              <StatCard
                title="Average Net Salary"
                value={stats?.avgSalary != null ? formatCurrency(stats.avgSalary) : '—'}
                icon={TrendingUp}
                color="orange"
              />
            ) : (
              <StatCard
                title="Net Salary Paid"
                value={stats?.totalNetSalary != null ? formatCurrency(stats.totalNetSalary) : '—'}
                icon={DollarSign}
                color="orange"
              />
            )}
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
        <SalaryChart data={salaryData} loading={loading} />
        <div className="grid grid-rows-2 gap-4">
          <DepartmentChart data={departmentData} loading={loading} />
          <AlertsPanel alerts={alerts} loading={loading} />
        </div>
      </div>

      <p className="text-sm font-semibold text-gray-700 mb-2">Payroll shortcuts</p>
      <QuickLinks links={isManager ? MANAGER_LINKS : USER_LINKS} />
    </div>
  )
}
