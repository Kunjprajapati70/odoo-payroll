import { capitalize } from '../../utils/formatters'

const colors = {
  active:     'bg-green-100 text-green-700',
  approved:   'bg-green-100 text-green-700',
  present:    'bg-green-100 text-green-700',
  paid:       'bg-emerald-100 text-emerald-700',
  done:       'bg-blue-100 text-blue-700',
  processing: 'bg-yellow-100 text-yellow-700',
  pending:    'bg-yellow-100 text-yellow-700',
  late:       'bg-orange-100 text-orange-700',
  draft:      'bg-gray-100 text-gray-600',
  expired:    'bg-gray-100 text-gray-500',
  absent:     'bg-red-100 text-red-600',
  rejected:   'bg-red-100 text-red-600',
  cancelled:  'bg-red-100 text-red-600',
  terminated: 'bg-red-100 text-red-600',
  on_leave:   'bg-purple-100 text-purple-700',
  half_day:   'bg-indigo-100 text-indigo-700',
  inactive:   'bg-gray-100 text-gray-500',
}

export default function StatusBadge({ status }) {
  const cls = colors[status] || 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {capitalize(status)}
    </span>
  )
}
