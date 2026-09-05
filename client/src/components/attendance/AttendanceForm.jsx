import { useState } from 'react'
import Input from '../common/Input'
import Select from '../common/Select'
import Button from '../common/Button'
import { ATTENDANCE_STATUSES } from '../../utils/constants'

export default function AttendanceForm({ initial, employees = [], onSubmit, loading, onClose }) {
  const [form, setForm] = useState({
    employee: initial?.employee?._id || initial?.employee || '',
    date: initial?.date ? initial.date.split('T')[0] : new Date().toISOString().split('T')[0],
    checkIn: initial?.checkIn || '',
    checkOut: initial?.checkOut || '',
    status: initial?.status || ATTENDANCE_STATUSES.PRESENT,
    notes: initial?.notes || '',
  })
  const [errors, setErrors] = useState({})
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))
  const statusOpts = Object.values(ATTENDANCE_STATUSES).map(v => ({
    value: v, label: v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, ' ')
  }))

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.employee) errs.employee = 'Required'
    if (!form.date) errs.date = 'Required'
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
        <Input label="Date *" type="date" value={form.date} onChange={set('date')} error={errors.date} />
        <Select label="Status *" options={statusOpts} value={form.status} onChange={set('status')} />
        <Input label="Check In" type="time" value={form.checkIn} onChange={set('checkIn')} />
        <Input label="Check Out" type="time" value={form.checkOut} onChange={set('checkOut')} />
      </div>
      <div>
        <label className="label-base">Notes</label>
        <textarea className="input-base resize-none" rows={2} value={form.notes} onChange={set('notes')} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading}>Save</Button>
      </div>
    </form>
  )
}
