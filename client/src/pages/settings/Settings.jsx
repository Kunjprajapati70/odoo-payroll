import { useState, useContext } from 'react'
import { User, Lock, Bell, Building2 } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { AppContext } from '../../context/AppContext'
import { useAuth } from '../../hooks/useAuth'
import { authService } from '../../services/authService'
import { isValidPhone, isRequired, normalizePhone, minLength } from '../../utils/validators'

const TABS = [
  { id: 'profile',       label: 'Profile',       icon: User },
  { id: 'security',      label: 'Security',       icon: Lock },
  { id: 'notifications', label: 'Notifications',  icon: Bell },
  { id: 'company',       label: 'Company',        icon: Building2 },
]

/* ── Profile ──────────────────────────────────────── */
function ProfileTab({ user, addToast }) {
  const [form, setForm] = useState({
    name:  user?.name  || '',
    email: user?.email || '',
    phone: user?.phone || '',
  })
  const [saving, setSaving] = useState(false)
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    if (!isRequired(form.name)) {
      addToast('Name is required', 'error')
      return
    }
    if (form.phone && !isValidPhone(form.phone)) {
      addToast('Phone must be exactly 10 digits', 'error')
      return
    }
    setSaving(true)
    try {
      await authService.updateProfile({
        name: form.name.trim(),
        phone: form.phone ? normalizePhone(form.phone) : '',
      })
      addToast('Profile updated', 'success')
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to update profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-5 max-w-md">
      {/* Avatar row */}
      <div className="flex items-center gap-4 pb-2">
        <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-2xl font-bold text-primary-600 shrink-0">
          {(user?.name || user?.email || 'U')[0].toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{user?.name || user?.email || 'User'}</p>
          <p className="text-sm text-gray-400 capitalize">{user?.role?.replace(/_/g, ' ') || 'Employee'}</p>
        </div>
      </div>

      <Input label="Full Name"    value={form.name}  onChange={set('name')}  placeholder="Your name" />
      <Input label="Email"        type="email" value={form.email} onChange={set('email')} disabled />
      <Input label="Phone (10 digits)" value={form.phone} onChange={set('phone')} placeholder="9876543210" maxLength={14} />

      <Button type="submit" loading={saving}>Save Changes</Button>
    </form>
  )
}

/* ── Security ─────────────────────────────────────── */
function SecurityTab({ addToast }) {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.current) errs.current = 'Required'
    if (!form.next)    errs.next = 'Required'
    else if (!minLength(form.next, 6)) errs.next = 'Minimum 6 characters'
    if (form.next !== form.confirm) errs.confirm = 'Passwords do not match'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setSaving(true)
    try {
      await authService.changePassword(form.current, form.next)
      addToast('Password changed', 'success')
      setForm({ current: '', next: '', confirm: '' })
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to change password', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4 max-w-md">
      <Input label="Current Password"     type="password" value={form.current}  onChange={set('current')}  error={errors.current} />
      <Input label="New Password"         type="password" value={form.next}     onChange={set('next')}     error={errors.next} />
      <Input label="Confirm New Password" type="password" value={form.confirm}  onChange={set('confirm')}  error={errors.confirm} />
      <Button type="submit" loading={saving}>Change Password</Button>
    </form>
  )
}

/* ── Notifications ────────────────────────────────── */
function Toggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="mr-4">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
          checked ? 'bg-primary-600' : 'bg-gray-300'
        }`}
      >
        <span className={`inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        }`} />
      </button>
    </div>
  )
}

function NotificationsTab({ addToast }) {
  const [prefs, setPrefs] = useState({
    payslipReady:    true,
    leaveApproved:   true,
    leaveRejected:   true,
    contractExpiry:  true,
    payrunComplete:  false,
    weeklyReport:    false,
  })
  const [saving, setSaving] = useState(false)
  const toggle = k => v => setPrefs(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 500))   // UI feedback — wire to API when ready
    addToast('Notification preferences saved', 'success')
    setSaving(false)
  }

  return (
    <div className="max-w-md space-y-1">
      <Toggle label="Payslip ready"        description="When your payslip is generated"         checked={prefs.payslipReady}   onChange={toggle('payslipReady')} />
      <Toggle label="Leave approved"       description="When a leave request is approved"        checked={prefs.leaveApproved}  onChange={toggle('leaveApproved')} />
      <Toggle label="Leave rejected"       description="When a leave request is rejected"        checked={prefs.leaveRejected}  onChange={toggle('leaveRejected')} />
      <Toggle label="Contract expiry"      description="30 days before a contract expires"       checked={prefs.contractExpiry} onChange={toggle('contractExpiry')} />
      <Toggle label="Pay run completed"    description="When a pay run finishes processing"      checked={prefs.payrunComplete} onChange={toggle('payrunComplete')} />
      <Toggle label="Weekly digest"        description="Summary email every Monday morning"      checked={prefs.weeklyReport}   onChange={toggle('weeklyReport')} />
      <div className="pt-4">
        <Button loading={saving} onClick={handleSave}>Save Preferences</Button>
      </div>
    </div>
  )
}

/* ── Company ──────────────────────────────────────── */
function CompanyTab({ addToast }) {
  const [form, setForm] = useState({
    companyName: '',
    industry: '',
    website: '',
    address: '',
    country: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
  })
  const [saving, setSaving] = useState(false)
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    await new Promise(r => setTimeout(r, 500))
    addToast('Company settings saved', 'success')
    setSaving(false)
  }

  return (
    <form onSubmit={handleSave} className="space-y-4 max-w-md">
      <Input label="Company Name" value={form.companyName} onChange={set('companyName')} placeholder="Acme Corp" />
      <Input label="Industry"     value={form.industry}    onChange={set('industry')}    placeholder="Technology" />
      <Input label="Website"      value={form.website}     onChange={set('website')}     placeholder="https://example.com" />
      <Input label="Address"      value={form.address}     onChange={set('address')}     placeholder="123 Main St" />
      <Input label="Country"      value={form.country}     onChange={set('country')}     placeholder="United States" />
      <Input label="Timezone"     value={form.timezone}    onChange={set('timezone')}    placeholder="America/New_York" />
      <Button type="submit" loading={saving}>Save</Button>
    </form>
  )
}

/* ── Main ─────────────────────────────────────────── */
export default function Settings() {
  const { user } = useAuth()
  const { addToast } = useContext(AppContext)
  const [tab, setTab] = useState('profile')

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your account and preferences" />

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Nav */}
        <div className="sm:w-48 shrink-0">
          <nav className="flex sm:flex-col gap-1 overflow-x-auto sm:overflow-visible">
            {TABS.map(t => {
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    tab === t.id
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={15} />
                  {t.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="card p-6 flex-1 min-w-0">
          {tab === 'profile'       && <ProfileTab       user={user}  addToast={addToast} />}
          {tab === 'security'      && <SecurityTab                   addToast={addToast} />}
          {tab === 'notifications' && <NotificationsTab              addToast={addToast} />}
          {tab === 'company'       && <CompanyTab                    addToast={addToast} />}
        </div>
      </div>
    </div>
  )
}
