import { useState, useEffect, useCallback, useContext, useMemo } from 'react'
import { Plus, Edit2, Trash2, Search } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import ErrorState from '../../components/common/ErrorState'
import { userService } from '../../services/userService'
import { AppContext } from '../../context/AppContext'
import { useAuth } from '../../hooks/useAuth'
import { ROLES } from '../../utils/constants'
import { can } from '../../utils/permissions'
import { isValidEmail, isValidPhone, isRequired, minLength, normalizePhone, isPositiveNumber } from '../../utils/validators'
import { useDebounce } from '../../hooks/useDebounce'
import { formatFullName } from '../../utils/formatters'

const ALL_ROLE_OPTS = Object.values(ROLES).map(r => ({
  value: r,
  label: r.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
}))

const HR_ASSIGNABLE = [
  ROLES.EMPLOYEE,
  ROLES.HR_MANAGER,
  ROLES.PAYROLL_USER,
  ROLES.PAYROLL_MANAGER,
]

function UserForm({ initial, onSubmit, loading, onClose, roleOptions }) {
  const isEdit = !!initial?._id
  const [form, setForm] = useState({
    name: initial?.name || '',
    email: initial?.email || '',
    phone: initial?.phone || '',
    password: '',
    role: initial?.role || ROLES.EMPLOYEE,
    basicSalary: '',
    isActive: initial?.isActive !== false,
  })
  const [errors, setErrors] = useState({})
  const set = f => e => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(p => ({ ...p, [f]: value }))
  }

  const validate = () => {
    const errs = {}
    if (!isRequired(form.name)) errs.name = 'Required'
    if (!isRequired(form.email)) errs.email = 'Required'
    else if (!isValidEmail(form.email)) errs.email = 'Enter a valid email'
    if (!isEdit && !isRequired(form.password)) errs.password = 'Required'
    if (form.password && !minLength(form.password, 6)) errs.password = 'Minimum 6 characters'
    if (!form.role) errs.role = 'Required'
    if (form.phone && !isValidPhone(form.phone)) errs.phone = 'Phone must be exactly 10 digits'
    if (!isEdit) {
      if (!isRequired(form.basicSalary) || !isPositiveNumber(form.basicSalary)) {
        errs.basicSalary = 'Basic salary must be a positive number'
      }
    } else if (form.basicSalary !== '' && form.basicSalary != null && !isPositiveNumber(form.basicSalary)) {
      errs.basicSalary = 'Basic salary must be a positive number'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      role: form.role,
      isActive: form.isActive,
      phone: form.phone ? normalizePhone(form.phone) : '',
    }
    if (form.password) payload.password = form.password
    if (form.basicSalary !== '' && form.basicSalary != null) payload.basicSalary = Number(form.basicSalary)
    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Full Name *" value={form.name} onChange={set('name')} error={errors.name} />
        <Input label="Email *" type="email" value={form.email} onChange={set('email')} error={errors.email} disabled={isEdit} />
        <Input label="Phone (10 digits)" value={form.phone} onChange={set('phone')} error={errors.phone} placeholder="9876543210" maxLength={14} />
        <Select label="Role *" options={roleOptions} value={form.role} onChange={set('role')} error={errors.role} />
        <Input
          label={isEdit ? 'New Password (optional)' : 'Password *'}
          type="password"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
        />
        <Input
          label={isEdit ? 'Basic Salary (optional)' : 'Basic Salary *'}
          type="number"
          min="1"
          step="0.01"
          value={form.basicSalary}
          onChange={set('basicSalary')}
          error={errors.basicSalary}
          placeholder="e.g. 50000"
        />
      </div>
      <p className="text-xs text-gray-500">
        Employee profile, leave balance, and payroll contract are created automatically.
        {!isEdit && ' Login credentials are emailed to the user.'}
      </p>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={form.isActive} onChange={set('isActive')} className="rounded border-gray-300" />
        Active account
      </label>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading}>{isEdit ? 'Update User' : 'Create User'}</Button>
      </div>
    </form>
  )
}

