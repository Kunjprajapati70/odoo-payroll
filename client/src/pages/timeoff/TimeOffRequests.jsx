import { useState, useEffect, useCallback, useContext } from 'react'
import { Plus, Check, X, MessageSquare, Edit2 } from 'lucide-react'
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
import { formatDate, formatDateInput, formatFullName } from '../../utils/formatters'
import { TIME_OFF_STATUSES, ROLES } from '../../utils/constants'
import { useAuth } from '../../hooks/useAuth'
import { can } from '../../utils/permissions'
import { isLeaveMonthAllowed } from '../../utils/validators'

const DAY_TYPE_OPTS = [
  { value: 'full_day', label: 'Full Day' },
  { value: 'half_day', label: 'Half Day' },
]

function monthMinDate() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}-01`
}

const HALF_PERIOD_OPTS = [
  { value: 'morning', label: 'Morning' },
  { value: 'evening', label: 'Evening' },
]

function RequestForm({ initial, employees, types, onSubmit, loading, onClose, lockedEmployee }) {
  const isEdit = !!initial?._id
  const [form, setForm] = useState({
    employee: lockedEmployee || initial?.employee?._id || initial?.employee || '',
    leaveType: initial?.timeOffType?._id || initial?.timeOffType || '',
    startDate: formatDateInput(initial?.startDate) || '',
    endDate: formatDateInput(initial?.endDate) || '',
    dayType: initial?.dayType || 'full_day',
    halfDayPeriod: initial?.halfDayPeriod || 'morning',
    reason: initial?.reason || '',
  })
  const [errors, setErrors] = useState({})
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))
  const minDate = monthMinDate()

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.employee && !lockedEmployee) errs.employee = 'Required'
    if (!form.leaveType) errs.leaveType = 'Required'
    if (!form.startDate) errs.startDate = 'Required'
    else if (!isLeaveMonthAllowed(form.startDate)) errs.startDate = 'Only current or future months allowed'
    if (form.dayType !== 'half_day') {
      if (!form.endDate) errs.endDate = 'Required'
      else if (!isLeaveMonthAllowed(form.endDate)) errs.endDate = 'Only current or future months allowed'
      if (form.startDate && form.endDate && form.startDate > form.endDate) errs.endDate = 'Must be after start date'
    } else if (!form.halfDayPeriod) {
      errs.halfDayPeriod = 'Required'
    }
    if (!form.dayType) errs.dayType = 'Required'
    if (!form.reason || !form.reason.trim()) errs.reason = 'Reason is required'
    setErrors(errs)
    if (Object.keys(errs).length) return

    let endDate = form.endDate
    if (form.dayType === 'half_day') endDate = form.startDate

    onSubmit({
      employee: form.employee || lockedEmployee || undefined,
      timeOffType: form.leaveType,
      startDate: form.startDate,
      endDate,
      dayType: form.dayType,
      halfDayPeriod: form.dayType === 'half_day' ? form.halfDayPeriod : undefined,
      reason: form.reason.trim(),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Select
            label="Employee *"
            options={employees}
            value={form.employee}
            onChange={set('employee')}
            placeholder="Select employee"
            error={errors.employee}
            disabled={!!lockedEmployee || isEdit}
          />
        </div>
        <Select label="Leave Type *" options={types} value={form.leaveType} onChange={set('leaveType')} placeholder="Select type" error={errors.leaveType} />
        <Select label="Day Type *" options={DAY_TYPE_OPTS} value={form.dayType} onChange={set('dayType')} error={errors.dayType} />
        {form.dayType === 'half_day' && (
          <div className="col-span-2">
            <Select label="Half Day Period *" options={HALF_PERIOD_OPTS} value={form.halfDayPeriod} onChange={set('halfDayPeriod')} error={errors.halfDayPeriod} />
          </div>
        )}
        <Input label="Start Date *" type="date" min={minDate} value={form.startDate} onChange={set('startDate')} error={errors.startDate} />
        <Input
          label="End Date *"
          type="date"
          min={form.startDate || minDate}
          value={form.dayType === 'half_day' ? form.startDate : form.endDate}
          onChange={set('endDate')}
          error={errors.endDate}
          disabled={form.dayType === 'half_day'}
        />
      </div>
      <div>
        <label className="label-base">Reason *</label>
        <textarea
          className={`input-base resize-none ${errors.reason ? 'border-red-400' : ''}`}
          rows={3}
          value={form.reason}
          onChange={set('reason')}
          placeholder="Why do you need time off?"
        />
        {errors.reason && <p className="mt-1 text-xs text-red-500">{errors.reason}</p>}
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading}>{isEdit ? 'Update Request' : 'Submit Request'}</Button>
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
  const isEmployee = user?.role === ROLES.EMPLOYEE
  const lockedEmployee = isEmployee ? (user?.employee?._id || user?.employee || '') : ''
  const myEmployeeId = String(user?.employee?._id || user?.employee || '')
  const [requests, setRequests] = useState([])
  const [employees, setEmployees] = useState([])
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [modal, setModal] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)

  const statusOpts = [
    { value: '', label: 'All Status' },
    ...Object.values(TIME_OFF_STATUSES).map(v => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }))
  ]

  const canEditRequest = (row) => {
    if (row.status !== TIME_OFF_STATUSES.PENDING) return false
    if (isEmployee) {
      return String(row.employee?._id || row.employee) === myEmployeeId
    }
    return true
  }

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
    if (!isEmployee) {
      employeeService.getAll({ limit: 200 }).then(res => {
        const list = Array.isArray(res) ? res : res?.data || []
        setEmployees(list.map(e => ({ value: e._id, label: formatFullName(e) })))
      }).catch(() => {})
    } else if (lockedEmployee) {
      setEmployees([{ value: lockedEmployee, label: user?.name || 'Me' }])
    }
    timeOffService.getTypes().then(res => {
      const list = Array.isArray(res) ? res : res?.data || []
      setTypes(list.map(t => ({ value: t._id, label: t.name })))
    }).catch(() => {})
  }, [fetchRequests, isEmployee, lockedEmployee, user?.name])

  const handleSave = async (data) => {
    setSaving(true)
    try {
      if (modal?.type === 'edit') {
        await timeOffService.updateRequest(modal.data._id, data)
        addToast('Request updated', 'success')
      } else {
        await timeOffService.createRequest(data)
        addToast('Request submitted', 'success')
      }
      setModal(null)
      fetchRequests()
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to save request', 'error')
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
    { key: 'leaveType', label: 'Leave Type', render: r => <span className="text-sm">{r.timeOffType?.name || r.leaveType?.name || '—'}</span> },
    { key: 'startDate', label: 'Start', render: r => <span className="text-sm text-gray-600">{formatDate(r.startDate)}</span> },
    { key: 'endDate', label: 'End', render: r => <span className="text-sm text-gray-600">{formatDate(r.endDate)}</span> },
    {
      key: 'dayType', label: 'Type',
      render: r => (
        <span className="text-xs capitalize text-gray-600">
          {(r.dayType || 'full_day').replace('_', ' ')}
          {r.dayType === 'half_day' && r.halfDayPeriod ? ` (${r.halfDayPeriod})` : ''}
        </span>
      )
    },
    {
      key: 'days', label: 'Days',
      render: r => <span className="text-sm font-medium">{r.days ?? '—'}</span>
    },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
    {
      key: 'actions', label: '', width: 140,
      render: row => (
        <div className="flex items-center gap-1 justify-end">
          {canEditRequest(row) && (
            <button
              onClick={() => setModal({ type: 'edit', data: row })}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Edit request"
            >
              <Edit2 size={15} />
            </button>
          )}
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
        subtitle={isEmployee ? 'Request leave and edit while pending approval' : 'Manage and approve leave requests'}
        actions={<Button icon={Plus} onClick={() => setModal({ type: 'create' })}>New Request</Button>}
      />

      <div className="card mb-4 p-4 flex flex-nowrap items-end gap-3 overflow-x-auto">
        <div className="w-40 shrink-0">
          <Select label="Status" options={statusOpts} value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="py-1.5" />
        </div>
      </div>

      {error && !loading ? (
        <div className="card"><ErrorState message={error} onRetry={fetchRequests} /></div>
      ) : (
        <div className="card">
          <DataTable columns={columns} data={requests} loading={loading} emptyMessage="No time-off requests" />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.type === 'edit' ? 'Edit Time Off Request' : 'New Time Off Request'}
        size="md"
      >
        {modal && (
          <RequestForm
            key={modal?.data?._id || 'new'}
            initial={modal?.type === 'edit' ? modal.data : null}
            employees={employees}
            types={types}
            onSubmit={handleSave}
            loading={saving}
            onClose={() => setModal(null)}
            lockedEmployee={lockedEmployee}
          />
        )}
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
