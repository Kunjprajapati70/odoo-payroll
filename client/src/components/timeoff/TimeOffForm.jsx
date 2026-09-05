import { useState } from 'react'
import Input from '../common/Input'
import Select from '../common/Select'
import Button from '../common/Button'
import { isLeaveMonthAllowed } from '../../utils/validators'

const DAY_TYPE_OPTS = [
  { value: 'full_day', label: 'Full Day' },
  { value: 'half_day', label: 'Half Day' },
]

const HALF_PERIOD_OPTS = [
  { value: 'morning', label: 'Morning' },
  { value: 'evening', label: 'Evening' },
]

function monthMinDate() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

export default function TimeOffForm({ employees = [], types = [], onSubmit, loading, onClose, lockedEmployee }) {
  const [form, setForm] = useState({
    employee: lockedEmployee || '',
    leaveType: '',
    startDate: '',
    endDate: '',
    dayType: 'full_day',
    halfDayPeriod: 'morning',
    reason: '',
  })
  const [errors, setErrors] = useState({})
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))
  const minDate = monthMinDate()

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.employee && !lockedEmployee) errs.employee = 'Required'
    if (!form.leaveType) errs.leaveType = 'Required'
    if (!form.startDate) errs.startDate = 'Required'
    else if (!isLeaveMonthAllowed(form.startDate)) errs.startDate = 'Only current or future months allowed'
    if (form.dayType !== 'half_day') {
      if (!form.endDate) errs.endDate = 'Required'
      else if (!isLeaveMonthAllowed(form.endDate)) errs.endDate = 'Only current or future months allowed'
      if (form.startDate && form.endDate && form.startDate > form.endDate) errs.endDate = 'Must be after start date'
    } else if (!form.halfDayPeriod) {
      errs.halfDayPeriod = 'Required'
    }
    if (!form.reason || !form.reason.trim()) errs.reason = 'Reason is required'
    setErrors(errs)
    if (Object.keys(errs).length) return
    onSubmit({
      employee: form.employee || lockedEmployee || undefined,
      timeOffType: form.leaveType,
      startDate: form.startDate,
      endDate: form.dayType === 'half_day' ? form.startDate : form.endDate,
      dayType: form.dayType,
      halfDayPeriod: form.dayType === 'half_day' ? form.halfDayPeriod : undefined,
      reason: form.reason.trim(),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Select label="Employee *" options={employees} value={form.employee} onChange={set('employee')} placeholder="Select employee" error={errors.employee} disabled={!!lockedEmployee} />
        </div>
        <Select label="Leave Type *" options={types} value={form.leaveType} onChange={set('leaveType')} placeholder="Select type" error={errors.leaveType} />
        <Select label="Day Type *" options={DAY_TYPE_OPTS} value={form.dayType} onChange={set('dayType')} />
        {form.dayType === 'half_day' && (
          <div className="col-span-2">
            <Select label="Half Day Period *" options={HALF_PERIOD_OPTS} value={form.halfDayPeriod} onChange={set('halfDayPeriod')} error={errors.halfDayPeriod} />
          </div>
        )}
        <Input label="Start Date *" type="date" min={minDate} value={form.startDate} onChange={set('startDate')} error={errors.startDate} />
        <Input
          label="End Date *"
          type="date"
          min={form.startDate || minDate}
          value={form.dayType === 'half_day' ? form.startDate : form.endDate}
          onChange={set('endDate')}
          error={errors.endDate}
          disabled={form.dayType === 'half_day'}
        />
      </div>
      <div>
        <label className="label-base">Reason *</label>
        <textarea
          className={`input-base resize-none ${errors.reason ? 'border-red-400' : ''}`}
          rows={3}
          value={form.reason}
          onChange={set('reason')}
          placeholder="Why do you need time off?"
        />
        {errors.reason && <p className="mt-1 text-xs text-red-500">{errors.reason}</p>}
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading}>Submit Request</Button>
      </div>
    </form>
  )
}
