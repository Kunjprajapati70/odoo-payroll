import { Search, X } from 'lucide-react'
import Select from '../common/Select'

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'terminated', label: 'Terminated' },
]

export default function EmployeeFilters({ filters, onChange, departments = [] }) {
  const deptOptions = [
    { value: '', label: 'All Departments' },
    ...departments.map(d => ({ value: d._id, label: d.name })),
  ]

  const hasFilters = filters.search || filters.department || filters.status

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 border-b border-gray-100">
      <div className="relative flex-1 min-w-48">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={filters.search}
          onChange={e => onChange({ ...filters, search: e.target.value })}
          className="input-base pl-8 py-1.5 text-sm"
        />
      </div>
      <Select
        options={deptOptions}
        value={filters.department}
        onChange={e => onChange({ ...filters, department: e.target.value })}
        className="w-44 py-1.5"
      />
      <Select
        options={statusOptions}
        value={filters.status}
        onChange={e => onChange({ ...filters, status: e.target.value })}
        className="w-36 py-1.5"
      />
      {hasFilters && (
        <button
          onClick={() => onChange({ search: '', department: '', status: '' })}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
        >
          <X size={13} /> Clear
        </button>
      )}
    </div>
  )
}
