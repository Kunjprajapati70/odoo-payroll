import { useState, useEffect, useCallback, useContext } from 'react'
import { Plus, Edit2, Trash2, AlertTriangle } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import ErrorState from '../../components/common/ErrorState'
import Pagination from '../../components/common/Pagination'
import { contractService } from '../../services/contractService'
import { employeeService } from '../../services/employeeService'
import { salaryService } from '../../services/salaryService'
import { AppContext } from '../../context/AppContext'
import { formatDate, formatCurrency, formatFullName, formatDateInput } from '../../utils/formatters'
import { CONTRACT_STATUSES } from '../../utils/constants'
import RoleGuard from '../../components/auth/RoleGuard'

const CONTRACT_TYPES = ['Permanent', 'Fixed-term', 'Probation', 'Internship', 'Freelance']

function ContractForm({ initial, employees, structures, onSubmit, loading, onClose }) {
  const [form, setForm] = useState({
    employee: initial?.employee?._id || initial?.employee || '',
    type: initial?.type || '',
    startDate: formatDateInput(initial?.startDate),
    endDate: formatDateInput(initial?.endDate),
    salary: initial?.salary || '',
    salaryStructure: initial?.salaryStructure?._id || initial?.salaryStructure || '',
    status: initial?.status || CONTRACT_STATUSES.ACTIVE,
    notes: initial?.notes || '',
  })
  const [errors, setErrors] = useState({})
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  const statusOpts = Object.values(CONTRACT_STATUSES).map(v => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }))

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.employee) errs.employee = 'Required'
    if (!form.type) errs.type = 'Required'
    if (!form.startDate) errs.startDate = 'Required'
    if (!form.salary) errs.salary = 'Required'
    setErrors(errs)
    if (Object.keys(errs).length) return
    const payload = { ...form }
    if (!payload.endDate) delete payload.endDate
    if (!payload.salaryStructure) delete payload.salaryStructure
    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select label="Employee *" options={employees} value={form.employee} onChange={set('employee')} placeholder="Select employee" error={errors.employee} />
        <Select label="Contract Type *" options={CONTRACT_TYPES} value={form.type} onChange={set('type')} placeholder="Select type" error={errors.type} />
        <Input label="Start Date *" type="date" value={form.startDate} onChange={set('startDate')} error={errors.startDate} />
        <Input label="End Date" type="date" value={form.endDate} onChange={set('endDate')} />
        <Input label="Salary *" type="number" value={form.salary} onChange={set('salary')} error={errors.salary} placeholder="0.00" />
        <Select label="Salary Structure" options={structures} value={form.salaryStructure} onChange={set('salaryStructure')} placeholder="Select structure" />
        <Select label="Status" options={statusOpts} value={form.status} onChange={set('status')} />
      </div>
      <div>
        <label className="label-base">Notes</label>
        <textarea className="input-base resize-none" rows={2} value={form.notes} onChange={set('notes')} placeholder="Optional notes" />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading}>Save Contract</Button>
      </div>
    </form>
  )
}

export default function Contracts() {
  const { addToast } = useContext(AppContext)
  const [contracts, setContracts] = useState([])
  const [employees, setEmployees] = useState([])
  const [structures, setStructures] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchContracts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await contractService.getAll({ page, limit: 20 })
      setContracts(Array.isArray(res) ? res : res?.data || [])
      setTotalPages(res?.totalPages || 1)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load contracts')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchContracts()
    employeeService.getAll({ limit: 200 }).then(res => {
      const list = Array.isArray(res) ? res : res?.data || []
      setEmployees(list.map(e => ({ value: e._id, label: formatFullName(e) })))
    }).catch(() => {})
    salaryService.getStructures().then(res => {
      const list = Array.isArray(res) ? res : res?.data || []
      setStructures(list.map(s => ({ value: s._id, label: s.name })))
    }).catch(() => {})
  }, [fetchContracts])

  const isExpiringSoon = (endDate) => {
    if (!endDate) return false
    const days = (new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24)
    return days >= 0 && days <= 30
  }

  const handleSave = async (data) => {
    setSaving(true)
    try {
      if (modal?.type === 'edit') {
        await contractService.update(modal.data._id, data)
        addToast('Contract updated', 'success')
      } else {
        await contractService.create(data)
        addToast('Contract created', 'success')
      }
      setModal(null)
      fetchContracts()
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to save contract', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await contractService.delete(deleteTarget._id)
      addToast('Contract deleted', 'success')
      setDeleteTarget(null)
      fetchContracts()
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to delete contract', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    {
      key: 'employee',
      label: 'Employee',
      render: r => (
        <div className="font-medium text-gray-900">
          {formatFullName(r.employee) || r.employee?.email || '—'}
          <div className="text-xs text-gray-500">{r.employee?.employeeId || ''}</div>
        </div>
      )
    },
    { key: 'type', label: 'Type', render: r => <span className="text-sm">{r.type}</span> },
    { key: 'startDate', label: 'Start Date', render: r => <span className="text-sm text-gray-600">{formatDate(r.startDate)}</span> },
    {
      key: 'endDate', label: 'End Date',
      render: r => (
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-600">{r.endDate ? formatDate(r.endDate) : '—'}</span>
          {isExpiringSoon(r.endDate) && <AlertTriangle size={13} className="text-orange-500" title="Expiring soon" />}
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
            <button onClick={() => setModal({ type: 'edit', data: row })} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
              <Edit2 size={15} />
            </button>
            <button onClick={() => setDeleteTarget(row)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
              <Trash2 size={15} />
            </button>
          </RoleGuard>
        </div>
      )
    },
  ]

  return (
    <div>
      <PageHeader
        title="Contracts"
        subtitle="Manage employee contracts"
        actions={
          <RoleGuard action="contracts:write">
            <Button icon={Plus} onClick={() => setModal({ type: 'create' })}>Add Contract</Button>
          </RoleGuard>
        }
      />

      {error && !loading ? (
        <div className="card"><ErrorState message={error} onRetry={fetchContracts} /></div>
      ) : (
        <div className="card">
          <DataTable columns={columns} data={contracts} loading={loading} emptyMessage="No contracts found" />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.type === 'edit' ? 'Edit Contract' : 'New Contract'}
        size="lg"
      >
        <ContractForm
          initial={modal?.data}
          employees={employees}
          structures={structures}
          onSubmit={handleSave}
          loading={saving}
          onClose={() => setModal(null)}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Contract"
        message="Delete this contract? This cannot be undone."
      />
    </div>
  )
}
