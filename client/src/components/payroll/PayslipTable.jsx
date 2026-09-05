import { Eye, Download, Mail } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DataTable from '../common/DataTable'
import { formatCurrency, formatFullName } from '../../utils/formatters'

export default function PayslipTable({ data, loading, onDownload, onEmail }) {
  const navigate = useNavigate()
  const columns = [
    {
      key: 'employee', label: 'Employee',
      render: r => (
        <div>
          <p className="font-medium text-gray-900">{formatFullName(r.employee) || '—'}</p>
          <p className="text-xs text-gray-500">{r.employee?.employeeId || ''}</p>
        </div>
      )
    },
    { key: 'period', label: 'Period', render: r => <span className="text-sm text-gray-600">{r.period || (r.month && r.year ? `${r.month}/${r.year}` : '—')}</span> },
    { key: 'basic', label: 'Basic', render: r => <span className="text-sm">{formatCurrency(r.basicSalary ?? r.basic)}</span> },
    { key: 'gross', label: 'Gross', render: r => <span className="text-sm">{formatCurrency(r.grossSalary ?? r.gross)}</span> },
    { key: 'net', label: 'Net', render: r => <span className="text-sm font-semibold text-gray-900">{formatCurrency(r.netSalary ?? r.net)}</span> },
    {
      key: 'actions', label: '', width: 100,
      render: row => (
        <div className="flex items-center gap-1 justify-end">
          <button onClick={() => navigate(`/payroll/payslips/${row._id}`)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded" title="View">
            <Eye size={15} />
          </button>
          {onDownload && (
            <button onClick={() => onDownload(row._id)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Download PDF">
              <Download size={15} />
            </button>
          )}
          {onEmail && (
            <button onClick={() => onEmail(row._id)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded" title="Send Email">
              <Mail size={15} />
            </button>
          )}
        </div>
      )
    },
  ]
  return <DataTable columns={columns} data={data} loading={loading} emptyMessage="No payslips found" />
}
