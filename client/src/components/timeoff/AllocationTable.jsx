import { Edit2 } from 'lucide-react'
import DataTable from '../common/DataTable'
import { formatFullName } from '../../utils/formatters'

export default function AllocationTable({ data, loading, onEdit }) {
  const columns = [
    {
      key: 'employee', label: 'Employee',
      render: r => <span className="font-medium text-gray-900">{formatFullName(r.employee) || '—'}</span>
    },
    { key: 'leaveType', label: 'Leave Type', render: r => <span className="text-sm">{r.timeOffType?.name || r.leaveType?.name || '—'}</span> },
    { key: 'year', label: 'Year', render: r => <span className="text-sm">{r.year}</span> },
    { key: 'allocatedDays', label: 'Allocated', render: r => <span className="text-sm font-medium">{r.allocatedDays ?? r.totalDays} days</span> },
    { key: 'usedDays', label: 'Used', render: r => <span className="text-sm text-orange-600">{r.usedDays || 0} days</span> },
    {
      key: 'remaining', label: 'Remaining',
      render: r => {
        const allocated = r.allocatedDays ?? r.totalDays ?? 0
        const rem = r.remainingDays != null ? r.remainingDays : allocated - (r.usedDays || 0)
        return <span className={`text-sm font-medium ${rem > 0 ? 'text-green-600' : 'text-red-500'}`}>{rem} days</span>
      }
    },
    {
      key: 'actions', label: '', width: 60,
      render: row => onEdit ? (
        <button onClick={() => onEdit(row)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
          <Edit2 size={15} />
        </button>
      ) : null
    },
  ]
  return <DataTable columns={columns} data={data} loading={loading} emptyMessage="No allocations found" />
}
