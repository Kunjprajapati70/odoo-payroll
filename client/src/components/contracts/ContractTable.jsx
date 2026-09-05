import { Edit2, Trash2, AlertTriangle } from 'lucide-react'
import DataTable from '../common/DataTable'
import StatusBadge from '../common/StatusBadge'
import { formatDate, formatCurrency, formatFullName } from '../../utils/formatters'
import RoleGuard from '../auth/RoleGuard'

export default function ContractTable({ data, loading, onEdit, onDelete }) {
  const isExpiringSoon = (endDate) => {
    if (!endDate) return false
    const days = (new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24)
    return days >= 0 && days <= 30
  }

  const columns = [
    {
      key: 'employee', label: 'Employee',
      render: r => <span className="font-medium text-gray-900">{formatFullName(r.employee) || '—'}</span>
    },
    { key: 'type', label: 'Type', render: r => <span className="text-sm">{r.type}</span> },
    { key: 'startDate', label: 'Start', render: r => <span className="text-sm text-gray-600">{formatDate(r.startDate)}</span> },
    {
      key: 'endDate', label: 'End',
      render: r => (
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-600">{r.endDate ? formatDate(r.endDate) : '—'}</span>
          {isExpiringSoon(r.endDate) && <AlertTriangle size={13} className="text-orange-500" />}
        </div>
      )
    },
    { key: 'salary', label: 'Salary', render: r => <span className="text-sm font-medium">{formatCurrency(r.salary)}</span> },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
    {
      key: 'actions', label: '', width: 80,
      render: row => (
        <div className="flex items-center gap-1 justify-end">
          <RoleGuard action="contracts:write">
            {onEdit && <button onClick={() => onEdit(row)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={15} /></button>}
            {onDelete && <button onClick={() => onDelete(row)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={15} /></button>}
          </RoleGuard>
        </div>
      )
    },
  ]

  return <DataTable columns={columns} data={data} loading={loading} emptyMessage="No contracts found" />
}
