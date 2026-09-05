import { useCallback, useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { notificationService } from '../../services/notificationService'
import NotificationPanel from './NotificationPanel'

const POLL_MS = 45000

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await notificationService.getAll({ limit: 40 })
      const list = data?.notifications || (Array.isArray(data) ? data : [])
      setNotifications(list)
      setUnreadCount(data?.unreadCount ?? list.filter((n) => !n.isRead).length)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, POLL_MS)
    return () => clearInterval(id)
  }, [load])

  useEffect(() => {
    if (open) load()
  }, [open, load])

  const markRead = async (id) => {
    try {
      await notificationService.markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch {
      /* keep UI stable */
    }
  }

  const markAll = async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch {
      /* keep UI stable */
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationPanel
        open={open}
        loading={loading}
        error={error}
        notifications={notifications}
        unreadCount={unreadCount}
        onClose={() => setOpen(false)}
        onMarkRead={markRead}
        onMarkAllRead={markAll}
        onRetry={load}
      />
    </div>
  )
}
