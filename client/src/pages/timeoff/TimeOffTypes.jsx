import { useState, useEffect, useCallback, useContext } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import DataTable from '../../components/common/DataTable'
import ErrorState from '../../components/common/ErrorState'
import { timeOffService } from '../../services/timeOffService'
import { AppContext } from '../../context/AppContext'

function TypeForm({ initial, onSubmit, loading, onClose }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    color: initial?.color || '#4f46e5',
    maxDaysPerYear: initial?.maxDaysPerYear || '',
    requiresApproval: initial?.requiresApproval !== false,
    isPaid: initial?.isPaid !== false,
    description: initial?.description || '',
  })
  const [errors, setErrors] = useState({})
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))
  const toggle = f => () => setForm(p => ({ ...p, [f]: !p[f] }))

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.name.trim()) errs.name = 'Required'
    setErrors(errs)
    if (Object.keys(errs).length) return
    onSubmit({ ...form, maxDaysPerYear: form.maxDaysPerYear ? Number(form.maxDaysPerYear) : undefined })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Input label="Type Name *" value={form.name} onChange={set('name')} error={errors.name} placeholder="e.g. Annual Leave" />
        </div>
        <Input label="Max Days/Year" type="number" value={form.maxDaysPerYear} onChange={set('maxDaysPerYear')} placeholder="Unlimited" />
        <div>
          <label className="label-base">Color</label>
          <input type="color" value={form.color} onChange={set('color')} className="w-full h-10 rounded-lg border border-gray-300 cursor-pointer p-1" />
        </div>
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.requiresApproval} onChange={toggle('requiresApproval')} className="rounded" />
          <span className="text-sm text-gray-700">Requires Approval</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.isPaid} onChange={toggle('isPaid')} className="rounded" />
          <span className="text-sm text-gray-700">Paid Leave</span>
        </label>
      </div>
      <div>
        <label className="label-base">Description</label>
        <textarea className="input-base resize-none" rows={2} value={form.description} onChange={set('description')} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading}>Save</Button>
      </div>
    </form>
  )
}

export default function TimeOffTypes() {
  const { addToast } = useContext(AppContext)
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchTypes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await timeOffService.getTypes()
      setTypes(Array.isArray(res) ? res : res?.data || [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load time-off types')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTypes() }, [fetchTypes])

  const handleSave = async (data) => {
    setSaving(true)
    try {
      if (modal?.type === 'edit') {
        await timeOffService.updateType(modal.data._id, data)
        addToast('Type updated', 'success')
      } else {
        await timeOffService.createType(data)
        addToast('Type created', 'success')
      }
      setModal(null)
      fetchTypes()
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to save type', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await timeOffService.deleteType(deleteTarget._id)
      addToast('Type deleted', 'success')
      setDeleteTarget(null)
      fetchTypes()
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to delete type', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    {
      key: 'name', label: 'Type',
      render: r => (
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: r.color || '#4f46e5' }} />
          <span className="font-medium text-gray-900">{r.name}</span>
        </div>
      )
    },
    { key: 'maxDaysPerYear', label: 'Max Days/Year', render: r => <span className="text-sm">{r.maxDaysPerYear ?? 'Unlimited'}</span> },
    { key: 'isPaid', label: 'Paid', render: r => <span className={`text-xs font-medium ${r.isPaid !== false ? 'text-green-600' : 'text-gray-500'}`}>{r.isPaid !== false ? 'Yes' : 'No'}</span> },
    { key: 'requiresApproval', label: 'Approval', render: r => <span className="text-xs text-gray-600">{r.requiresApproval !== false ? 'Required' : 'Auto-approve'}</span> },
    {
      key: 'actions', label: '', width: 80,
      render: row => (
        <div className="flex items-center gap-1 justify-end">
          <button onClick={() => setModal({ type: 'edit', data: row })} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
            <Edit2 size={15} />
          </button>
          <button onClick={() => setDeleteTarget(row)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
            <Trash2 size={15} />
          </button>
        </div>
      )
    },
  ]

  return (
    <div>
      <PageHeader
        title="Time Off Types"
        subtitle="Configure leave types for your organization"
        actions={<Button icon={Plus} onClick={() => setModal({ type: 'create' })}>Add Type</Button>}
      />
      {error && !loading ? (
        <div className="card"><ErrorState message={error} onRetry={fetchTypes} /></div>
      ) : (
        <div className="card">
          <DataTable columns={columns} data={types} loading={loading} emptyMessage="No time-off types defined" />
        </div>
      )}
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.type === 'edit' ? 'Edit Type' : 'New Time Off Type'} size="md">
        <TypeForm initial={modal?.data} onSubmit={handleSave} loading={saving} onClose={() => setModal(null)} />
      </Modal>
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting} title="Delete Type" message={`Delete "${deleteTarget?.name}"?`} />
    </div>
  )
}
