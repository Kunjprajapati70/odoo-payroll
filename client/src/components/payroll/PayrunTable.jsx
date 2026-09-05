import { Eye, Play, Check, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DataTable from '../common/DataTable'
import StatusBadge from '../common/StatusBadge'
import { formatDate, formatCurrency } from '../../utils/formatters'
import { PAYRUN_STATUSES } from '../../utils/constants'
import RoleGuard from '../auth/RoleGuard'

export default function PayrunTable({ data, loading, onCompute, onApprove, onCancel }) {
  const navigate = useNavigate()
  const columns = [
    {
      key: 'name', label: 'Pay Run',
      render: r => (
        <div>
          <p className="font-medium text-gray-900">{r.name || `Payrun #${r._id?.slice(-6)}`}</p>
          <p className="text-xs text-gray-500">{r.salaryStructure?.name || '—'}</p>
        </div>
      )
    },
    {
      key: 'period', label: 'Period',
      render: r => <span className="text-sm text-gray-600">{r.periodStart ? `${formatDate(r.periodStart)} – ${formatDate(r.periodEnd)}` : '—'}</span>
    },
    { key: 'employees', label: 'Employees', render: r => <span className="text-sm">{r.employeeCount ?? r.employees?.length ?? '—'}</span> },
    { key: 'totalNet', label: 'Total Net', render: r => <span className="text-sm font-medium">{r.totalNet != null ? formatCurrency(r.totalNet) : '—'}</span> },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
    {
      key: 'actions', label: '', width: 120,
      render: row => (
        <div className="flex items-center gap-1 justify-end">
          <button onClick={() => navigate(`/payroll/payslips?payrun=${row._id}`)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded" title="View payslips">
            <Eye size={15} />
          </button>
          <RoleGuard action="payroll:approve">
            {row.status === PAYRUN_STATUSES.DRAFT && onCompute && (
              <button onClick={() => onCompute(row)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Compute">
                <Play size={15} />
              </button>
            )}
            {(row.status === PAYRUN_STATUSES.DONE || row.status === PAYRUN_STATUSES.PROCESSING) && onApprove && (
              <button onClick={() => onApprove(row)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded" title="Approve">
                <Check size={15} />
              </button>
            )}
            {![PAYRUN_STATUSES.APPROVED, PAYRUN_STATUSES.CANCELLED].includes(row.status) && onCancel && (
              <button onClick={() => onCancel(row)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Cancel">
                <X size={15} />
              </button>
            )}
          </RoleGuard>
        </div>
      )
    },
  ]
  return <DataTable columns={columns} data={data} loading={loading} emptyMessage="No pay runs yet" />
}
