import { formatCurrency } from '../../utils/formatters'

function Row({ label, amount, type, isTotal }) {
  const color = type === 'allowance' ? 'text-green-600' : type === 'deduction' ? 'text-red-500' : 'text-gray-700'
  return (
    <div className={`flex justify-between py-2 ${isTotal ? 'border-t border-gray-200 font-bold' : 'border-b border-gray-50'}`}>
      <span className={`text-sm ${isTotal ? 'text-gray-900' : 'text-gray-600'}`}>{label}</span>
      <span className={`text-sm ${isTotal ? 'text-gray-900 text-base' : color}`}>{amount}</span>
    </div>
  )
}

export default function SalaryBreakdown({ lines = [], gross, totalDeductions, net }) {
  const safeLines = Array.isArray(lines) ? lines : []
  const basics = safeLines.filter(l => l.category === 'basic')
  const allowances = safeLines.filter(l => l.category === 'allowance')
  const deductions = safeLines.filter(l => l.category === 'deduction')

  return (
    <div className="space-y-4">
      {basics.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Basic</p>
          {basics.map((l, i) => <Row key={i} label={l.name} amount={formatCurrency(l.amount)} />)}
        </div>
      )}
      {allowances.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Allowances</p>
          {allowances.map((l, i) => <Row key={i} label={l.name} amount={`+${formatCurrency(l.amount)}`} type="allowance" />)}
        </div>
      )}
      {deductions.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Deductions</p>
          {deductions.map((l, i) => <Row key={i} label={l.name} amount={`-${formatCurrency(l.amount)}`} type="deduction" />)}
        </div>
      )}
      {gross != null && <Row label="Gross Salary" amount={formatCurrency(gross)} />}
      {totalDeductions != null && <Row label="Total Deductions" amount={`-${formatCurrency(totalDeductions)}`} type="deduction" />}
      {net != null && <Row label="Net Pay" amount={formatCurrency(net)} isTotal />}
    </div>
  )
}
