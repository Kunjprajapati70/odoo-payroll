import { Edit2, Trash2 } from 'lucide-react'
import DataTable from '../common/DataTable'

export default function SalaryStructureTable({ data, loading, onEdit, onDelete }) {
  const columns = [
    {
      key: 'name', label: 'Structure',
      render: r => (
        <div>
          <p className="font-medium text-gray-900">{r.name}</p>
          <p className="text-xs font-mono text-gray-500">{r.code}</p>
        </div>
      )
    },
    { key: 'currency', label: 'Currency', render: r => <span className="text-sm">{r.currency}</span> },
    { key: 'schedule', label: 'Schedule', render: r => <span className="text-sm capitalize">{r.scheduleOf}</span> },
    { key: 'rules', label: 'Rules', render: r => <span className="text-sm">{r.rules?.length ?? 0}</span> },
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
  return <DataTable columns={columns} data={data} loading={loading} emptyMessage="No salary structures defined" />
}
