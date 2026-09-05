import { Bell, ChevronDown, LogOut, User, Menu, Settings } from 'lucide-react'
import { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { AppContext } from '../../context/AppContext'

export default function Topbar() {
  const { user, logout } = useAuth()
  const { setSidebarOpen } = useContext(AppContext)
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          onClick={() => setSidebarOpen(o => !o)}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg lg:hidden"
        >
          <Menu size={18} />
        </button>

        {/* Desktop sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(o => !o)}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg hidden lg:flex"
          title="Toggle sidebar"
        >
          <Menu size={17} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications placeholder */}
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
          <Bell size={17} />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
              <User size={13} className="text-primary-600" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-gray-800 leading-none">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-400 capitalize leading-none mt-0.5">{user?.role?.replace(/_/g, ' ') || 'Employee'}</p>
            </div>
            <ChevronDown size={13} className="text-gray-400 hidden sm:block" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-10 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1.5 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-800">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <button
                  onClick={() => { navigate('/settings'); setMenuOpen(false) }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Settings size={14} /> Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
