import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import Skeleton from '../common/Skeleton'

export default function TimeOffChart({ data = [], loading }) {
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Time-Off Overview</h3>
      {loading ? (
        <Skeleton className="h-28 w-full" />
      ) : (
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={data} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend iconSize={10} />
            <Bar dataKey="approved" fill="#22c55e" radius={[3, 3, 0, 0]} name="Approved" />
            <Bar dataKey="pending" fill="#f59e0b" radius={[3, 3, 0, 0]} name="Pending" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
