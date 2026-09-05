const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1)
const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)

const diffInDays = (start, end) => {
  const ms = new Date(end) - new Date(start)
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

const formatPeriod = (start, end) => {
  const s = new Date(start)
  const e = new Date(end)
  return `${s.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} — ${e.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
}

module.exports = { startOfMonth, endOfMonth, diffInDays, formatPeriod }
