import { Users, DollarSign, Clock, Umbrella } from 'lucide-react'
import StatCard from '../../components/dashboard/StatCard'
import SalaryChart from '../../components/dashboard/SalaryChart'
import AttendanceChart from '../../components/dashboard/AttendanceChart'
import DepartmentChart from '../../components/dashboard/DepartmentChart'
import AlertsPanel from '../../components/dashboard/AlertsPanel'
import PageHeader from '../../components/layout/PageHeader'

export default function Dashboard() {
  // TODO: fetch from dashboardService
  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Welcome back — here's what's happening today." />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Employees" value="—" icon={Users} color="primary" />
        <StatCard title="Monthly Payroll" value="—" icon={DollarSign} color="green" />
        <StatCard title="Present Today" value="—" icon={Clock} color="blue" />
        <StatCard title="Pending Leaves" value="—" icon={Umbrella} color="orange" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
        <SalaryChart data={[]} />
        <AttendanceChart data={[]} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <DepartmentChart data={[]} />
        <AlertsPanel alerts={[]} />
      </div>
    </div>
  )
}
