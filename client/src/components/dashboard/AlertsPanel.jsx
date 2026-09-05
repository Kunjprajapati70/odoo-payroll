import { AlertTriangle, Info } from 'lucide-react'

export default function AlertsPanel({ alerts = [] }) {
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Alerts</h3>
      {alerts.length === 0 ? (
        <p className="text-sm text-gray-400">No alerts at this time.</p>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <div key={i} className={`flex items-start gap-2 p-3 rounded-lg text-sm
              ${alert.type === 'warning' ? 'bg-yellow-50 text-yellow-800' : 'bg-blue-50 text-blue-800'}`}>
              {alert.type === 'warning' ? <AlertTriangle size={14} className="mt-0.5 shrink-0" /> : <Info size={14} className="mt-0.5 shrink-0" />}
              {alert.message}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
