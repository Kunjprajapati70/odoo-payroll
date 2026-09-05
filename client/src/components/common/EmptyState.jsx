import { Inbox } from 'lucide-react'

export default function EmptyState({ message = 'No data available', icon: Icon = Inbox, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon size={40} className="text-gray-300 mb-3" />
      <p className="text-sm text-gray-500">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
