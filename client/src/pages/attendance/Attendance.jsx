import { useState, useEffect, useCallback, useContext } from 'react'
import { Plus, Search } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import Pagination from '../../components/common/Pagination'
import ErrorState from '../../components/common/ErrorState'
import { attendanceService } from '../../services/attendanceService'
import { employeeService } from '../../services/employeeService'
import { AppContext } from '../../context/AppContext'
import { formatDate, formatFullName } from '../../utils/formatters'
import { ATTENDANCE_STATUSES } from '../../utils/constants'
import { useDebounce } from '../../hooks/useDebounce'
import RoleGuard from '../../components/auth/RoleGuard'

const STATUS_OPTS = [
  { value: '', label: 'All Status' },
  ...Object.values(ATTENDANCE_STATUSES).map(v => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, ' ') }))
]

function AttendanceForm({ initial, employees, onSubmit, loading, onClose }) {
  const [form, setForm] = useState({
    employee: initial?.employee?._id || initial?.employee || '',
    date: initial?.date ? initial.date.split('T')[0] : new Date().toISOString().split('T')[0],
    checkIn: initial?.checkIn || '',
    checkOut: initial?.checkOut || '',
    status: initial?.status || ATTENDANCE_STATUSES.PRESENT,
    notes: initial?.notes || '',
  })
  const [errors, setErrors] = useState({})
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))
  const statusOpts = Object.values(ATTENDANCE_STATUSES).map(v => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, ' ') }))

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.employee) errs.employee = 'Required'
    if (!form.date) errs.date = 'Required'
    if (!form.status) errs.status = 'Required'
    setErrors(errs)
    if (Object.keys(errs).length) return
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select label="Employee *" options={employees} value={form.employee} onChange={set('employee')} placeholder="Select employee" error={errors.employee} />
        <Input label="Date *" type="date" value={form.date} onChange={set('date')} error={errors.date} />
        <Input label="Check In" type="time" value={form.checkIn} onChange={set('checkIn')} />
        <Input label="Check Out" type="time" value={form.checkOut} onChange={set('checkOut')} />
        <Select label="Status *" options={statusOpts} value={form.status} onChange={set('status')} error={errors.status} />
      </div>
      <div>
        <label className="label-base">Notes</label>
        <textarea className="input-base resize-none" rows={2} value={form.notes} onChange={set('notes')} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading}>Save</Button>
      </div>
    </form>
  )
}

export default function Attendance() {
  const { addToast } = useContext(AppContext)
  const [records, setRecords] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({ search: '', status: '', dateFrom: '', dateTo: '' })
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const debouncedSearch = useDebounce(filters.search)

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await attendanceService.getAll({
        page, limit: 20,
        search: debouncedSearch || undefined,
        status: filters.status || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
      })
      setRecords(Array.isArray(res) ? res : res?.data || [])
      setTotalPages(res?.totalPages || 1)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load attendance')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, filters.status, filters.dateFrom, filters.dateTo])

  useEffect(() => {
    employeeService.getAll({ limit: 200 }).then(res => {
      const list = Array.isArray(res) ? res : res?.data || []
      setEmployees(list.map(e => ({ value: e._id, label: formatFullName(e) })))
    }).catch(() => {})
  }, [])

  useEffect(() => { setPage(1) }, [debouncedSearch, filters.status, filters.dateFrom, filters.dateTo])
  useEffect(() => { fetchRecords() }, [fetchRecords])

  const handleSave = async (data) => {
    setSaving(true)
    try {
      if (modal?.type === 'edit') {
        await attendanceService.update(modal.data._id, data)
        addToast('Attendance updated', 'success')
      } else {
        await attendanceService.create(data)
        addToast('Attendance recorded', 'success')
      }
      setModal(null)
      fetchRecords()
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to save attendance', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await attendanceService.delete(deleteTarget._id)
      addToast('Record deleted', 'success')
      setDeleteTarget(null)
      fetchRecords()
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to delete record', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    {
      key: 'employee', label: 'Employee',
      render: r => (
        <div>
          <p className="font-medium text-gray-900">{formatFullName(r.employee) || r.employee?.email || '—'}</p>
          <p className="text-xs text-gray-500">{r.employee?.employeeId || ''}</p>
        </div>
      )
    },
    { key: 'date', label: 'Date', render: r => <span className="text-sm text-gray-700">{formatDate(r.date)}</span> },
    {
      key: 'checkIn', label: 'Check In / Out',
      render: r => (
        <span className="text-sm text-gray-600">
          {r.checkIn || '—'} {r.checkOut ? `→ ${r.checkOut}` : ''}
        </span>
      )
    },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
    { key: 'notes', label: 'Notes', render: r => <span className="text-xs text-gray-500">{r.notes || '—'}</span> },
    {
      key: 'actions', label: '', width: 80,
      render: row => (
        <div className="flex items-center gap-1 justify-end">
          <RoleGuard action="attendance:write">
            <button onClick={() => setModal({ type: 'edit', data: row })} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
              <Plus size={13} className="rotate-45" />
            </button>
          </RoleGuard>
        </div>
      )
    },
  ]

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle="Track daily attendance records"
        actions={
          <RoleGuard action="attendance:write">
            <Button icon={Plus} onClick={() => setModal({ type: 'create' })}>Record Attendance</Button>
          </RoleGuard>
        }
      />

      {/* Filters */}
      <div className="card mb-4 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-40">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search employee..."
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            className="input-base pl-8 py-1.5 text-sm"
          />
        </div>
        <Select options={STATUS_OPTS} value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="w-36 py-1.5" />
        <Input type="date" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} placeholder="From" className="w-36 py-1.5" />
        <Input type="date" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} placeholder="To" className="w-36 py-1.5" />
      </div>

      {error && !loading ? (
        <div className="card"><ErrorState message={error} onRetry={fetchRecords} /></div>
      ) : (
        <div className="card">
          <DataTable columns={columns} data={records} loading={loading} emptyMessage="No attendance records found" />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.type === 'edit' ? 'Edit Attendance' : 'Record Attendance'} size="md">
        <AttendanceForm initial={modal?.data} employees={employees} onSubmit={handleSave} loading={saving} onClose={() => setModal(null)} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Record"
        message="Delete this attendance record?"
      />
    </div>
  )
}
