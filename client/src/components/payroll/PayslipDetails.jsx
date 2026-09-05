import { formatDate, formatCurrency, formatFullName } from '../../utils/formatters'
import SalaryBreakdown from './SalaryBreakdown'

export default function PayslipDetailsComponent({ payslip }) {
  if (!payslip) return null
  const lines = Array.isArray(payslip.rules)
    ? payslip.rules
    : Array.isArray(payslip.breakdown)
      ? payslip.breakdown
      : []

  return (
    <div>
      {/* Employee Info */}
      <div className="grid grid-cols-2 gap-4 p-5 bg-gray-50 rounded-lg mb-5">
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
          <p className="text-xs text-gray-500 mb-0.5">Period</p>
          <p className="text-sm text-gray-700">
            {payslip.period || (payslip.month && payslip.year ? `${payslip.month}/${payslip.year}` : '—')}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Pay Date</p>
          <p className="text-sm text-gray-700">{formatDate(payslip.paymentDate || payslip.createdAt)}</p>
        </div>
      </div>

      {/* Breakdown */}
      <SalaryBreakdown
        lines={lines}
        gross={payslip.grossSalary ?? payslip.gross}
        totalDeductions={payslip.totalDeductions ?? payslip.deductions}
        net={payslip.netSalary ?? payslip.net}
      />
    </div>
  )
}
