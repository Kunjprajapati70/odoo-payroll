import { useNavigate } from 'react-router-dom'
import { Mail, Phone, Briefcase } from 'lucide-react'
import StatusBadge from '../common/StatusBadge'
import { formatFullName, formatDate } from '../../utils/formatters'

export default function EmployeeCard({ employee }) {
  const navigate = useNavigate()
  return (
    <div
      className="card p-5 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(`/employees/${employee._id}`)}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-600 shrink-0">
          {employee.firstName?.[0]}{employee.lastName?.[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-gray-900 truncate">{formatFullName(employee)}</p>
            <StatusBadge status={employee.status || 'active'} />
          </div>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
            <Briefcase size={11} /> {employee.jobTitle || '—'}
          </p>
        </div>
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-xs text-gray-500 flex items-center gap-1.5">
          <Mail size={11} className="shrink-0" />
          <span className="truncate">{employee.email}</span>
        </p>
        {employee.phone && (
          <p className="text-xs text-gray-500 flex items-center gap-1.5">
            <Phone size={11} /> {employee.phone}
          </p>
        )}
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-400">{employee.department?.name || '—'}</span>
        <span className="text-xs text-gray-400">Since {formatDate(employee.hireDate)}</span>
      </div>
    </div>
  )
}
