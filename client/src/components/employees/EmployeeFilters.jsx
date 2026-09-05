import { Search, X } from 'lucide-react'
import Select from '../common/Select'

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'terminated', label: 'Terminated' },
]

export default function EmployeeFilters({ filters, onChange, departments = [], onSearchSubmit }) {
  const deptOptions = [
    { value: '', label: 'All Departments' },
    ...departments.map(d => ({ value: d._id, label: d.name })),
  ]

  const hasFilters = filters.search || filters.department || filters.status

  return (
    <div className="flex flex-nowrap items-end gap-3 p-4 bg-gray-50 border-b border-gray-100 overflow-x-auto">
      <div className="relative flex-1 min-w-[180px]">
        <label className="label-base">Search</label>
        <Search size={14} className="absolute left-3 bottom-2.5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or email... (press Enter)"
          value={filters.search}
          onChange={e => onChange({ ...filters, search: e.target.value })}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onSearchSubmit?.(filters.search)
            }
          }}
          className="input-base pl-8 py-1.5 text-sm"
        />
      </div>
      <div className="w-44 shrink-0">
        <Select
          label="Department"
          options={deptOptions}
          value={filters.department}
          onChange={e => onChange({ ...filters, department: e.target.value })}
          className="py-1.5"
        />
      </div>
      <div className="w-36 shrink-0">
        <Select
          label="Status"
          options={statusOptions}
          value={filters.status}
          onChange={e => onChange({ ...filters, status: e.target.value })}
          className="py-1.5"
        />
      </div>
      {hasFilters && (
        <button
          onClick={() => {
            onChange({ search: '', department: '', status: '' })
            onSearchSubmit?.('')
          }}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 pb-2 shrink-0"
        >
          <X size={13} /> Clear
        </button>
      )}
    </div>
  )
}
