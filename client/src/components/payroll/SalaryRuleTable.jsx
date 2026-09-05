import { Edit2, Trash2 } from 'lucide-react'
import DataTable from '../common/DataTable'
import { SALARY_RULE_TYPES } from '../../utils/constants'

const categoryColors = {
  [SALARY_RULE_TYPES.BASIC]: 'bg-blue-100 text-blue-700',
  [SALARY_RULE_TYPES.ALLOWANCE]: 'bg-green-100 text-green-700',
  [SALARY_RULE_TYPES.DEDUCTION]: 'bg-red-100 text-red-700',
}

export default function SalaryRuleTable({ data, loading, onEdit, onDelete }) {
  const columns = [
    { key: 'seq', label: '#', render: r => <span className="text-xs text-gray-500 font-mono">{r.sequence || '—'}</span> },
    {
      key: 'name', label: 'Rule',
      render: r => (
        <div>
          <p className="font-medium text-gray-900">{r.name}</p>
          <p className="text-xs font-mono text-gray-500">{r.code}</p>
        </div>
      )
    },
    {
      key: 'category', label: 'Category',
      render: r => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[r.category] || 'bg-gray-100 text-gray-600'}`}>
          {r.category}
        </span>
      )
    },
    {
      key: 'calc', label: 'Calculation',
      render: r => (
        <span className="text-sm text-gray-700">
          <span className="capitalize text-gray-500">{r.calculationType} </span>
          {r.calculationType === 'fixed' && `$${r.amount}`}
          {r.calculationType === 'percentage' && `${r.percentage}%`}
          {r.calculationType === 'formula' && <code className="text-xs bg-gray-100 px-1 rounded">{r.formula}</code>}
        </span>
      )
    },
    {
      key: 'actions', label: '', width: 80,
      render: row => (
        <div className="flex items-center gap-1 justify-end">
          {onEdit && <button onClick={() => onEdit(row)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={15} /></button>}
          {onDelete && <button onClick={() => onDelete(row)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={15} /></button>}
        </div>
      )
    },
  ]
  return <DataTable columns={columns} data={data} loading={loading} emptyMessage="No salary rules defined" />
}
