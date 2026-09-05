import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, Building2, FileText, Calendar,
  Clock, Umbrella, DollarSign, BarChart2, Settings, ChevronDown
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Employees', icon: Users, to: '/employees' },
  { label: 'Departments', icon: Building2, to: '/departments' },
  { label: 'Contracts', icon: FileText, to: '/contracts' },
  { label: 'Schedules', icon: Calendar, to: '/schedules' },
  { label: 'Attendance', icon: Clock, to: '/attendance' },
  {
    label: 'Time Off', icon: Umbrella, children: [
      { label: 'Types', to: '/time-off/types' },
      { label: 'Allocations', to: '/time-off/allocations' },
      { label: 'Requests', to: '/time-off/requests' },
    ]
  },
  {
    label: 'Payroll', icon: DollarSign, children: [
      { label: 'Salary Structures', to: '/payroll/structures' },
      { label: 'Salary Rules', to: '/payroll/rules' },
      { label: 'Pay Runs', to: '/payroll/payruns' },
      { label: 'Payslips', to: '/payroll/payslips' },
    ]
  },
  { label: 'Reports', icon: BarChart2, to: '/reports' },
  { label: 'Settings', icon: Settings, to: '/settings' },
]

function NavGroup({ item }) {
  const [open, setOpen] = useState(false)
  const Icon = item.icon
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-primary-50 hover:text-primary-700 transition-colors"
      >
        <span className="flex items-center gap-3"><Icon size={16} />{item.label}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="ml-7 mt-1 space-y-1">
          {item.children.map(child => (
            <NavLink
              key={child.to}
              to={child.to}
              className={({ isActive }) => isActive ? 'sidebar-link-active text-xs' : 'sidebar-link text-xs'}
            >
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Sidebar() {
  return (
    <aside className="w-60 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-none">PeoplePay360</p>
            <p className="text-xs text-gray-400">HR & Payroll</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) =>
          item.children ? (
            <NavGroup key={item.label} item={item} />
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link'}
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          )
        )}
      </nav>
    </aside>
  )
}
