import { useState, useEffect, useCallback, useContext } from 'react'
import { Plus, Edit2 } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import DataTable from '../../components/common/DataTable'
import ErrorState from '../../components/common/ErrorState'
import Pagination from '../../components/common/Pagination'
import { timeOffService } from '../../services/timeOffService'
import { employeeService } from '../../services/employeeService'
import { AppContext } from '../../context/AppContext'
import { formatDate, formatFullName } from '../../utils/formatters'

function AllocationForm({ initial, employees, types, onSubmit, loading, onClose }) {
  const [form, setForm] = useState({
    employee: initial?.employee?._id || initial?.employee || '',
    leaveType: initial?.leaveType?._id || initial?.leaveType || '',
    year: initial?.year || new Date().getFullYear(),
    allocatedDays: initial?.allocatedDays || '',
    usedDays: initial?.usedDays || 0,
  })
  const [errors, setErrors] = useState({})
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.employee) errs.employee = 'Required'
    if (!form.leaveType) errs.leaveType = 'Required'
    if (!form.allocatedDays) errs.allocatedDays = 'Required'
    setErrors(errs)
    if (Object.keys(errs).length) return
    onSubmit({ ...form, allocatedDays: Number(form.allocatedDays), year: Number(form.year) })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Select label="Employee *" options={employees} value={form.employee} onChange={set('employee')} placeholder="Select employee" error={errors.employee} />
        </div>
        <Select label="Leave Type *" options={types} value={form.leaveType} onChange={set('leaveType')} placeholder="Select type" error={errors.leaveType} />
        <Input label="Year" type="number" value={form.year} onChange={set('year')} />
        <Input label="Allocated Days *" type="number" value={form.allocatedDays} onChange={set('allocatedDays')} error={errors.allocatedDays} placeholder="e.g. 21" />
        {initial && <Input label="Used Days" type="number" value={form.usedDays} onChange={set('usedDays')} />}
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading}>Save Allocation</Button>
      </div>
    </form>
  )
}

export default function TimeOffAllocations() {
  const { addToast } = useContext(AppContext)
  const [allocations, setAllocations] = useState([])
  const [employees, setEmployees] = useState([])
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)

  const fetchAllocations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await timeOffService.getAllocations({ page, limit: 20 })
      setAllocations(Array.isArray(res) ? res : res?.data || [])
      setTotalPages(res?.totalPages || 1)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load allocations')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchAllocations()
    employeeService.getAll({ limit: 200 }).then(res => {
      const list = Array.isArray(res) ? res : res?.data || []
      setEmployees(list.map(e => ({ value: e._id, label: formatFullName(e) })))
    }).catch(() => {})
    timeOffService.getTypes().then(res => {
      const list = Array.isArray(res) ? res : res?.data || []
      setTypes(list.map(t => ({ value: t._id, label: t.name })))
    }).catch(() => {})
  }, [fetchAllocations])

  const handleSave = async (data) => {
    setSaving(true)
    try {
      if (modal?.type === 'edit') {
        await timeOffService.updateAllocation(modal.data._id, data)
        addToast('Allocation updated', 'success')
      } else {
        await timeOffService.createAllocation(data)
        addToast('Allocation created', 'success')
      }
      setModal(null)
      fetchAllocations()
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to save allocation', 'error')
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    {
      key: 'employee', label: 'Employee',
      render: r => <span className="font-medium text-gray-900">{formatFullName(r.employee) || '—'}</span>
    },
    { key: 'leaveType', label: 'Leave Type', render: r => <span className="text-sm">{r.leaveType?.name || r.leaveType || '—'}</span> },
    { key: 'year', label: 'Year', render: r => <span className="text-sm">{r.year}</span> },
    { key: 'allocatedDays', label: 'Allocated', render: r => <span className="text-sm font-medium">{r.allocatedDays} days</span> },
    { key: 'usedDays', label: 'Used', render: r => <span className="text-sm text-orange-600">{r.usedDays || 0} days</span> },
    {
      key: 'remaining', label: 'Remaining',
      render: r => {
        const rem = (r.allocatedDays || 0) - (r.usedDays || 0)
        return <span className={`text-sm font-medium ${rem > 0 ? 'text-green-600' : 'text-red-500'}`}>{rem} days</span>
      }
    },
    {
      key: 'actions', label: '', width: 60,
      render: row => (
        <button onClick={() => setModal({ type: 'edit', data: row })} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
          <Edit2 size={15} />
        </button>
      )
    },
  ]

  return (
    <div>
      <PageHeader
        title="Leave Allocations"
        subtitle="Manage leave balance allocations per employee"
        actions={<Button icon={Plus} onClick={() => setModal({ type: 'create' })}>Add Allocation</Button>}
      />
      {error && !loading ? (
        <div className="card"><ErrorState message={error} onRetry={fetchAllocations} /></div>
      ) : (
        <div className="card">
          <DataTable columns={columns} data={allocations} loading={loading} emptyMessage="No allocations found" />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.type === 'edit' ? 'Edit Allocation' : 'New Allocation'} size="md">
        <AllocationForm initial={modal?.data} employees={employees} types={types} onSubmit={handleSave} loading={saving} onClose={() => setModal(null)} />
      </Modal>
    </div>
  )
}
