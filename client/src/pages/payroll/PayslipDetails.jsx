import { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Mail } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/common/Button'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorState from '../../components/common/ErrorState'
import { payslipService } from '../../services/payslipService'
import { AppContext } from '../../context/AppContext'
import { formatDate, formatCurrency, formatFullName } from '../../utils/formatters'

function BreakdownRow({ label, amount, type = 'neutral', isTotal }) {
  const colors = {
    positive: 'text-green-600',
    negative: 'text-red-500',
    neutral: 'text-gray-700',
    total: 'text-gray-900 font-semibold',
  }
  return (
    <div className={`flex items-center justify-between py-2 ${isTotal ? 'border-t border-gray-200 mt-1 pt-3' : 'border-b border-gray-50'}`}>
      <span className={`text-sm ${isTotal ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{label}</span>
      <span className={`text-sm ${colors[type]} ${isTotal ? 'text-base font-bold' : ''}`}>{amount}</span>
    </div>
  )
}

export default function PayslipDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToast } = useContext(AppContext)
  const [payslip, setPayslip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const [emailing, setEmailing] = useState(false)

  useEffect(() => {
    setLoading(true)
    payslipService.getById(id).then(res => {
      setPayslip(res?.data || res)
    }).catch(err => {
      setError(err?.response?.data?.message || 'Failed to load payslip')
    }).finally(() => setLoading(false))
  }, [id])

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const blob = await payslipService.downloadPdf(id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `payslip-${id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      addToast('Failed to download PDF', 'error')
    } finally {
      setDownloading(false)
    }
  }

  const handleEmail = async () => {
    setEmailing(true)
    try {
      await payslipService.sendEmail(id)
      addToast('Payslip sent by email', 'success')
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to send email', 'error')
    } finally {
      setEmailing(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
  if (error) return <div className="card"><ErrorState message={error} onRetry={() => navigate('/payroll/payslips')} /></div>
  if (!payslip) return null

  const rules = Array.isArray(payslip.rules)
    ? payslip.rules
    : Array.isArray(payslip.breakdown)
      ? payslip.breakdown
      : []
  const allowances = rules.filter(r => r.category === 'allowance')
  const deductions = rules.filter(r => r.category === 'deduction')
  const basics = rules.filter(r => r.category === 'basic')

  return (
    <div>
      <PageHeader
        title="Payslip Details"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/payroll/payslips')}>Back</Button>
            <Button variant="secondary" icon={Download} loading={downloading} onClick={handleDownload}>PDF</Button>
            <Button icon={Mail} loading={emailing} onClick={handleEmail}>Send Email</Button>
          </div>
        }
      />

      <div className="max-w-2xl">
        <div className="card">
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xs">P</span>
                  </div>
                  <span className="font-bold text-gray-900">PeoplePay360</span>
                </div>
                <p className="text-xs text-gray-500">HR & Payroll Management</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">PAYSLIP</p>
                <p className="text-xs text-gray-500">
                  {payslip.period || (payslip.month && payslip.year ? `${payslip.month}/${payslip.year}` : '—')}
                </p>
              </div>
            </div>
          </div>

          {/* Employee Info */}
          <div className="p-6 border-b border-gray-100 bg-gray-50">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Employee</p>
                <p className="text-sm font-semibold text-gray-900">{formatFullName(payslip.employee) || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Employee ID</p>
                <p className="text-sm font-medium text-gray-700">{payslip.employee?.employeeId || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Department</p>
                <p className="text-sm text-gray-700">{payslip.employee?.department?.name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Pay Period</p>
                <p className="text-sm text-gray-700">
                  {payslip.periodStart ? `${formatDate(payslip.periodStart)} – ${formatDate(payslip.periodEnd)}` : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Designation</p>
                <p className="text-sm text-gray-700">{payslip.employee?.jobTitle || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Payment Date</p>
                <p className="text-sm text-gray-700">{formatDate(payslip.paymentDate || payslip.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Salary Breakdown */}
          <div className="p-6">
            {/* Basic */}
            {basics.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Basic</p>
                {basics.map((r, i) => (
                  <BreakdownRow key={i} label={r.name || r.ruleName} amount={formatCurrency(r.amount)} />
                ))}
              </div>
            )}
            {payslip.basicSalary != null && basics.length === 0 && (
              <div className="mb-4">
                <BreakdownRow label="Basic Salary" amount={formatCurrency(payslip.basicSalary)} />
              </div>
            )}

            {/* Allowances */}
            {allowances.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Allowances</p>
                {allowances.map((r, i) => (
                  <BreakdownRow key={i} label={r.name || r.ruleName} amount={formatCurrency(r.amount)} type="positive" />
                ))}
              </div>
            )}

            {/* Deductions */}
            {deductions.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Deductions</p>
                {deductions.map((r, i) => (
                  <BreakdownRow key={i} label={r.name || r.ruleName} amount={`-${formatCurrency(r.amount)}`} type="negative" />
                ))}
              </div>
            )}

            {/* Totals */}
            <div className="mt-4 pt-2">
              <div className="flex justify-between py-1.5">
                <span className="text-sm text-gray-500">Gross Salary</span>
                <span className="text-sm font-medium">{formatCurrency(payslip.grossSalary ?? payslip.gross)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-sm text-gray-500">Total Deductions</span>
                <span className="text-sm text-red-500">-{formatCurrency(payslip.totalDeductions ?? payslip.deductions)}</span>
              </div>
              <div className="flex justify-between py-3 border-t-2 border-gray-900 mt-2">
                <span className="font-bold text-gray-900">Net Pay</span>
                <span className="font-bold text-lg text-gray-900">{formatCurrency(payslip.netSalary ?? payslip.net)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-4 text-center">
            <p className="text-xs text-gray-400">This is a computer-generated payslip and does not require a signature.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
