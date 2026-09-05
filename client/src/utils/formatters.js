export const formatCurrency = (amount, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount ?? 0)

export const formatDate = (date) =>
  date ? new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(date)) : '—'

const pad2 = (n) => String(n).padStart(2, '0')

/** Local calendar date for <input type="date"> (avoids UTC day-shift). */
export const formatDateInput = (date) => {
  if (!date) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(date).trim())) return String(date).trim()
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/** Local wall-clock time HH:mm:ss from a Date/ISO value. */
export const formatClockTime = (value) => {
  if (!value) return ''
  const raw = String(value).trim()
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(raw)) {
    const [h, m, s = '00'] = raw.split(':')
    return `${pad2(h)}:${pad2(m)}:${pad2(s)}`
  }
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`
}

/** Exact worked duration from check-out − check-in (HH:mm:ss). */
export const formatWorkedDuration = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return ''
  const ms = new Date(checkOut) - new Date(checkIn)
  if (!Number.isFinite(ms) || ms <= 0) return '00:00:00'
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`
}

/** Decimal hours from check-out − check-in (2 dp), exact from whole seconds. */
export const calcHoursWorked = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0
  const ms = new Date(checkOut) - new Date(checkIn)
  if (!Number.isFinite(ms) || ms <= 0) return 0
  return Math.round((Math.floor(ms / 1000) / 3600) * 100) / 100
}

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
