/**
 * PayrunWizard — re-exports the full CreatePayrun page logic as a composable component.
 * The actual wizard UI lives in pages/payroll/CreatePayrun.jsx.
 * This component wraps the core wizard steps for embedding elsewhere if needed.
 */
import { useState } from 'react'
import { Check, ChevronRight } from 'lucide-react'
import Button from '../common/Button'
import Select from '../common/Select'
import Input from '../common/Input'
import { formatFullName } from '../../utils/formatters'

const STEPS = ['Select Structure', 'Set Period', 'Select Employees', 'Review']

function StepIndicator({ current }) {
  return (
    <div className="flex items-center mb-6">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors ${
              i < current ? 'bg-primary-600 border-primary-600 text-white'
              : i === current ? 'border-primary-600 text-primary-600 bg-white'
              : 'border-gray-300 text-gray-400 bg-white'
            }`}>
              {i < current ? <Check size={12} /> : i + 1}
            </div>
            <span className={`text-xs mt-1 font-medium whitespace-nowrap hidden sm:block ${i <= current ? 'text-primary-700' : 'text-gray-400'}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 mt-[-16px] ${i < current ? 'bg-primary-600' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function PayrunWizard({ structures = [], employees = [], onComplete, onCancel, submitting }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: '',
    salaryStructure: '',
    periodStart: '',
    periodEnd: '',
    selectedEmployees: [],
  })

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))

  const toggleEmp = (id) => setForm(f => ({
    ...f,
    selectedEmployees: f.selectedEmployees.includes(id)
      ? f.selectedEmployees.filter(e => e !== id)
      : [...f.selectedEmployees, id]
  }))

  const canNext = () => {
    if (step === 0) return !!form.salaryStructure
    if (step === 1) return !!form.periodStart && !!form.periodEnd && form.periodStart <= form.periodEnd
    if (step === 2) return form.selectedEmployees.length > 0
    return true
  }

  const selectedStruct = structures.find(s => s.value === form.salaryStructure)

  return (
    <div>
      <StepIndicator current={step} />

      {step === 0 && (
        <div className="space-y-4">
          <Input label="Pay Run Name (optional)" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. January 2026 Payroll" />
          <Select label="Salary Structure *" options={structures} value={form.salaryStructure} onChange={e => set('salaryStructure', e.target.value)} placeholder="Select a salary structure" />
          {selectedStruct && (
            <div className="p-3 bg-primary-50 rounded-lg text-sm text-primary-800">
              {selectedStruct.label} · {selectedStruct.data?.currency} · {selectedStruct.data?.scheduleOf}
            </div>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="grid grid-cols-2 gap-4">
          <Input label="Period Start *" type="date" value={form.periodStart} onChange={e => set('periodStart', e.target.value)} />
          <Input label="Period End *" type="date" value={form.periodEnd} onChange={e => set('periodEnd', e.target.value)} />
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600">{form.selectedEmployees.length} of {employees.length} selected</p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setForm(f => ({ ...f, selectedEmployees: employees.map(e => e._id) }))}>All</Button>
              <Button size="sm" variant="ghost" onClick={() => setForm(f => ({ ...f, selectedEmployees: [] }))}>Clear</Button>
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
            {employees.map(emp => (
              <label key={emp._id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0">
                <input type="checkbox" checked={form.selectedEmployees.includes(emp._id)} onChange={() => toggleEmp(emp._id)} className="rounded" />
                <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-xs font-semibold text-primary-600 shrink-0">
                  {emp.firstName?.[0]}{emp.lastName?.[0]}
                </div>
                <span className="text-sm text-gray-800">{formatFullName(emp)}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          {[
            ['Pay Run Name', form.name || `Payrun ${form.periodStart}`],
            ['Structure', selectedStruct?.label || '—'],
            ['Period', `${form.periodStart} → ${form.periodEnd}`],
            ['Employees', `${form.selectedEmployees.length} selected`],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">{label}</span>
              <span className="text-sm font-medium">{val}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
        <Button variant="secondary" onClick={() => step > 0 ? setStep(s => s - 1) : onCancel?.()}>
          {step === 0 ? 'Cancel' : 'Back'}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()} icon={ChevronRight}>Next</Button>
        ) : (
          <Button onClick={() => onComplete?.({
            name: form.name || `Payrun ${form.periodStart}`,
            salaryStructure: form.salaryStructure,
            periodStart: form.periodStart,
            periodEnd: form.periodEnd,
            employees: form.selectedEmployees,
          })} loading={submitting}>
            Create Pay Run
          </Button>
        )}
      </div>
    </div>
  )
}
