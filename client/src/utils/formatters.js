export const formatCurrency = (amount, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount ?? 0)

export const formatDate = (date) =>
  date ? new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(date)) : '—'

export const formatDateInput = (date) =>
  date ? new Date(date).toISOString().split('T')[0] : ''

export const formatFullName = (employee) =>
  employee ? `${employee.firstName} ${employee.lastName}` : '—'

export const formatPercent = (value) =>
  value != null ? `${value}%` : '—'

export const formatDuration = (hours) => {
  if (!hours) return '0h'
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ') : ''
