import { Edit2 } from 'lucide-react'
import DataTable from '../common/DataTable'
import StatusBadge from '../common/StatusBadge'
import { formatDate, formatFullName } from '../../utils/formatters'
import RoleGuard from '../auth/RoleGuard'

export default function AttendanceTable({ data, loading, onEdit }) {
  const columns = [
    {
      key: 'employee', label: 'Employee',
      render: r => (
        <div>
          <p className="font-medium text-gray-900">{formatFullName(r.employee) || '—'}</p>
          <p className="text-xs text-gray-500">{r.employee?.employeeId || ''}</p>
        </div>
      )
    },
    { key: 'date', label: 'Date', render: r => <span className="text-sm">{formatDate(r.date)}</span> },
    {
      key: 'timing', label: 'Check In / Out',
      render: r => <span className="text-sm text-gray-600">{r.checkIn || '—'}{r.checkOut ? ` → ${r.checkOut}` : ''}</span>
    },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
    { key: 'notes', label: 'Notes', render: r => <span className="text-xs text-gray-500">{r.notes || '—'}</span> },
    {
      key: 'actions', label: '', width: 60,
      render: row => (
        <div className="flex justify-end">
          <RoleGuard action="attendance:write">
            {onEdit && (
              <button onClick={() => onEdit(row)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                <Edit2 size={15} />
              </button>
            )}
          </RoleGuard>
        </div>
      )
    },
  ]
  return <DataTable columns={columns} data={data} loading={loading} emptyMessage="No attendance records" />
}
