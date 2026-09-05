import { AlertTriangle, Info, Clock, FileText } from 'lucide-react'
import Skeleton from '../common/Skeleton'

const typeConfig = {
  warning: { icon: AlertTriangle, cls: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  info: { icon: Info, cls: 'bg-blue-50 text-blue-800 border-blue-200' },
  danger: { icon: AlertTriangle, cls: 'bg-red-50 text-red-800 border-red-200' },
  pending: { icon: Clock, cls: 'bg-orange-50 text-orange-800 border-orange-200' },
  contract: { icon: FileText, cls: 'bg-purple-50 text-purple-800 border-purple-200' },
}

export default function AlertsPanel({ alerts = [], loading }) {
  const list = Array.isArray(alerts) ? alerts : []
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">
        Alerts
        {list.length > 0 && (
          <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-600 text-xs font-bold">
            {list.length}
          </span>
        )}
      </h3>
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : list.length === 0 ? (
        <p className="text-sm text-gray-400">No alerts at this time.</p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {list.map((alert, i) => {
            const cfg = typeConfig[alert.type] || typeConfig.info
            const Icon = cfg.icon
            return (
              <div key={i} className={`flex items-start gap-2 p-3 rounded-lg text-sm border ${cfg.cls}`}>
                <Icon size={14} className="mt-0.5 shrink-0" />
                <span>{alert.message}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
