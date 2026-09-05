import { useState, useEffect, useCallback, useContext } from 'react'
import { Plus, Edit2, Trash2, Clock } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Input from '../../components/common/Input'
import DataTable from '../../components/common/DataTable'
import ErrorState from '../../components/common/ErrorState'
import { scheduleService } from '../../services/scheduleService'
import { AppContext } from '../../context/AppContext'
import RoleGuard from '../../components/auth/RoleGuard'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function ScheduleForm({ initial, onSubmit, loading, onClose }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    workDays: initial?.workDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    hoursPerDay: initial?.hoursPerDay || 8,
    startTime: initial?.startTime || '09:00',
    endTime: initial?.endTime || '17:00',
    description: initial?.description || '',
  })
  const [errors, setErrors] = useState({})

  const toggleDay = (day) => {
    setForm(f => ({
      ...f,
      workDays: f.workDays.includes(day) ? f.workDays.filter(d => d !== day) : [...f.workDays, day]
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.name.trim()) errs.name = 'Required'
    if (!form.workDays.length) errs.workDays = 'Select at least one day'
    setErrors(errs)
    if (Object.keys(errs).length) return
    onSubmit({ ...form, weeklyHours: form.workDays.length * Number(form.hoursPerDay) })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Schedule Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} error={errors.name} placeholder="e.g. Standard 9-5" />
      <div>
        <label className="label-base">Work Days *</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {DAYS.map(day => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                form.workDays.includes(day)
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'
              }`}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
        {errors.workDays && <p className="mt-1 text-xs text-red-500">{errors.workDays}</p>}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Input label="Hours/Day" type="number" min={1} max={24} value={form.hoursPerDay} onChange={e => setForm(f => ({ ...f, hoursPerDay: Number(e.target.value) }))} />
        <Input label="Start Time" type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
        <Input label="End Time" type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
      </div>
      <div>
        <label className="label-base">Weekly Hours (auto)</label>
        <p className="text-sm text-gray-700 font-medium">{form.workDays.length * Number(form.hoursPerDay)} hrs/week</p>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading}>Save Schedule</Button>
      </div>
    </form>
  )
}

export default function Schedules() {
  const { addToast } = useContext(AppContext)
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchSchedules = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await scheduleService.getAll()
      setSchedules(Array.isArray(res) ? res : res?.data || [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load schedules')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSchedules() }, [fetchSchedules])

  const handleSave = async (data) => {
    setSaving(true)
    try {
      if (modal?.type === 'edit') {
        await scheduleService.update(modal.data._id, data)
        addToast('Schedule updated', 'success')
      } else {
        await scheduleService.create(data)
        addToast('Schedule created', 'success')
      }
      setModal(null)
      fetchSchedules()
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to save schedule', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await scheduleService.delete(deleteTarget._id)
      addToast('Schedule deleted', 'success')
      setDeleteTarget(null)
      fetchSchedules()
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to delete schedule', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    {
      key: 'name', label: 'Schedule',
      render: r => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <Clock size={15} className="text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{r.name}</p>
            {r.description && <p className="text-xs text-gray-500">{r.description}</p>}
          </div>
        </div>
      )
    },
    {
      key: 'workDays', label: 'Work Days',
      render: r => (
        <div className="flex flex-wrap gap-1">
          {(r.workDays || []).map(d => (
            <span key={d} className="px-1.5 py-0.5 bg-primary-50 text-primary-700 rounded text-xs">{d.slice(0, 3)}</span>
          ))}
        </div>
      )
    },
    { key: 'hoursPerDay', label: 'Hours/Day', render: r => <span className="text-sm">{r.hoursPerDay || '—'}h</span> },
    { key: 'weeklyHours', label: 'Weekly Hours', render: r => <span className="text-sm font-medium">{r.weeklyHours || ((r.workDays?.length || 0) * (r.hoursPerDay || 0))}h</span> },
    { key: 'timing', label: 'Hours', render: r => r.startTime ? <span className="text-sm text-gray-600">{r.startTime} – {r.endTime}</span> : '—' },
    {
      key: 'actions', label: '', width: 80,
      render: row => (
        <div className="flex items-center gap-1 justify-end">
          <button onClick={() => setModal({ type: 'edit', data: row })} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
            <Edit2 size={15} />
          </button>
          <button onClick={() => setDeleteTarget(row)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
            <Trash2 size={15} />
          </button>
        </div>
      )
    },
  ]

  return (
    <div>
      <PageHeader
        title="Working Schedules"
        subtitle="Define working patterns for your employees"
        actions={<Button icon={Plus} onClick={() => setModal({ type: 'create' })}>Add Schedule</Button>}
      />

      {error && !loading ? (
        <div className="card"><ErrorState message={error} onRetry={fetchSchedules} /></div>
      ) : (
        <div className="card">
          <DataTable columns={columns} data={schedules} loading={loading} emptyMessage="No schedules defined" />
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.type === 'edit' ? 'Edit Schedule' : 'New Schedule'} size="md">
        <ScheduleForm initial={modal?.data} onSubmit={handleSave} loading={saving} onClose={() => setModal(null)} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Schedule"
        message={`Delete "${deleteTarget?.name}"?`}
      />
    </div>
  )
}
