import { Eye, Edit2, Trash2, Mail, Phone } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import StatusBadge from '../common/StatusBadge'
import DataTable from '../common/DataTable'
import Button from '../common/Button'
import { formatDate, formatFullName } from '../../utils/formatters'
import RoleGuard from '../auth/RoleGuard'

export default function EmployeeTable({ data, loading, onDelete }) {
  const navigate = useNavigate()

  const columns = [
    {
      key: 'employee',
      label: 'Employee',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
            <span className="text-primary-600 text-xs font-semibold">
              {row.firstName?.[0]}{row.lastName?.[0]}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{formatFullName(row)}</p>
            <p className="text-xs text-gray-500">{row.employeeId || row._id?.slice(-6)}</p>
          </div>
        </div>
      )
    },
    {
      key: 'contact',
      label: 'Contact',
      render: (row) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Mail size={11} /> {row.email}
          </div>
          {row.phone && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Phone size={11} /> {row.phone}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'department',
      label: 'Department',
      render: (row) => (
        <span className="text-sm text-gray-700">
          {row.department?.name || row.department || '—'}
        </span>
      )
    },
    {
      key: 'jobTitle',
      label: 'Job Title',
      render: (row) => <span className="text-sm text-gray-700">{row.jobTitle || '—'}</span>
    },
    {
      key: 'hireDate',
      label: 'Hire Date',
      render: (row) => <span className="text-sm text-gray-600">{formatDate(row.hireDate)}</span>
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status || 'active'} />
    },
    {
      key: 'actions',
      label: '',
      width: 120,
      render: (row) => (
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={() => navigate(`/employees/${row._id}`)}
            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
            title="View"
          >
            <Eye size={15} />
          </button>
          <RoleGuard action="employees:write">
            <button
              onClick={() => navigate(`/employees/${row._id}/edit`)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Edit"
            >
              <Edit2 size={15} />
            </button>
            <button
              onClick={() => onDelete(row)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete"
            >
              <Trash2 size={15} />
            </button>
          </RoleGuard>
        </div>
      )
    },
  ]

  return <DataTable columns={columns} data={data} loading={loading} emptyMessage="No employees found" />
}
