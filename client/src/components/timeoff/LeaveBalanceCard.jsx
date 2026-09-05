export default function LeaveBalanceCard({ allocation }) {
  if (!allocation) return null
  const used = allocation.usedDays || 0
  const total = allocation.allocatedDays || 0
  const remaining = total - used
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0
  const color = remaining <= 2 ? 'bg-red-500' : remaining <= 5 ? 'bg-yellow-500' : 'bg-green-500'

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: allocation.timeOffType?.color || allocation.leaveType?.color || '#4f46e5' }} />
          <span className="text-sm font-medium text-gray-800">{allocation.timeOffType?.name || allocation.leaveType?.name || 'Leave'}</span>
        </div>
        <span className="text-xs text-gray-500">{allocation.year}</span>
      </div>
      <div className="flex items-end justify-between mb-2">
        <span className="text-2xl font-bold text-gray-900">{remaining}</span>
        <span className="text-xs text-gray-500">of {total} days left</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-gray-400 mt-1">{used} days used</p>
    </div>
  )
}
