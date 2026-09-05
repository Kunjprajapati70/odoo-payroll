import { useState, useEffect, useCallback, useContext } from 'react'
import { Plus, Edit2, Trash2, Building2 } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Input from '../../components/common/Input'
import ErrorState from '../../components/common/ErrorState'
import DataTable from '../../components/common/DataTable'
import { departmentService } from '../../services/departmentService'
import { AppContext } from '../../context/AppContext'
import RoleGuard from '../../components/auth/RoleGuard'

function DepartmentForm({ initial, onSubmit, loading, onClose }) {
  const [form, setForm] = useState({ name: initial?.name || '', description: initial?.description || '' })
  const [errors, setErrors] = useState({})

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.name.trim()) errs.name = 'Required'
    setErrors(errs)
    if (Object.keys(errs).length) return
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Department Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} error={errors.name} placeholder="e.g. Engineering" />
      <div>
        <label className="label-base">Description</label>
        <textarea
          className="input-base resize-none"
          rows={3}
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Optional description"
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading}>Save</Button>
      </div>
    </form>
  )
}

export default function Departments() {
  const { addToast } = useContext(AppContext)
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modal, setModal] = useState(null) // null | { type: 'create'|'edit', data? }
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchDepts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await departmentService.getAll()
      setDepartments(Array.isArray(res) ? res : res?.data || [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load departments')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDepts() }, [fetchDepts])

  const handleSave = async (data) => {
    setSaving(true)
    try {
      if (modal?.type === 'edit') {
        await departmentService.update(modal.data._id, data)
        addToast('Department updated', 'success')
      } else {
        await departmentService.create(data)
        addToast('Department created', 'success')
      }
      setModal(null)
      fetchDepts()
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to save department', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await departmentService.delete(deleteTarget._id)
      addToast('Department deleted', 'success')
      setDeleteTarget(null)
      fetchDepts()
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to delete department', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    {
      key: 'name',
      label: 'Department',
      render: row => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
            <Building2 size={15} className="text-primary-600" />
          </div>
          <span className="font-medium text-gray-900">{row.name}</span>
        </div>
      )
    },
    { key: 'description', label: 'Description', render: r => <span className="text-sm text-gray-500">{r.description || '—'}</span> },
    { key: 'employeeCount', label: 'Employees', render: r => <span className="text-sm text-gray-700">{r.employeeCount ?? '—'}</span> },
    {
      key: 'actions', label: '', width: 100,
      render: row => (
        <div className="flex items-center gap-1 justify-end">
          <RoleGuard action="departments:write">
            <button onClick={() => setModal({ type: 'edit', data: row })} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit">
              <Edit2 size={15} />
            </button>
            <button onClick={() => setDeleteTarget(row)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
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
        title="Departments"
        subtitle="Organize your company structure"
        actions={
          <RoleGuard action="departments:write">
            <Button icon={Plus} onClick={() => setModal({ type: 'create' })}>Add Department</Button>
          </RoleGuard>
        }
      />

      {error && !loading ? (
        <div className="card"><ErrorState message={error} onRetry={fetchDepts} /></div>
      ) : (
        <div className="card">
          <DataTable columns={columns} data={departments} loading={loading} emptyMessage="No departments yet" />
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.type === 'edit' ? 'Edit Department' : 'New Department'}
        size="sm"
      >
        <DepartmentForm
          initial={modal?.data}
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
        title="Delete Department"
        message={`Delete "${deleteTarget?.name}"? This may affect employees in this department.`}
      />
    </div>
  )
}
