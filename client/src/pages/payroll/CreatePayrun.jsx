import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronRight } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/common/Button'
import Select from '../../components/common/Select'
import Input from '../../components/common/Input'
import ErrorState from '../../components/common/ErrorState'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { payrunService } from '../../services/payrunService'
import { salaryService } from '../../services/salaryService'
import { employeeService } from '../../services/employeeService'
import { AppContext } from '../../context/AppContext'
import { formatFullName, formatCurrency } from '../../utils/formatters'
import { ArrowLeft } from 'lucide-react'

const STEPS = [
  'Select Structure',
  'Set Period',
  'Select Employees',
  'Review & Create',
]

function StepIndicator({ current }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
              i < current ? 'bg-primary-600 border-primary-600 text-white' :
              i === current ? 'border-primary-600 text-primary-600 bg-white' :
              'border-gray-300 text-gray-400 bg-white'
            }`}>
              {i < current ? <Check size={14} /> : i + 1}
            </div>
            <span className={`text-xs mt-1.5 font-medium whitespace-nowrap ${i <= current ? 'text-primary-700' : 'text-gray-400'}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 mt-[-14px] ${i < current ? 'bg-primary-600' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function CreatePayrun() {
  const navigate = useNavigate()
  const { addToast } = useContext(AppContext)
  const [step, setStep] = useState(0)
  const [structures, setStructures] = useState([])
  const [employees, setEmployees] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    name: '',
    salaryStructure: '',
    periodStart: '',
    periodEnd: '',
    selectedEmployees: [],
  })

  useEffect(() => {
    Promise.allSettled([
      salaryService.getStructures(),
      employeeService.getAll({ status: 'active', limit: 200 }),
    ]).then(([structRes, empRes]) => {
      if (structRes.status === 'fulfilled') {
        const list = Array.isArray(structRes.value) ? structRes.value : structRes.value?.data || []
        setStructures(list.map(s => ({ value: s._id, label: s.name, data: s })))
      }
      if (empRes.status === 'fulfilled') {
        const list = Array.isArray(empRes.value) ? empRes.value : empRes.value?.data || []
        setEmployees(list)
      }
    }).finally(() => setLoadingData(false))
  }, [])

  const set = f => v => setForm(p => ({ ...p, [f]: v }))

  const toggleEmployee = (id) => {
    setForm(f => ({
      ...f,
      selectedEmployees: f.selectedEmployees.includes(id)
        ? f.selectedEmployees.filter(e => e !== id)
        : [...f.selectedEmployees, id]
    }))
  }

  const selectAll = () => setForm(f => ({ ...f, selectedEmployees: employees.map(e => e._id) }))
  const clearAll = () => setForm(f => ({ ...f, selectedEmployees: [] }))

  const canProceed = () => {
    if (step === 0) return !!form.salaryStructure
    if (step === 1) return !!form.periodStart && !!form.periodEnd && form.periodStart <= form.periodEnd
    if (step === 2) return form.selectedEmployees.length > 0
    return true
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const payload = {
        name: form.name || `Payrun ${form.periodStart} – ${form.periodEnd}`,
        salaryStructure: form.salaryStructure,
        periodStart: form.periodStart,
        periodEnd: form.periodEnd,
        employees: form.selectedEmployees,
      }
      await payrunService.create(payload)
      addToast('Pay run created successfully', 'success')
      navigate('/payroll/payruns')
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to create pay run', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedStructure = structures.find(s => s.value === form.salaryStructure)

  if (loadingData) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>

  return (
    <div>
      <PageHeader
        title="New Pay Run"
        subtitle="Create a new payroll run"
        actions={<Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/payroll/payruns')}>Back</Button>}
      />

      <div className="max-w-3xl">
        <StepIndicator current={step} />

        <div className="card p-6">
          {/* Step 0: Select Structure */}
          {step === 0 && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-gray-800 mb-4">Select Salary Structure</h3>
              <Input label="Pay Run Name (optional)" value={form.name} onChange={e => set('name')(e.target.value)} placeholder="e.g. January 2026 Payroll" />
              <Select
                label="Salary Structure *"
                options={structures}
                value={form.salaryStructure}
                onChange={e => set('salaryStructure')(e.target.value)}
                placeholder="Select a salary structure"
              />
              {selectedStructure && (
                <div className="p-3 bg-primary-50 rounded-lg">
                  <p className="text-sm text-primary-800 font-medium">{selectedStructure.data?.name}</p>
                  <p className="text-xs text-primary-600">{selectedStructure.data?.currency} · {selectedStructure.data?.scheduleOf} · {selectedStructure.data?.rules?.length || 0} rules</p>
                </div>
              )}
            </div>
          )}

          {/* Step 1: Period */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-gray-800 mb-4">Set Payroll Period</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Period Start *" type="date" value={form.periodStart} onChange={e => set('periodStart')(e.target.value)} />
                <Input label="Period End *" type="date" value={form.periodEnd} onChange={e => set('periodEnd')(e.target.value)} />
              </div>
            </div>
          )}

          {/* Step 2: Select Employees */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-800">Select Employees</h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={selectAll}>Select All ({employees.length})</Button>
                  <Button size="sm" variant="ghost" onClick={clearAll}>Clear</Button>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-3">{form.selectedEmployees.length} of {employees.length} selected</p>
              <div className="border border-gray-200 rounded-lg max-h-72 overflow-y-auto">
                {employees.map(emp => (
                  <label key={emp._id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0">
                    <input
                      type="checkbox"
                      checked={form.selectedEmployees.includes(emp._id)}
                      onChange={() => toggleEmployee(emp._id)}
                      className="rounded"
                    />
                    <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-xs font-semibold text-primary-600 shrink-0">
                      {emp.firstName?.[0]}{emp.lastName?.[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{formatFullName(emp)}</p>
                      <p className="text-xs text-gray-500">{emp.department?.name || '—'} · {emp.jobTitle || '—'}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-gray-800 mb-4">Review & Create</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Pay Run Name</span>
                  <span className="text-sm font-medium">{form.name || `Payrun ${form.periodStart}`}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Salary Structure</span>
                  <span className="text-sm font-medium">{selectedStructure?.label || '—'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Period</span>
                  <span className="text-sm font-medium">{form.periodStart} → {form.periodEnd}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Employees</span>
                  <span className="text-sm font-medium">{form.selectedEmployees.length} employees</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                After creating this pay run, go to Pay Runs and click Compute, then Validate, then Mark as Paid.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/payroll/payruns')}>
              {step === 0 ? 'Cancel' : 'Back'}
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()} icon={ChevronRight}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit} loading={submitting} disabled={!canProceed()}>
                Create Pay Run
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
