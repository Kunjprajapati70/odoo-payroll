import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Mail, Phone, MapPin, Briefcase, Calendar, Building2 } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/common/Button'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorState from '../../components/common/ErrorState'
import { employeeService } from '../../services/employeeService'
import { payslipService } from '../../services/payslipService'
import { attendanceService } from '../../services/attendanceService'
import { formatDate, formatFullName, formatCurrency } from '../../utils/formatters'
import RoleGuard from '../../components/auth/RoleGuard'
import DataTable from '../../components/common/DataTable'

const TABS = ['Overview', 'Attendance', 'Payslips']

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className="mt-0.5 text-gray-400"><Icon size={15} /></div>
      <div className="flex-1">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-800">{value || '—'}</p>
      </div>
    </div>
  )
}

export default function EmployeeDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState(0)
  const [payslips, setPayslips] = useState([])
  const [attendance, setAttendance] = useState([])
  const [dataLoading, setDataLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    employeeService.getById(id).then(res => {
      setEmployee(res?.data || res)
    }).catch(err => {
      setError(err?.response?.data?.message || 'Failed to load employee')
    }).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!employee) return
    if (tab === 1) {
      setDataLoading(true)
      attendanceService.getAll({ employee: id, limit: 20 }).then(res => {
        setAttendance(Array.isArray(res) ? res : res?.data || [])
      }).catch(() => {}).finally(() => setDataLoading(false))
    }
    if (tab === 2) {
      setDataLoading(true)
      payslipService.getAll({ employee: id, limit: 20 }).then(res => {
        setPayslips(Array.isArray(res) ? res : res?.data || [])
      }).catch(() => {}).finally(() => setDataLoading(false))
    }
  }, [tab, employee, id])

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
  if (error) return <div className="card"><ErrorState message={error} onRetry={() => navigate('/employees')} /></div>
  if (!employee) return null

  const attendanceCols = [
    { key: 'date', label: 'Date', render: r => formatDate(r.date) },
    { key: 'checkIn', label: 'Check In', render: r => r.checkIn || '—' },
    { key: 'checkOut', label: 'Check Out', render: r => r.checkOut || '—' },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
  ]

  const payslipCols = [
    { key: 'period', label: 'Period', render: r => r.period || `${r.month}/${r.year}` },
    { key: 'basic', label: 'Basic', render: r => formatCurrency(r.basicSalary || r.basic) },
    { key: 'gross', label: 'Gross', render: r => formatCurrency(r.grossSalary || r.gross) },
    { key: 'net', label: 'Net', render: r => <span className="font-semibold text-green-600">{formatCurrency(r.netSalary || r.net)}</span> },
    { key: 'actions', label: '', render: r => (
      <Button size="sm" variant="ghost" onClick={() => navigate(`/payroll/payslips/${r._id}`)}>View</Button>
    )},
  ]

  return (
    <div>
      <PageHeader
        title="Employee Profile"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/employees')}>Back</Button>
            <RoleGuard action="employees:write">
              <Button icon={Edit2} onClick={() => navigate(`/employees/${id}/edit`)}>Edit</Button>
            </RoleGuard>
          </div>
        }
      />

      {/* Profile Header */}
      <div className="card p-6 mb-4">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-2xl font-bold text-primary-600 shrink-0">
            {employee.firstName?.[0]}{employee.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-semibold text-gray-900">{formatFullName(employee)}</h2>
              <StatusBadge status={employee.status || 'active'} />
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{employee.jobTitle || 'No job title'}</p>
            <p className="text-sm text-gray-400">{employee.employeeId || `#${id?.slice(-6)}`}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === i ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Personal Information</h3>
            <InfoRow icon={Mail} label="Email" value={employee.email} />
            <InfoRow icon={Phone} label="Phone" value={employee.phone} />
            <InfoRow icon={Calendar} label="Date of Birth" value={formatDate(employee.dateOfBirth)} />
            <InfoRow icon={MapPin} label="Address" value={[employee.address, employee.city, employee.country].filter(Boolean).join(', ')} />
          </div>
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Job Information</h3>
            <InfoRow icon={Briefcase} label="Job Title" value={employee.jobTitle} />
            <InfoRow icon={Building2} label="Department" value={employee.department?.name || employee.department} />
            <InfoRow icon={Calendar} label="Hire Date" value={formatDate(employee.hireDate)} />
            <InfoRow icon={Briefcase} label="Employment Type" value={employee.employmentType} />
            <InfoRow icon={Briefcase} label="Working Schedule" value={employee.schedule?.name || employee.schedule} />
          </div>
          {employee.contract && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Contract</h3>
              <InfoRow icon={Briefcase} label="Contract Type" value={employee.contract?.type} />
              <InfoRow icon={Calendar} label="Start Date" value={formatDate(employee.contract?.startDate)} />
              <InfoRow icon={Calendar} label="End Date" value={formatDate(employee.contract?.endDate)} />
              <InfoRow icon={Briefcase} label="Salary" value={formatCurrency(employee.contract?.salary)} />
            </div>
          )}
        </div>
      )}

      {tab === 1 && (
        <div className="card">
          <DataTable columns={attendanceCols} data={attendance} loading={dataLoading} emptyMessage="No attendance records" />
        </div>
      )}

      {tab === 2 && (
        <div className="card">
          <DataTable columns={payslipCols} data={payslips} loading={dataLoading} emptyMessage="No payslips found" />
        </div>
      )}
    </div>
  )
}
