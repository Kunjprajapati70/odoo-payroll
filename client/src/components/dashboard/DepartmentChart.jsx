import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import Skeleton from '../common/Skeleton'

const COLORS = ['#4f46e5', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6']

export default function DepartmentChart({ data = [], loading }) {
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Employees by Department</h3>
      {loading ? (
        <Skeleton className="h-56 w-full" />
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center h-56 text-sm text-gray-400">No department data</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend iconSize={10} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
