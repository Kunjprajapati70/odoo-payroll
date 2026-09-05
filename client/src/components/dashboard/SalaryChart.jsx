import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Skeleton from '../common/Skeleton'

export default function SalaryChart({ data = [], loading }) {
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Salary Cost</h3>
      {loading ? (
        <Skeleton className="h-56 w-full" />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => `$${v?.toLocaleString()}`} />
            <Bar dataKey="total" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Salary" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
