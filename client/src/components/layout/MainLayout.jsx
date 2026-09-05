import { useEffect, useContext } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import ToastContainer from '../common/Toast'
import { AppContext } from '../../context/AppContext'

export default function MainLayout() {
  const { setSidebarOpen } = useContext(AppContext)

  // Open sidebar by default on large screens
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    setSidebarOpen(mq.matches)
    const handler = (e) => setSidebarOpen(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [setSidebarOpen])

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  )
}