export default function Users() {
  const { addToast } = useContext(AppContext)
  const { user: currentUser } = useAuth()
  const isAdmin = currentUser?.role === ROLES.ADMIN
  const isHr = currentUser?.role === ROLES.HR_MANAGER
  const canWrite = can(currentUser, 'users:write')

  const roleOptions = useMemo(
    () => (isAdmin ? ALL_ROLE_OPTS : ALL_ROLE_OPTS.filter(o => HR_ASSIGNABLE.includes(o.value))),
    [isAdmin]
  )

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const debouncedSearch = useDebounce(search)

  useEffect(() => { setAppliedSearch(debouncedSearch) }, [debouncedSearch])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await userService.getAll({
        search: appliedSearch || undefined,
        role: roleFilter || undefined,
      })
      setUsers(Array.isArray(res) ? res : res?.data || [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [appliedSearch, roleFilter])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const canEditRow = (row) => {
    if (!canWrite) return false
    if (isAdmin) return true
    if (isHr && row.role === ROLES.ADMIN) return false
    return true
  }

  const canDeleteRow = (row) => {
    if (!canWrite) return false
    if (String(row._id) === String(currentUser?._id)) return false
    if (isHr && row.role === ROLES.ADMIN) return false
    return true
  }

  const handleSave = async (data) => {
    setSaving(true)
    try {
      if (modal?.type === 'edit') {
        await userService.update(modal.data._id, data)
        addToast('User updated', 'success')
      } else {
        const createdUser = await userService.create(data)
        const mail = createdUser?.credentialsEmail
        if (mail?.sent && !mail?.mocked) {
          addToast(`User created — login details sent to ${mail.to || data.email}`, 'success')
        } else if (mail?.sent && mail?.mocked) {
          addToast('User created (email mocked — check SMTP settings)', 'success')
        } else {
          addToast(`User created, but email failed${mail?.error ? `: ${mail.error}` : ''}`, 'error')
        }
      }
      setModal(null)
      fetchUsers()
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to save user', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await userService.delete(deleteTarget._id)
      addToast('User deleted', 'success')
      setDeleteTarget(null)
      fetchUsers()
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to delete user', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    {
      key: 'name', label: 'User',
      render: r => (
        <div>
          <p className="font-medium text-gray-900">{r.name}</p>
          <p className="text-xs text-gray-500">{r.email}</p>
        </div>
      ),
    },
    {
      key: 'role', label: 'Role',
      render: r => <span className="text-sm capitalize text-gray-700">{r.role?.replace(/_/g, ' ')}</span>,
    },
    {
      key: 'employee', label: 'Employee',
      render: r => <span className="text-sm text-gray-600">{formatFullName(r.employee) || '—'}</span>,
    },
    {
      key: 'createdBy', label: 'Created by',
      render: r => (
        <span className="text-sm text-gray-600">
          {r.createdBy?.name
            ? `${r.createdBy.name}${r.createdBy.role ? ` (${String(r.createdBy.role).replace(/_/g, ' ')})` : ''}`
            : '—'}
        </span>
      ),
    },
    {
      key: 'status', label: 'Status',
      render: r => <StatusBadge status={r.isActive ? 'active' : 'inactive'} />,
    },
    {
      key: 'actions', label: '', width: 90,
      render: row => (
        <div className="flex items-center gap-1 justify-end">
          {canEditRow(row) && (
            <button onClick={() => setModal({ type: 'edit', data: row })} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit">
              <Edit2 size={15} />
            </button>
          )}
          {canDeleteRow(row) && (
            <button onClick={() => setDeleteTarget(row)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete">
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle={isHr
          ? 'HR user management — create accounts (credentials emailed automatically)'
          : 'User management — create, edit, and delete accounts'}
        actions={canWrite ? (
          <Button icon={Plus} onClick={() => setModal({ type: 'create' })}>Add User</Button>
        ) : null}
      />

      <div className="card mb-4 p-4 flex flex-nowrap items-end gap-3 overflow-x-auto">
        <div className="relative flex-1 min-w-[180px]">
          <label className="label-base">Search</label>
          <Search size={14} className="absolute left-3 bottom-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search name or email... (press Enter)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                setAppliedSearch(search)
              }
            }}
            className="input-base pl-8 py-1.5 text-sm"
          />
        </div>
        <div className="w-44 shrink-0">
          <Select
            label="Role"
            options={[{ value: '', label: 'All Roles' }, ...roleOptions]}
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="py-1.5"
          />
        </div>
      </div>

      {error && !loading ? (
        <div className="card"><ErrorState message={error} onRetry={fetchUsers} /></div>
      ) : (
        <div className="card">
          <DataTable columns={columns} data={users} loading={loading} emptyMessage="No users found" />
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.type === 'edit' ? 'Edit User' : 'Create User'} size="md">
        <UserForm
          initial={modal?.data}
          onSubmit={handleSave}
          loading={saving}
          onClose={() => setModal(null)}
          roleOptions={roleOptions}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete User"
        message={`Delete user "${deleteTarget?.name}"? This cannot be undone.`}
      />
    </div>
  )
}
