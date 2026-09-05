import { useState, useEffect } from 'react'
import Input from '../common/Input'
import Select from '../common/Select'
import Button from '../common/Button'
import { EMPLOYMENT_TYPES, GENDER_OPTIONS, MARITAL_STATUS } from '../../utils/constants'
import { departmentService } from '../../services/departmentService'
import { scheduleService } from '../../services/scheduleService'
import { formatDateInput } from '../../utils/formatters'

const TABS = ['Personal', 'Job', 'Contact']

export default function EmployeeForm({ initial = {}, onSubmit, loading }) {
  const [tab, setTab] = useState(0)
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    gender: '', maritalStatus: '',
    address: '', city: '', country: '',
    jobTitle: '', employmentType: '',
    status: 'active',
    ...initial,
    dateOfBirth: formatDateInput(initial.dateOfBirth),
    hireDate: formatDateInput(initial.hireDate),
    department: initial.department?._id || initial.department || '',
    schedule: initial.schedule?._id || initial.schedule || '',
  })
  const [errors, setErrors] = useState({})
  const [departments, setDepartments] = useState([])
  const [schedules, setSchedules] = useState([])

  useEffect(() => {
    departmentService.getAll().then(res => {
      const list = Array.isArray(res) ? res : res?.data || []
      setDepartments(list.map(d => ({ value: d._id, label: d.name })))
    }).catch(() => {})
    scheduleService.getAll().then(res => {
      const list = Array.isArray(res) ? res : res?.data || []
      setSchedules(list.map(s => ({ value: s._id, label: s.name })))
    }).catch(() => {})
  }, [])

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const validate = () => {
    const errs = {}
    if (!form.firstName.trim()) errs.firstName = 'Required'
    if (!form.lastName.trim()) errs.lastName = 'Required'
    if (!form.email.trim()) errs.email = 'Required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email'
    if (!form.jobTitle.trim()) errs.jobTitle = 'Required'
    if (!form.hireDate) errs.hireDate = 'Required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    const payload = { ...form }
    if (!payload.dateOfBirth) delete payload.dateOfBirth
    onSubmit(payload)
  }

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'terminated', label: 'Terminated' },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {TABS.map((t, i) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(i)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === i
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="First Name *" value={form.firstName} onChange={set('firstName')} error={errors.firstName} placeholder="John" />
          <Input label="Last Name *" value={form.lastName} onChange={set('lastName')} error={errors.lastName} placeholder="Doe" />
          <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
          <Select label="Gender" options={GENDER_OPTIONS} value={form.gender} onChange={set('gender')} placeholder="Select gender" />
          <Select label="Marital Status" options={MARITAL_STATUS} value={form.maritalStatus} onChange={set('maritalStatus')} placeholder="Select status" />
        </div>
      )}

      {tab === 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Job Title *" value={form.jobTitle} onChange={set('jobTitle')} error={errors.jobTitle} placeholder="Software Engineer" />
          <Select label="Employment Type" options={EMPLOYMENT_TYPES} value={form.employmentType} onChange={set('employmentType')} placeholder="Select type" />
          <Input label="Hire Date *" type="date" value={form.hireDate} onChange={set('hireDate')} error={errors.hireDate} />
          <Select label="Department" options={departments} value={form.department} onChange={set('department')} placeholder="Select department" />
          <Select label="Working Schedule" options={schedules} value={form.schedule} onChange={set('schedule')} placeholder="Select schedule" />
          <Select label="Status" options={statusOptions} value={form.status} onChange={set('status')} />
        </div>
      )}

      {tab === 2 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Email *" type="email" value={form.email} onChange={set('email')} error={errors.email} placeholder="john@company.com" />
          <Input label="Phone" value={form.phone} onChange={set('phone')} placeholder="+1 234 567 8900" />
          <Input label="Address" value={form.address} onChange={set('address')} placeholder="123 Main St" />
          <Input label="City" value={form.city} onChange={set('city')} placeholder="New York" />
          <Input label="Country" value={form.country} onChange={set('country')} placeholder="United States" />
        </div>
      )}

      <div className="flex justify-between pt-2 border-t border-gray-100">
        <div className="flex gap-2">
          {tab > 0 && <Button type="button" variant="secondary" onClick={() => setTab(t => t - 1)}>Back</Button>}
        </div>
        <div className="flex gap-2">
          {tab < TABS.length - 1 ? (
            <Button type="button" onClick={() => setTab(t => t + 1)}>Next</Button>
          ) : (
            <Button type="submit" loading={loading}>Save Employee</Button>
          )}
        </div>
      </div>
    </form>
  )
}
