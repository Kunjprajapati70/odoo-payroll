import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, Building2, FileText, Calendar,
  Clock, Umbrella, DollarSign, BarChart2, Settings, ChevronDown,
  X, UserCheck
} from 'lucide-react'
import { useState, useContext } from 'react'
import { AppContext } from '../../context/AppContext'
import { useAuth } from '../../hooks/useAuth'

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

function NavGroup({ item, collapsed }) {
  const [open, setOpen] = useState(false)
  const Icon = item.icon
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-primary-50 hover:text-primary-700 transition-colors"
        title={collapsed ? item.label : undefined}
      >
        <span className="flex items-center gap-3">
          <Icon size={16} className="shrink-0" />
          {!collapsed && item.label}
        </span>
        {!collapsed && <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />}
      </button>
      {open && !collapsed && (
        <div className="ml-7 mt-1 space-y-0.5">
          {item.children.map(child => (
            <NavLink
              key={child.to}
              to={child.to}
              className={({ isActive }) =>
                `block px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`
              }
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
  const { sidebarOpen, setSidebarOpen } = useContext(AppContext)
  const { user } = useAuth()

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed lg:relative z-30 lg:z-auto
        flex flex-col bg-white border-r border-gray-200
        h-full lg:h-screen
        transition-all duration-200 ease-in-out
        ${sidebarOpen ? 'w-60 translate-x-0' : 'w-60 -translate-x-full lg:translate-x-0 lg:w-16'}
      `}>
        {/* Logo */}
        <div className="h-14 px-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <p className="font-bold text-gray-900 text-sm leading-none whitespace-nowrap">PeoplePay360</p>
                <p className="text-xs text-gray-400">HR & Payroll</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 lg:hidden"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) =>
            item.children ? (
              <NavGroup key={item.label} item={item} collapsed={!sidebarOpen} />
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                title={!sidebarOpen ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors overflow-hidden ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                  }`
                }
              >
                <item.icon size={16} className="shrink-0" />
                {sidebarOpen && <span className="whitespace-nowrap">{item.label}</span>}
              </NavLink>
            )
          )}
        </nav>

        {/* User bottom */}
        {sidebarOpen && user && (
          <div className="px-3 py-3 border-t border-gray-100 shrink-0">
            <div className="flex items-center gap-2 px-2">
              <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                <UserCheck size={13} className="text-primary-600" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-medium text-gray-800 truncate">{user.name || user.email}</p>
                <p className="text-xs text-gray-400 capitalize truncate">{user.role?.replace(/_/g, ' ')}</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
