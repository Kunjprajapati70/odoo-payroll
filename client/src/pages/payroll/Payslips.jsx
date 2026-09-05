import { useState, useEffect, useCallback, useContext } from 'react'
import { Search, Eye, Download, Mail } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/common/Button'
import DataTable from '../../components/common/DataTable'
import Pagination from '../../components/common/Pagination'
import ErrorState from '../../components/common/ErrorState'
import Select from '../../components/common/Select'
import { payslipService } from '../../services/payslipService'
import { AppContext } from '../../context/AppContext'
import { formatDate, formatCurrency, formatFullName } from '../../utils/formatters'
import { useDebounce } from '../../hooks/useDebounce'

export default function Payslips() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { addToast } = useContext(AppContext)
  const [payslips, setPayslips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const debouncedSearch = useDebounce(search)

  const payrunId = searchParams.get('payrun')

  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = new Date().getFullYear() - i
    return { value: String(y), label: String(y) }
  })

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: new Date(2000, i).toLocaleString('en', { month: 'long' })
  }))

  const fetchPayslips = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await payslipService.getAll({
        page, limit: 20,
        search: debouncedSearch || undefined,
        year: yearFilter || undefined,
        month: monthFilter || undefined,
        payrun: payrunId || undefined,
      })
      setPayslips(Array.isArray(res) ? res : res?.data || [])
      setTotalPages(res?.totalPages || 1)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load payslips')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, yearFilter, monthFilter, payrunId])

  useEffect(() => { setPage(1) }, [debouncedSearch, yearFilter, monthFilter])
  useEffect(() => { fetchPayslips() }, [fetchPayslips])

  const handleDownload = async (id) => {
    setActionLoading(`pdf-${id}`)
    try {
      const blob = await payslipService.downloadPdf(id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `payslip-${id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      addToast('Failed to download payslip', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleSendEmail = async (id) => {
    setActionLoading(`email-${id}`)
    try {
      await payslipService.sendEmail(id)
      addToast('Payslip sent by email', 'success')
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to send email', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const columns = [
    {
      key: 'employee', label: 'Employee',
      render: r => (
        <div>
          <p className="font-medium text-gray-900">{formatFullName(r.employee) || '—'}</p>
          <p className="text-xs text-gray-500">{r.employee?.employeeId || r.employee?.email || ''}</p>
        </div>
      )
    },
    {
      key: 'period', label: 'Period',
      render: r => <span className="text-sm text-gray-600">{r.period || (r.month && r.year ? `${r.month}/${r.year}` : '—')}</span>
    },
    { key: 'basic', label: 'Basic', render: r => <span className="text-sm">{formatCurrency(r.basicSalary ?? r.basic)}</span> },
    { key: 'allowances', label: 'Allowances', render: r => <span className="text-sm text-green-600">+{formatCurrency(r.totalAllowances ?? r.allowances)}</span> },
    { key: 'deductions', label: 'Deductions', render: r => <span className="text-sm text-red-500">-{formatCurrency(r.totalDeductions ?? r.deductions)}</span> },
    { key: 'net', label: 'Net Pay', render: r => <span className="text-sm font-semibold text-gray-900">{formatCurrency(r.netSalary ?? r.net)}</span> },
    {
      key: 'actions', label: '', width: 100,
      render: row => (
        <div className="flex items-center gap-1 justify-end">
          <button onClick={() => navigate(`/payroll/payslips/${row._id}`)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded" title="View">
            <Eye size={15} />
          </button>
          <button
            onClick={() => handleDownload(row._id)}
            disabled={actionLoading === `pdf-${row._id}`}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
            title="Download PDF"
          >
            <Download size={15} />
          </button>
          <button
            onClick={() => handleSendEmail(row._id)}
            disabled={actionLoading === `email-${row._id}`}
            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
            title="Send Email"
          >
            <Mail size={15} />
          </button>
        </div>
      )
    },
  ]

  return (
    <div>
      <PageHeader title="Payslips" subtitle="View and manage employee payslips" />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search employee..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-base pl-8 py-1.5 text-sm"
          />
        </div>
        <Select
          options={[{ value: '', label: 'All Years' }, ...yearOptions]}
          value={yearFilter}
          onChange={e => setYearFilter(e.target.value)}
          className="w-28 py-1.5"
        />
        <Select
          options={[{ value: '', label: 'All Months' }, ...monthOptions]}
          value={monthFilter}
          onChange={e => setMonthFilter(e.target.value)}
          className="w-36 py-1.5"
        />
      </div>

      {error && !loading ? (
        <div className="card"><ErrorState message={error} onRetry={fetchPayslips} /></div>
      ) : (
        <div className="card">
          <DataTable columns={columns} data={payslips} loading={loading} emptyMessage="No payslips found" />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}
