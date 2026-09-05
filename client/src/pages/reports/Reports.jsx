import { useState } from 'react'
import { BarChart2, Users, DollarSign, Clock, Umbrella } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/common/Button'
import Select from '../../components/common/Select'
import Input from '../../components/common/Input'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell
} from 'recharts'
import { dashboardService } from '../../services/dashboardService'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { formatCurrency } from '../../utils/formatters'

const COLORS = ['#4f46e5', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6']

const REPORT_TYPES = [
  { value: 'salary', label: 'Salary Summary', icon: DollarSign, description: 'Monthly salary costs and trends' },
  { value: 'attendance', label: 'Attendance Report', icon: Clock, description: 'Daily attendance overview' },
  { value: 'department', label: 'Department Distribution', icon: Users, description: 'Employees by department' },
  { value: 'timeoff', label: 'Time Off Summary', icon: Umbrella, description: 'Leave requests and approvals' },
]

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState('salary')
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ year: String(new Date().getFullYear()), month: '' })
  const [generated, setGenerated] = useState(false)

  const generateReport = async () => {
    setLoading(true)
    setGenerated(false)
    try {
      let data = []
      if (selectedReport === 'salary') {
        const res = await dashboardService.getSalaryChart({ year: filters.year })
        data = Array.isArray(res) ? res : res?.data || []
      } else if (selectedReport === 'attendance') {
        const res = await dashboardService.getAttendanceChart({ year: filters.year, month: filters.month || undefined })
        data = Array.isArray(res) ? res : res?.data || []
      } else if (selectedReport === 'department') {
        const res = await dashboardService.getDepartmentChart()
        data = Array.isArray(res) ? res : res?.data || []
      } else if (selectedReport === 'timeoff') {
        const summary = await dashboardService.getSummary({ year: filters.year })
        data = (summary.timeOffOverview || []).map(row => ({
          label: row.status,
          count: row.count || 0,
          days: row.days || 0,
        }))
      }
      setChartData(data)
      setGenerated(true)
    } catch {
      setChartData([])
      setGenerated(true)
    } finally {
      setLoading(false)
    }
  }

  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = new Date().getFullYear() - i
    return { value: String(y), label: String(y) }
  })

  const monthOptions = [
    { value: '', label: 'All Months' },
    ...Array.from({ length: 12 }, (_, i) => ({
      value: String(i + 1),
      label: new Date(2000, i).toLocaleString('en', { month: 'long' })
    }))
  ]

  const renderChart = () => {
    if (!generated) return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <BarChart2 size={48} className="mb-3 opacity-30" />
        <p className="text-sm">Select a report type and click Generate</p>
      </div>
    )
    if (loading) return <div className="flex justify-center h-64 items-center"><LoadingSpinner /></div>
    if (!chartData.length) return <div className="flex justify-center h-64 items-center text-sm text-gray-400">No data available for the selected filters.</div>

    if (selectedReport === 'salary') return (
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={v => formatCurrency(v)} />
          <Bar dataKey="total" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Total Salary" />
        </BarChart>
      </ResponsiveContainer>
    )

    if (selectedReport === 'attendance') return (
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="present" stroke="#22c55e" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    )

    if (selectedReport === 'department') return (
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie data={chartData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={120} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
            {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    )

    if (selectedReport === 'timeoff') return (
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Requests" />
          <Bar dataKey="days" fill="#22c55e" radius={[4, 4, 0, 0]} name="Days" />
        </BarChart>
      </ResponsiveContainer>
    )

    return null
  }

  return (
    <div>
      <PageHeader title="Reports" subtitle="Generate and view HR reports" />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        {REPORT_TYPES.map(rt => {
          const Icon = rt.icon
          return (
            <button
              key={rt.value}
              onClick={() => { setSelectedReport(rt.value); setGenerated(false) }}
              className={`card p-4 text-left hover:shadow-md transition-shadow border-2 ${
                selectedReport === rt.value ? 'border-primary-500' : 'border-transparent'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${
                selectedReport === rt.value ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'
              }`}>
                <Icon size={18} />
              </div>
              <p className="text-sm font-semibold text-gray-800">{rt.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{rt.description}</p>
            </button>
          )
        })}
      </div>

      <div className="card p-6">
        <div className="flex flex-wrap items-end gap-4 mb-6">
          <Select
            label="Year"
            options={yearOptions}
            value={filters.year}
            onChange={e => setFilters(f => ({ ...f, year: e.target.value }))}
            className="w-28"
          />
          {selectedReport === 'attendance' && (
            <Select
              label="Month"
              options={monthOptions}
              value={filters.month}
              onChange={e => setFilters(f => ({ ...f, month: e.target.value }))}
              className="w-36"
            />
          )}
          <Button onClick={generateReport} loading={loading}>Generate Report</Button>
        </div>

        {renderChart()}
      </div>
    </div>
  )
}
