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
import { salaryService } from '../../services/salaryService'
import { AppContext } from '../../context/AppContext'
import { SALARY_RULE_TYPES } from '../../utils/constants'

const CATEGORIES = Object.values(SALARY_RULE_TYPES)
const CALC_TYPES = ['fixed', 'percentage', 'formula']

const categoryColors = {
  basic: 'bg-blue-100 text-blue-700',
  allowance: 'bg-green-100 text-green-700',
  deduction: 'bg-red-100 text-red-700',
  net: 'bg-purple-100 text-purple-700',
  tax: 'bg-red-100 text-red-700',
}

function RuleForm({ initial, onSubmit, loading, onClose }) {
  const normalizeCalcType = (t) => {
    if (!t) return 'fixed'
    if (String(t).includes('percentage')) return 'percentage'
    if (t === 'formula') return 'formula'
    return 'fixed'
  }

  const [form, setForm] = useState({
    name: initial?.name || '',
    code: initial?.code || '',
    category: initial?.category === 'tax' ? 'deduction' : (initial?.category || SALARY_RULE_TYPES.ALLOWANCE),
    sequence: initial?.sequence || '',
    calculationType: normalizeCalcType(initial?.calculationType || initial?.computationType),
    amount: initial?.amount || '',
    percentage: initial?.percentage || '',
    formula: initial?.formula || '',
    description: initial?.description || '',
  })
  const [errors, setErrors] = useState({})
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  const categoryOpts = CATEGORIES.map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))
  const calcTypeOpts = CALC_TYPES.map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.name.trim()) errs.name = 'Required'
    if (!form.code.trim()) errs.code = 'Required'
    if (form.calculationType === 'fixed' && form.amount !== '' && form.amount != null) {
      if (Number(form.amount) < 0) errs.amount = 'Amount cannot be negative'
      if (form.category === 'basic' && Number(form.amount) < 0) errs.amount = 'Basic salary must be positive'
    }
    if (form.calculationType === 'fixed' && !form.amount && form.amount !== 0) errs.amount = 'Required'
    if (form.calculationType === 'percentage' && !form.percentage && form.percentage !== 0) errs.percentage = 'Required'
    if (form.calculationType === 'percentage' && Number(form.percentage) < 0) errs.percentage = 'Must be positive'
    if (form.calculationType === 'formula' && !form.formula) errs.formula = 'Required'
    setErrors(errs)
    if (Object.keys(errs).length) return
    const payload = {
      name: form.name,
      code: form.code,
      category: form.category,
      sequence: Number(form.sequence),
      description: form.description,
      calculationType: form.calculationType,
      computationType: form.calculationType === 'percentage' ? 'percentage_of_basic' : form.calculationType,
    }
    if (form.calculationType === 'fixed') payload.amount = Number(form.amount)
    if (form.calculationType === 'percentage') payload.percentage = Number(form.percentage)
    if (form.calculationType === 'formula') payload.formula = form.formula
    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Rule Name *" value={form.name} onChange={set('name')} error={errors.name} placeholder="e.g. Housing Allowance" />
        <Input label="Code *" value={form.code} onChange={set('code')} error={errors.code} placeholder="e.g. HOU_ALW" />
        <Select label="Category *" options={categoryOpts} value={form.category} onChange={set('category')} />
        <Input label="Sequence" type="number" value={form.sequence} onChange={set('sequence')} />
        <div className="col-span-2">
          <Select label="Calculation Type" options={calcTypeOpts} value={form.calculationType} onChange={set('calculationType')} />
        </div>
        {form.calculationType === 'fixed' && (
          <div className="col-span-2">
            <Input label="Amount *" type="number" min="0" step="0.01" value={form.amount} onChange={set('amount')} error={errors.amount} placeholder="Positive amount (0 = use contract wage for BASIC)" />
          </div>
        )}
        {form.calculationType === 'percentage' && (
          <div className="col-span-2">
            <Input label="Percentage *" type="number" value={form.percentage} onChange={set('percentage')} error={errors.percentage} placeholder="e.g. 10 for 10%" />
          </div>
        )}
        {form.calculationType === 'formula' && (
          <div className="col-span-2">
            <label className="label-base">Formula *</label>
            <textarea
              className={`input-base font-mono text-xs resize-none ${errors.formula ? 'border-red-400' : ''}`}
              rows={3}
              value={form.formula}
              onChange={set('formula')}
              placeholder="e.g. basic * 0.1"
            />
            {errors.formula && <p className="mt-1 text-xs text-red-500">{errors.formula}</p>}
          </div>
        )}
      </div>
      <div>
        <label className="label-base">Description</label>
        <textarea className="input-base resize-none" rows={2} value={form.description} onChange={set('description')} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading}>Save Rule</Button>
      </div>
    </form>
  )
}

