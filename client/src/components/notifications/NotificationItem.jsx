import { CheckCircle2, FileText, AlertTriangle, Umbrella, Banknote, Info } from 'lucide-react'
import { formatRelativeTime } from '../../utils/formatters'

const TYPE_META = {
  leave: { icon: Umbrella, color: 'text-teal-600 bg-teal-50' },
  payslip: { icon: FileText, color: 'text-blue-600 bg-blue-50' },
  payroll: { icon: Banknote, color: 'text-emerald-600 bg-emerald-50' },
  contract: { icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
  attendance: { icon: CheckCircle2, color: 'text-indigo-600 bg-indigo-50' },
  system: { icon: Info, color: 'text-gray-600 bg-gray-100' },
}

export default function NotificationItem({ notification, onRead }) {
  const meta = TYPE_META[notification.type] || TYPE_META.system
  const Icon = meta.icon
  const unread = !notification.isRead

  return (
    <button
      type="button"
      onClick={() => unread && onRead?.(notification._id)}
      className={`w-full text-left px-3 py-2.5 flex gap-3 transition-colors hover:bg-gray-50 ${
        unread ? 'bg-primary-50/40' : ''
      }`}
    >
      <span className={`mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${meta.color}`}>
        <Icon size={14} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className={`text-sm ${unread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
            {notification.title}
          </span>
          {unread && <span className="mt-1.5 w-2 h-2 rounded-full bg-red-500 shrink-0" aria-hidden />}
        </span>
        <span className="block text-xs text-gray-500 mt-0.5 line-clamp-2">{notification.message}</span>
        <span className="block text-[11px] text-gray-400 mt-1">{formatRelativeTime(notification.createdAt)}</span>
      </span>
    </button>
  )
}
