import { Search, X } from 'lucide-react'
import Select from '../common/Select'
import Input from '../common/Input'
import { ATTENDANCE_STATUSES } from '../../utils/constants'

const STATUS_OPTS = [
  { value: '', label: 'All Status' },
  ...Object.values(ATTENDANCE_STATUSES).map(v => ({
    value: v, label: v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, ' ')
  }))
]

export default function AttendanceFilters({ filters, onChange }) {
  const hasFilters = filters.search || filters.status || filters.dateFrom || filters.dateTo
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 border-b border-gray-100">
      <div className="relative flex-1 min-w-40">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search employee..."
          value={filters.search}
          onChange={e => onChange({ ...filters, search: e.target.value })}
          className="input-base pl-8 py-1.5 text-sm"
        />
      </div>
      <Select options={STATUS_OPTS} value={filters.status} onChange={e => onChange({ ...filters, status: e.target.value })} className="w-36 py-1.5" />
      <Input type="date" value={filters.dateFrom} onChange={e => onChange({ ...filters, dateFrom: e.target.value })} className="w-36 py-1.5" />
      <Input type="date" value={filters.dateTo} onChange={e => onChange({ ...filters, dateTo: e.target.value })} className="w-36 py-1.5" />
      {hasFilters && (
        <button
          onClick={() => onChange({ search: '', status: '', dateFrom: '', dateTo: '' })}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
        >
          <X size={13} /> Clear
        </button>
      )}
    </div>
  )
}
