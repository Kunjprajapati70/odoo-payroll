import { useState, useEffect, useCallback, useContext } from 'react'
import { Plus, Eye, Check, X, Play, CreditCard, Send } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/common/Button'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Pagination from '../../components/common/Pagination'
import ErrorState from '../../components/common/ErrorState'
import { payrunService } from '../../services/payrunService'
import { AppContext } from '../../context/AppContext'
import { formatDate, formatCurrency } from '../../utils/formatters'
import { PAYRUN_STATUSES } from '../../utils/constants'
import RoleGuard from '../../components/auth/RoleGuard'

const ACTION_META = {
  compute: {
    title: 'Compute Pay Run',
    message: 'Calculate salaries for all selected employees and generate payslips. Continue?',
    success: 'Pay run computed successfully',
    confirmLabel: 'Compute',
    confirmVariant: 'primary',
  },
  approve: {
    title: 'Validate Pay Run',
    message: 'Validate this pay run? This confirms computed payslips are correct.',
    success: 'Pay run validated',
    confirmLabel: 'Validate',
    confirmVariant: 'primary',
  },
  markPaid: {
    title: 'Mark as Paid',
    message: 'Mark this pay run as paid? This confirms salaries have been disbursed.',
    success: 'Pay run marked as paid',
    confirmLabel: 'Mark Paid',
    confirmVariant: 'primary',
  },
  sendPayslips: {
    title: 'Send Payslips',
    message: 'Send payslips by email to all employees in this pay run?',
    success: 'Payslip send completed',
    confirmLabel: 'Send',
    confirmVariant: 'primary',
  },
  cancel: {
    title: 'Cancel Pay Run',
    message: 'Cancel this pay run? This action cannot be undone.',
    success: 'Pay run cancelled',
    confirmLabel: 'Cancel Pay Run',
    confirmVariant: 'danger',
  },
}

export default function Payruns() {
  const navigate = useNavigate()
  const { addToast } = useContext(AppContext)
  const [payruns, setPayruns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [confirmAction, setConfirmAction] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

  const fetchPayruns = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await payrunService.getAll({ page, limit: 20 })
      const list = Array.isArray(res) ? res : res?.data || []
      setPayruns(list)
      setTotalPages(res?.totalPages || 1)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load pay runs')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { fetchPayruns() }, [fetchPayruns])

  const handleAction = async () => {
    if (!confirmAction) return
    const { type, target } = confirmAction
    setActionLoading(target._id)
    try {
      if (type === 'compute') await payrunService.compute(target._id)
      else if (type === 'approve') await payrunService.approve(target._id)
      else if (type === 'markPaid') await payrunService.markPaid(target._id)
      else if (type === 'sendPayslips') await payrunService.sendPayslips(target._id)
      else if (type === 'cancel') await payrunService.cancel(target._id)
      addToast(ACTION_META[type]?.success || 'Action completed', 'success')
      setConfirmAction(null)
      fetchPayruns()
    } catch (err) {
      addToast(err?.response?.data?.message || `Failed to ${type} pay run`, 'error')
    } finally {
      setActionLoading(null)
    }
  }

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
      render: r => (
        <div className="text-sm text-gray-600">
          {r.periodStart ? `${formatDate(r.periodStart)} – ${formatDate(r.periodEnd)}` : '—'}
        </div>
      )
    },
    { key: 'employees', label: 'Employees', render: r => <span className="text-sm">{r.employeeCount ?? (r.employees?.length ?? '—')}</span> },
    { key: 'totalNet', label: 'Total Net', render: r => <span className="text-sm font-medium">{r.totalNet != null ? formatCurrency(r.totalNet) : '—'}</span> },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
    { key: 'createdAt', label: 'Created', render: r => <span className="text-sm text-gray-500">{formatDate(r.createdAt)}</span> },
    {
      key: 'actions', label: '', width: 160,
      render: row => (
        <div className="flex items-center gap-1 justify-end">
          <button onClick={() => navigate(`/payroll/payslips?payrun=${row._id}`)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded" title="View payslips">
            <Eye size={15} />
          </button>
          <RoleGuard action="payroll:write">
            {row.status === PAYRUN_STATUSES.DRAFT && (
              <button onClick={() => setConfirmAction({ type: 'compute', target: row })} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Compute">
                <Play size={15} />
              </button>
            )}
          </RoleGuard>
          <RoleGuard action="payroll:approve">
            {row.status === PAYRUN_STATUSES.COMPUTED && (
              <button onClick={() => setConfirmAction({ type: 'approve', target: row })} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded" title="Validate">
                <Check size={15} />
              </button>
            )}
            {row.status === PAYRUN_STATUSES.VALIDATED && (
              <button onClick={() => setConfirmAction({ type: 'markPaid', target: row })} className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded" title="Mark as Paid">
                <CreditCard size={15} />
              </button>
            )}
            {![PAYRUN_STATUSES.PAID, PAYRUN_STATUSES.CANCELLED].includes(row.status) && (
              <button onClick={() => setConfirmAction({ type: 'cancel', target: row })} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Cancel">
                <X size={15} />
              </button>
            )}
          </RoleGuard>
          <RoleGuard action="payroll:write">
            {(row.status === PAYRUN_STATUSES.VALIDATED || row.status === PAYRUN_STATUSES.PAID) && (
              <button onClick={() => setConfirmAction({ type: 'sendPayslips', target: row })} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="Send Payslips">
                <Send size={15} />
              </button>
            )}
          </RoleGuard>
        </div>
      )
    },
  ]

  const meta = confirmAction ? ACTION_META[confirmAction.type] : null

  return (
    <div>
      <PageHeader
        title="Pay Runs"
        subtitle="Manage payroll runs and processing"
        actions={
          <RoleGuard action="payroll:write">
            <Button icon={Plus} onClick={() => navigate('/payroll/payruns/new')}>New Pay Run</Button>
          </RoleGuard>
        }
      />

      {error && !loading ? (
        <div className="card"><ErrorState message={error} onRetry={fetchPayruns} /></div>
      ) : (
        <div className="card">
          <DataTable columns={columns} data={payruns} loading={loading} emptyMessage="No pay runs yet" />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleAction}
        loading={!!actionLoading}
        title={meta?.title || ''}
        message={meta?.message || ''}
        confirmLabel={meta?.confirmLabel}
        confirmVariant={meta?.confirmVariant}
      />
    </div>
  )
}
