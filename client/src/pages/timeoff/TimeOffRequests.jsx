import { useState, useEffect, useCallback, useContext } from 'react'
import { Plus, Check, X, MessageSquare } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import Pagination from '../../components/common/Pagination'
import ErrorState from '../../components/common/ErrorState'
import { timeOffService } from '../../services/timeOffService'
import { employeeService } from '../../services/employeeService'
import { AppContext } from '../../context/AppContext'
import { formatDate, formatFullName } from '../../utils/formatters'
import { TIME_OFF_STATUSES } from '../../utils/constants'
import { useAuth } from '../../hooks/useAuth'
import { can } from '../../utils/permissions'

function RequestForm({ employees, types, onSubmit, loading, onClose }) {
  const [form, setForm] = useState({ employee: '', leaveType: '', startDate: '', endDate: '', reason: '' })
  const [errors, setErrors] = useState({})
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.employee) errs.employee = 'Required'
    if (!form.leaveType) errs.leaveType = 'Required'
    if (!form.startDate) errs.startDate = 'Required'
    if (!form.endDate) errs.endDate = 'Required'
    if (form.startDate && form.endDate && form.startDate > form.endDate) errs.endDate = 'Must be after start date'
    setErrors(errs)
    if (Object.keys(errs).length) return
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Select label="Employee *" options={employees} value={form.employee} onChange={set('employee')} placeholder="Select employee" error={errors.employee} />
        </div>
        <Select label="Leave Type *" options={types} value={form.leaveType} onChange={set('leaveType')} placeholder="Select type" error={errors.leaveType} />
        <div />
        <Input label="Start Date *" type="date" value={form.startDate} onChange={set('startDate')} error={errors.startDate} />
        <Input label="End Date *" type="date" value={form.endDate} onChange={set('endDate')} error={errors.endDate} />
      </div>
      <div>
        <label className="label-base">Reason</label>
        <textarea className="input-base resize-none" rows={3} value={form.reason} onChange={set('reason')} placeholder="Optional reason..." />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading}>Submit Request</Button>
      </div>
    </form>
  )
}

function RejectModal({ open, onClose, onConfirm, loading }) {
  const [reason, setReason] = useState('')
  return (
    <Modal open={open} onClose={onClose} title="Reject Request" size="sm">
      <div className="space-y-4">
        <div>
          <label className="label-base">Rejection Reason</label>
          <textarea className="input-base resize-none" rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="Optional reason..." />
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="danger" loading={loading} onClick={() => onConfirm(reason)}>Reject</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function TimeOffRequests() {
  const { user } = useAuth()
  const { addToast } = useContext(AppContext)
  const canApprove = can(user, 'timeoff:approve')
  const [requests, setRequests] = useState([])
  const [employees, setEmployees] = useState([])
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [modal, setModal] = useState(false)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)

  const statusOpts = [
    { value: '', label: 'All Status' },
    ...Object.values(TIME_OFF_STATUSES).map(v => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }))
  ]

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await timeOffService.getRequests({ page, limit: 20, status: statusFilter || undefined })
      setRequests(Array.isArray(res) ? res : res?.data || [])
      setTotalPages(res?.totalPages || 1)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load requests')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => {
    fetchRequests()
    employeeService.getAll({ limit: 200 }).then(res => {
      const list = Array.isArray(res) ? res : res?.data || []
      setEmployees(list.map(e => ({ value: e._id, label: formatFullName(e) })))
    }).catch(() => {})
    timeOffService.getTypes().then(res => {
      const list = Array.isArray(res) ? res : res?.data || []
      setTypes(list.map(t => ({ value: t._id, label: t.name })))
    }).catch(() => {})
  }, [fetchRequests])

  const handleCreate = async (data) => {
    setSaving(true)
    try {
      await timeOffService.createRequest(data)
      addToast('Request submitted', 'success')
      setModal(false)
      fetchRequests()
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to submit request', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleApprove = async (id) => {
    setActionLoading(id)
    try {
      await timeOffService.approveRequest(id)
      addToast('Request approved', 'success')
      fetchRequests()
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to approve', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (reason) => {
    setActionLoading(rejectTarget._id)
    try {
      await timeOffService.rejectRequest(rejectTarget._id, reason)
      addToast('Request rejected', 'success')
      setRejectTarget(null)
      fetchRequests()
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to reject', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const columns = [
    {
      key: 'employee', label: 'Employee',
      render: r => <span className="font-medium text-gray-900">{formatFullName(r.employee) || '—'}</span>
    },
    { key: 'leaveType', label: 'Leave Type', render: r => <span className="text-sm">{r.leaveType?.name || '—'}</span> },
    { key: 'startDate', label: 'Start', render: r => <span className="text-sm text-gray-600">{formatDate(r.startDate)}</span> },
    { key: 'endDate', label: 'End', render: r => <span className="text-sm text-gray-600">{formatDate(r.endDate)}</span> },
    {
      key: 'days', label: 'Days',
      render: r => {
        if (!r.startDate || !r.endDate) return '—'
        const diff = Math.ceil((new Date(r.endDate) - new Date(r.startDate)) / (1000 * 60 * 60 * 24)) + 1
        return <span className="text-sm font-medium">{diff}</span>
      }
    },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
    {
      key: 'actions', label: '', width: 120,
      render: row => (
        <div className="flex items-center gap-1 justify-end">
          {canApprove && row.status === TIME_OFF_STATUSES.PENDING && (
            <>
              <button
                onClick={() => handleApprove(row._id)}
                disabled={actionLoading === row._id}
                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                title="Approve"
              >
                <Check size={15} />
              </button>
              <button
                onClick={() => setRejectTarget(row)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Reject"
              >
                <X size={15} />
              </button>
            </>
          )}
          {row.reason && (
            <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title={row.reason}>
              <MessageSquare size={15} />
            </button>
          )}
        </div>
      )
    },
  ]

  return (
    <div>
      <PageHeader
        title="Time Off Requests"
        subtitle="Manage and approve leave requests"
        actions={<Button icon={Plus} onClick={() => setModal(true)}>New Request</Button>}
      />

      <div className="flex items-center gap-3 mb-4">
        <Select options={statusOpts} value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-40 py-1.5" />
      </div>

      {error && !loading ? (
        <div className="card"><ErrorState message={error} onRetry={fetchRequests} /></div>
      ) : (
        <div className="card">
          <DataTable columns={columns} data={requests} loading={loading} emptyMessage="No time-off requests" />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="New Time Off Request" size="md">
        <RequestForm employees={employees} types={types} onSubmit={handleCreate} loading={saving} onClose={() => setModal(false)} />
      </Modal>

      <RejectModal
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleReject}
        loading={actionLoading === rejectTarget?._id}
      />
    </div>
  )
}
