import { Check, X, MessageSquare } from 'lucide-react'
import DataTable from '../common/DataTable'
import StatusBadge from '../common/StatusBadge'
import { formatDate, formatFullName } from '../../utils/formatters'
import { TIME_OFF_STATUSES } from '../../utils/constants'

export default function TimeOffTable({ data, loading, onApprove, onReject, canApprove }) {
  const columns = [
    {
      key: 'employee', label: 'Employee',
      render: r => <span className="font-medium text-gray-900">{formatFullName(r.employee) || '—'}</span>
    },
    { key: 'leaveType', label: 'Type', render: r => <span className="text-sm">{r.leaveType?.name || '—'}</span> },
    { key: 'startDate', label: 'Start', render: r => <span className="text-sm text-gray-600">{formatDate(r.startDate)}</span> },
    { key: 'endDate', label: 'End', render: r => <span className="text-sm text-gray-600">{formatDate(r.endDate)}</span> },
    {
      key: 'days', label: 'Days',
      render: r => {
        if (!r.startDate || !r.endDate) return '—'
        const d = Math.ceil((new Date(r.endDate) - new Date(r.startDate)) / 86400000) + 1
        return <span className="text-sm font-medium">{d}</span>
      }
    },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
    {
      key: 'actions', label: '', width: 100,
      render: row => (
        <div className="flex items-center gap-1 justify-end">
          {canApprove && row.status === TIME_OFF_STATUSES.PENDING && (
            <>
              {onApprove && <button onClick={() => onApprove(row._id)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded" title="Approve"><Check size={15} /></button>}
              {onReject && <button onClick={() => onReject(row)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Reject"><X size={15} /></button>}
            </>
          )}
          {row.reason && (
            <button className="p-1.5 text-gray-400 hover:text-blue-600 rounded" title={row.reason}><MessageSquare size={15} /></button>
          )}
        </div>
      )
    },
  ]
  return <DataTable columns={columns} data={data} loading={loading} emptyMessage="No time-off requests" />
}
