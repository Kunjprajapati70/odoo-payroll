import { useState } from 'react'
import Input from '../common/Input'
import Select from '../common/Select'
import Button from '../common/Button'
import { CONTRACT_STATUSES } from '../../utils/constants'
import { formatDateInput } from '../../utils/formatters'
import { isPositiveNumber } from '../../utils/validators'

const CONTRACT_TYPES = ['Permanent', 'Fixed-term', 'Probation', 'Internship', 'Freelance']

export default function ContractForm({ initialData, employees = [], structures = [], onSubmit, loading, onClose }) {
  const [form, setForm] = useState({
    employee: initialData?.employee?._id || initialData?.employee || '',
    type: initialData?.type || '',
    startDate: formatDateInput(initialData?.startDate),
    endDate: formatDateInput(initialData?.endDate),
    salary: initialData?.salary ?? initialData?.wage ?? '',
    salaryStructure: initialData?.salaryStructure?._id || initialData?.salaryStructure || '',
    status: initialData?.status || CONTRACT_STATUSES.ACTIVE,
    notes: initialData?.notes || '',
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
    if (!form.salary && form.salary !== 0) errs.salary = 'Required'
    else if (!isPositiveNumber(form.salary)) errs.salary = 'Basic salary must be a positive number'
    setErrors(errs)
    if (Object.keys(errs).length) return
    const payload = { ...form, salary: Number(form.salary), wage: Number(form.salary) }
    if (!payload.endDate) delete payload.endDate
    if (!payload.salaryStructure) delete payload.salaryStructure
    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Select label="Employee *" options={employees} value={form.employee} onChange={set('employee')} placeholder="Select employee" error={errors.employee} />
        </div>
        <Select label="Contract Type *" options={CONTRACT_TYPES} value={form.type} onChange={set('type')} placeholder="Select type" error={errors.type} />
        <Select label="Status" options={statusOpts} value={form.status} onChange={set('status')} />
        <Input label="Start Date *" type="date" value={form.startDate} onChange={set('startDate')} error={errors.startDate} />
        <Input label="End Date" type="date" value={form.endDate} onChange={set('endDate')} />
        <Input label="Basic Salary *" type="number" min="1" step="0.01" value={form.salary} onChange={set('salary')} error={errors.salary} placeholder="Positive amount only" />
        <Select label="Salary Structure" options={structures} value={form.salaryStructure} onChange={set('salaryStructure')} placeholder="Select structure" />
      </div>
      <div>
        <label className="label-base">Notes</label>
        <textarea className="input-base resize-none" rows={2} value={form.notes} onChange={set('notes')} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading}>Save Contract</Button>
      </div>
    </form>
  )
}
