import { useState, useEffect, useCallback, useContext } from 'react'
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import ErrorState from '../../components/common/ErrorState'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { salaryService } from '../../services/salaryService'
import { AppContext } from '../../context/AppContext'

function StructureForm({ initial, rules, onSubmit, loading, onClose }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    code: initial?.code || '',
    currency: initial?.currency || 'INR',
    scheduleOf: initial?.scheduleOf || 'monthly',
    rules: initial?.rules?.map(r => r._id || r) || [],
    description: initial?.description || '',
  })
  const [errors, setErrors] = useState({})
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))
  const scheduleOptions = ['monthly', 'bi-monthly', 'weekly']
  const currencies = ['INR', 'USD', 'EUR', 'GBP', 'CAD', 'AUD']

  const toggleRule = (ruleId) => {
    setForm(f => ({
      ...f,
      rules: f.rules.includes(ruleId) ? f.rules.filter(r => r !== ruleId) : [...f.rules, ruleId]
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.name.trim()) errs.name = 'Required'
    if (!form.code.trim()) errs.code = 'Required'
    setErrors(errs)
    if (Object.keys(errs).length) return
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Structure Name *" value={form.name} onChange={set('name')} error={errors.name} placeholder="e.g. Standard Structure" />
        <Input label="Code *" value={form.code} onChange={set('code')} error={errors.code} placeholder="e.g. STD" />
        <Select label="Currency" options={currencies} value={form.currency} onChange={set('currency')} />
        <Select label="Pay Schedule" options={scheduleOptions.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))} value={form.scheduleOf} onChange={set('scheduleOf')} />
      </div>
      {rules.length > 0 && (
        <div>
          <label className="label-base">Salary Rules</label>
          <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
            {rules.map(rule => (
              <label key={rule._id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0">
                <input type="checkbox" checked={form.rules.includes(rule._id)} onChange={() => toggleRule(rule._id)} className="rounded" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-800">{rule.name}</span>
                  <span className="text-xs text-gray-500 ml-2">({rule.code})</span>
                </div>
                <span className="text-xs text-gray-500 capitalize">{rule.category}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      <div>
        <label className="label-base">Description</label>
        <textarea className="input-base resize-none" rows={2} value={form.description} onChange={set('description')} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading}>Save Structure</Button>
      </div>
    </form>
  )
}

export default function SalaryStructures() {
  const { addToast } = useContext(AppContext)
  const [structures, setStructures] = useState([])
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [expanded, setExpanded] = useState({})

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [structRes, ruleRes] = await Promise.allSettled([
        salaryService.getStructures(),
        salaryService.getRules(),
      ])
      if (structRes.status === 'fulfilled') setStructures(Array.isArray(structRes.value) ? structRes.value : structRes.value?.data || [])
      if (ruleRes.status === 'fulfilled') setRules(Array.isArray(ruleRes.value) ? ruleRes.value : ruleRes.value?.data || [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSave = async (data) => {
    setSaving(true)
    try {
      if (modal?.type === 'edit') {
        await salaryService.updateStructure(modal.data._id, data)
        addToast('Structure updated', 'success')
      } else {
        await salaryService.createStructure(data)
        addToast('Structure created', 'success')
      }
      setModal(null)
      fetchData()
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to save structure', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await salaryService.deleteStructure(deleteTarget._id)
      addToast('Structure deleted', 'success')
      setDeleteTarget(null)
      fetchData()
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to delete structure', 'error')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
  if (error) return <div className="card"><ErrorState message={error} onRetry={fetchData} /></div>

  return (
    <div>
      <PageHeader
        title="Salary Structures"
        subtitle="Define salary structures and assigned rules"
        actions={<Button icon={Plus} onClick={() => setModal({ type: 'create' })}>New Structure</Button>}
      />

      <div className="space-y-3">
        {structures.length === 0 && (
          <div className="card p-12 text-center text-sm text-gray-400">No salary structures defined yet.</div>
        )}
        {structures.map(structure => (
          <div key={structure._id} className="card">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setExpanded(e => ({ ...e, [structure._id]: !e[structure._id] }))}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {expanded[structure._id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{structure.name}</p>
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded font-mono">{structure.code}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {structure.currency} · {structure.scheduleOf} · {(structure.rules || []).length} rules
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setModal({ type: 'edit', data: structure })} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                  <Edit2 size={15} />
                </button>
                <button onClick={() => setDeleteTarget(structure)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            {expanded[structure._id] && (
              <div className="border-t border-gray-100 px-5 py-3">
                {!structure.rules?.length ? (
                  <p className="text-sm text-gray-400">No rules assigned.</p>
                ) : (
                  <div className="space-y-1.5">
                    {structure.rules.map((rule, i) => {
                      const r = typeof rule === 'object' ? rule : rules.find(rl => rl._id === rule)
                      if (!r) return null
                      return (
                        <div key={i} className="flex items-center justify-between py-1.5 px-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 w-5 text-right">{r.sequence || i + 1}</span>
                            <span className="text-sm font-medium text-gray-800">{r.name}</span>
                            <span className="font-mono text-xs text-gray-500">{r.code}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs capitalize px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">{r.category}</span>
                            <span className="text-xs text-gray-600">{r.calculationType === 'fixed' || r.computationType === 'fixed' ? `₹${Number(r.amount || 0).toLocaleString('en-IN')}` : (r.calculationType === 'percentage' || r.computationType?.includes('percentage')) ? `${r.percentage}%` : 'Formula'}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.type === 'edit' ? 'Edit Structure' : 'New Salary Structure'} size="lg">
        <StructureForm initial={modal?.data} rules={rules} onSubmit={handleSave} loading={saving} onClose={() => setModal(null)} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Structure"
        message={`Delete "${deleteTarget?.name}"?`}
      />
    </div>
  )
}