export default function SalaryRules() {
  const { addToast } = useContext(AppContext)
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('')

  const fetchRules = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await salaryService.getRules({ category: categoryFilter || undefined })
      setRules(Array.isArray(res) ? res : res?.data || [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load rules')
    } finally {
      setLoading(false)
    }
  }, [categoryFilter])

  useEffect(() => { fetchRules() }, [fetchRules])

  const handleSave = async (data) => {
    setSaving(true)
    try {
      if (modal?.type === 'edit') {
        await salaryService.updateRule(modal.data._id, data)
        addToast('Rule updated', 'success')
      } else {
        await salaryService.createRule(data)
        addToast('Rule created', 'success')
      }
      setModal(null)
      fetchRules()
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to save rule', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await salaryService.deleteRule(deleteTarget._id)
      addToast('Rule deleted', 'success')
      setDeleteTarget(null)
      fetchRules()
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to delete rule', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const catOpts = [
    { value: '', label: 'All Categories' },
    ...CATEGORIES.map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))
  ]

  const columns = [
    {
      key: 'seq', label: 'ID',
      render: r => <span className="text-sm text-gray-800 font-medium">{r.sequence ?? '—'}</span>
    },
    {
      key: 'name', label: 'Rule',
      render: r => (
        <div>
          <p className="font-medium text-gray-900">{r.name}</p>
          <p className="text-xs font-mono text-gray-500">{r.code}</p>
        </div>
      )
    },
    {
      key: 'category', label: 'Category',
      render: r => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[r.category] || 'bg-gray-100 text-gray-600'}`}>
          {r.category}
        </span>
      )
    },
    {
      key: 'calculation', label: 'Calculation',
      render: r => {
        const calc = r.calculationType || r.computationType || ''
        const isPct = String(calc).includes('percentage')
        const isFixed = calc === 'fixed'
        const isFormula = calc === 'formula'
        return (
          <div className="text-sm">
            <span className="text-gray-600 capitalize">{isPct ? 'percentage' : calc}</span>
            <span className="text-gray-800 ml-2">
              {isFixed && r.amount != null && `₹${Number(r.amount).toLocaleString('en-IN')}`}
              {isPct && r.percentage != null && `${r.percentage}%`}
              {isFormula && <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{r.formula}</code>}
            </span>
          </div>
        )
      }
    },
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
        title="Salary Rules"
        subtitle="Define salary components and calculation rules"
        actions={<Button icon={Plus} onClick={() => setModal({ type: 'create' })}>Add Rule</Button>}
      />

      <div className="flex items-center gap-3 mb-4">
        {catOpts.map(opt => (
          <button
            key={opt.value}
            onClick={() => setCategoryFilter(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              categoryFilter === opt.value
                ? 'bg-primary-600 text-white'
                : 'bg-white border border-gray-300 text-gray-600 hover:border-primary-400'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {error && !loading ? (
        <div className="card"><ErrorState message={error} onRetry={fetchRules} /></div>
      ) : (
        <div className="card">
          <DataTable columns={columns} data={rules} loading={loading} emptyMessage="No salary rules defined" />
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.type === 'edit' ? 'Edit Salary Rule' : 'New Salary Rule'} size="md">
        <RuleForm initial={modal?.data} onSubmit={handleSave} loading={saving} onClose={() => setModal(null)} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Rule"
        message={`Delete rule "${deleteTarget?.name}"?`}
      />
    </div>
  )
}
