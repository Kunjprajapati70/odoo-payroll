import { useState, useEffect, useCallback, useContext } from 'react'
import { Plus, Search, Edit2, LogIn, LogOut } from 'lucide-react'
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
import { formatDate, formatDateInput, formatFullName, formatClockTime, formatWorkedDuration, calcHoursWorked } from '../../utils/formatters'
import { ATTENDANCE_STATUSES, ROLES } from '../../utils/constants'
import { useDebounce } from '../../hooks/useDebounce'
import RoleGuard from '../../components/auth/RoleGuard'
import { useAuth } from '../../hooks/useAuth'
import { can } from '../../utils/permissions'

const STATUS_OPTS = [
  { value: '', label: 'All Status' },
  ...Object.values(ATTENDANCE_STATUSES).map(v => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, ' ') }))
]

function AttendanceForm({ initial, employees, onSubmit, loading, onClose, lockedEmployee }) {
  const toTimeInput = (value) => formatClockTime(value)

  const [form, setForm] = useState({
    employee: lockedEmployee || initial?.employee?._id || initial?.employee || '',
    date: formatDateInput(initial?.date) || formatDateInput(new Date()),
    checkIn: toTimeInput(initial?.checkIn || initial?.checkInTime),
    checkOut: toTimeInput(initial?.checkOut || initial?.checkOutTime),
    status: initial?.status || ATTENDANCE_STATUSES.PRESENT,
    notes: initial?.notes || '',
  })
  const [errors, setErrors] = useState({})
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))
  const statusOpts = Object.values(ATTENDANCE_STATUSES).map(v => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, ' ') }))

  const previewHours = form.checkIn && form.checkOut && form.checkOut >= form.checkIn
    ? calcHoursWorked(
      `${form.date}T${form.checkIn.length === 5 ? `${form.checkIn}:00` : form.checkIn}`,
      `${form.date}T${form.checkOut.length === 5 ? `${form.checkOut}:00` : form.checkOut}`
    )
    : null
  const previewDuration = form.checkIn && form.checkOut && form.checkOut >= form.checkIn
    ? formatWorkedDuration(
      `${form.date}T${form.checkIn.length === 5 ? `${form.checkIn}:00` : form.checkIn}`,
      `${form.date}T${form.checkOut.length === 5 ? `${form.checkOut}:00` : form.checkOut}`
    )
    : null

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.employee) errs.employee = 'Required'
    if (!form.date) errs.date = 'Required'
    if (!form.status) errs.status = 'Required'
    if (form.checkIn && form.checkOut && form.checkOut < form.checkIn) {
      errs.checkOut = 'Check-out must be after check-in'
    }
    setErrors(errs)
    if (Object.keys(errs).length) return
    onSubmit({
      employee: form.employee,
      date: form.date,
      checkIn: form.checkIn || '',
      checkOut: form.checkOut || '',
      status: form.status,
      notes: form.notes || '',
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select label="Employee *" options={employees} value={form.employee} onChange={set('employee')} placeholder="Select employee" error={errors.employee} disabled={!!lockedEmployee} />
        <Input label="Date *" type="date" value={form.date} onChange={set('date')} error={errors.date} />
        <Input label="Check In" type="time" step="1" value={form.checkIn} onChange={set('checkIn')} />
        <Input label="Check Out" type="time" step="1" value={form.checkOut} onChange={set('checkOut')} error={errors.checkOut} />
        <Select label="Status *" options={statusOpts} value={form.status} onChange={set('status')} error={errors.status} />
      </div>
      {previewDuration && (
        <p className="text-xs text-gray-500">
          Worked time: <span className="font-mono text-gray-800">{previewDuration}</span>
          {previewHours != null ? ` (${previewHours}h)` : ''}
        </p>
      )}
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
  const { user } = useAuth()
  const { addToast } = useContext(AppContext)
  const isEmployee = user?.role === ROLES.EMPLOYEE
  const canWrite = can(user, 'attendance:write')
  const [records, setRecords] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({ search: '', status: '', dateFrom: '', dateTo: '' })
  const [appliedSearch, setAppliedSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [today, setToday] = useState(null)
  const [punchLoading, setPunchLoading] = useState(false)
  const debouncedSearch = useDebounce(filters.search)

  useEffect(() => { setAppliedSearch(debouncedSearch) }, [debouncedSearch])

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await attendanceService.getAll({
        page, limit: 20,
        search: appliedSearch || undefined,
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
  }, [page, appliedSearch, filters.status, filters.dateFrom, filters.dateTo])

  const fetchToday = useCallback(async () => {
    try {
      const res = await attendanceService.today()
      setToday(res || null)
    } catch {
      setToday(null)
    }
  }, [])

  useEffect(() => {
    if (!isEmployee) {
      employeeService.getAll({ limit: 200 }).then(res => {
        const list = Array.isArray(res) ? res : res?.data || []
        setEmployees(list.map(e => ({ value: e._id, label: formatFullName(e) })))
      }).catch(() => {})
    }
  }, [isEmployee])

  useEffect(() => { setPage(1) }, [appliedSearch, filters.status, filters.dateFrom, filters.dateTo])
  useEffect(() => { fetchRecords() }, [fetchRecords])
  useEffect(() => { fetchToday() }, [fetchToday])

  const handlePunch = async (type) => {
    setPunchLoading(true)
    try {
      if (type === 'in') {
        await attendanceService.checkIn()
        addToast('Checked in successfully', 'success')
      } else {
        await attendanceService.checkOut()
        addToast('Checked out successfully', 'success')
      }
      fetchToday()
      fetchRecords()
    } catch (err) {
      addToast(err?.response?.data?.message || 'Punch failed', 'error')
    } finally {
      setPunchLoading(false)
    }
  }

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
      render: r => {
        // Prefer raw Date/ISO so browser local time is exact (not server-TZ strings)
        const inn = formatClockTime(r.checkIn) || r.checkInTime || ''
        const out = formatClockTime(r.checkOut) || r.checkOutTime || ''
        return (
          <span className="text-sm text-gray-600 font-mono">
            {inn || '—'}{out ? ` → ${out}` : ''}
          </span>
        )
      }
    },
    {
      key: 'hours', label: 'Hours',
      render: r => {
        const duration = formatWorkedDuration(r.checkIn, r.checkOut) || r.duration
        const hours = r.checkIn && r.checkOut ? calcHoursWorked(r.checkIn, r.checkOut) : (r.hoursWorked ?? null)
        if (!duration && (hours == null || hours === 0)) return <span className="text-sm text-gray-400">—</span>
        return (
          <span className="text-sm text-gray-700 font-mono" title={hours != null ? `${hours} hours` : undefined}>
            {duration || '—'}
            {hours != null && duration ? <span className="text-gray-400 ml-1">({hours}h)</span> : null}
          </span>
        )
      },
    },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
    { key: 'notes', label: 'Notes', render: r => <span className="text-xs text-gray-500">{r.notes || '—'}</span> },
    {
      key: 'actions', label: '', width: 80,
      render: row => (
        canWrite ? (
          <div className="flex items-center gap-1 justify-end">
            <button onClick={() => setModal({ type: 'edit', data: row })} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit">
              <Edit2 size={15} />
            </button>
          </div>
        ) : null
      )
    },
  ]

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle={isEmployee ? 'Check in / out and view your attendance' : 'Track daily attendance records'}
        actions={
          canWrite ? (
            <Button icon={Plus} onClick={() => setModal({ type: 'create' })}>Record Attendance</Button>
          ) : null
        }
      />

      {/* Self check-in / check-out for every logged-in user */}
      <div className="card mb-4 p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-900">Today&apos;s punch</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {today?.checkIn
              ? `In ${formatClockTime(today.checkIn) || today.checkInTime}${today.checkOut ? ` · Out ${formatClockTime(today.checkOut) || today.checkOutTime}` : ' · Not checked out'}`
              : 'Not checked in yet'}
            {today?.checkIn && today?.checkOut
              ? ` · ${formatWorkedDuration(today.checkIn, today.checkOut)} (${calcHoursWorked(today.checkIn, today.checkOut)}h)`
              : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button icon={LogIn} variant="secondary" loading={punchLoading} disabled={!!today?.checkIn} onClick={() => handlePunch('in')}>
            Check In
          </Button>
          <Button icon={LogOut} loading={punchLoading} disabled={!today?.checkIn || !!today?.checkOut} onClick={() => handlePunch('out')}>
            Check Out
          </Button>
        </div>
      </div>

      {/* Filters — one row with labels */}
      <div className="card mb-4 p-4 flex flex-nowrap items-end gap-3 overflow-x-auto">
        <div className="relative flex-1 min-w-[160px]">
          <label className="label-base">Search</label>
          <Search size={14} className="absolute left-3 bottom-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search employee... (press Enter)"
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                setAppliedSearch(filters.search)
              }
            }}
            className="input-base pl-8 py-1.5 text-sm"
          />
        </div>
        <div className="w-36 shrink-0">
          <Select label="Status" options={STATUS_OPTS} value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="py-1.5" />
        </div>
        <div className="w-40 shrink-0">
          <Input label="Date From" type="date" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} className="py-1.5" />
        </div>
        <div className="w-40 shrink-0">
          <Input label="Date To" type="date" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} className="py-1.5" />
        </div>
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
