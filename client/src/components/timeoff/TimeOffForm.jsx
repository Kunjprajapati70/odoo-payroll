import { useState } from 'react'
import Input from '../common/Input'
import Select from '../common/Select'
import Button from '../common/Button'

export default function TimeOffForm({ employees = [], types = [], onSubmit, loading, onClose }) {
  const [form, setForm] = useState({ employee: '', leaveType: '', startDate: '', endDate: '', reason: '' })
  const [errors, setErrors] = useState({})
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.employee) errs.employee = 'Required'
    if (!form.leaveType) errs.leaveType = 'Required'
    if (!form.startDate) errs.startDate = 'Required'
    if (!form.endDate) errs.endDate = 'Required'
    if (form.startDate && form.endDate && form.startDate > form.endDate) errs.endDate = 'Must be after start date'
    setErrors(errs)
    if (Object.keys(errs).length) return
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Select label="Employee *" options={employees} value={form.employee} onChange={set('employee')} placeholder="Select employee" error={errors.employee} />
        </div>
        <Select label="Leave Type *" options={types} value={form.leaveType} onChange={set('leaveType')} placeholder="Select type" error={errors.leaveType} />
        <div />
        <Input label="Start Date *" type="date" value={form.startDate} onChange={set('startDate')} error={errors.startDate} />
        <Input label="End Date *" type="date" value={form.endDate} onChange={set('endDate')} error={errors.endDate} />
      </div>
      <div>
        <label className="label-base">Reason</label>
        <textarea className="input-base resize-none" rows={3} value={form.reason} onChange={set('reason')} placeholder="Optional..." />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading}>Submit Request</Button>
      </div>
    </form>
  )
}
