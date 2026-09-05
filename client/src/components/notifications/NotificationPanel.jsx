import { Loader2 } from 'lucide-react'
import Button from '../common/Button'
import NotificationItem from './NotificationItem'

export default function NotificationPanel({
  open,
  loading,
  error,
  notifications,
  unreadCount,
  onClose,
  onMarkRead,
  onMarkAllRead,
  onRetry,
}) {
  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-label="Notifications"
        className="absolute right-0 top-10 w-[min(100vw-1.5rem,22rem)] bg-white border border-gray-200 rounded-xl shadow-lg z-40 overflow-hidden"
      >
        <div className="px-3 py-2.5 border-b border-gray-100 flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-gray-900">Notifications</p>
            <p className="text-[11px] text-gray-500">
              {unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button size="sm" variant="secondary" onClick={onMarkAllRead}>
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {loading && (
            <div className="py-10 flex flex-col items-center justify-center text-gray-400 gap-2">
              <Loader2 size={20} className="animate-spin" />
              <p className="text-xs">Loading…</p>
            </div>
          )}

          {!loading && error && (
            <div className="py-8 px-4 text-center">
              <p className="text-sm text-red-600 mb-2">{error}</p>
              <Button size="sm" variant="secondary" onClick={onRetry}>Retry</Button>
            </div>
          )}

          {!loading && !error && notifications.length === 0 && (
            <div className="py-10 px-4 text-center text-gray-500">
              <p className="text-sm font-medium text-gray-700">No notifications yet</p>
              <p className="text-xs mt-1">Leave, payslip, and payroll updates will appear here.</p>
            </div>
          )}

          {!loading && !error && notifications.map((n) => (
            <NotificationItem key={n._id} notification={n} onRead={onMarkRead} />
          ))}
        </div>
      </div>
    </>
  )
}
