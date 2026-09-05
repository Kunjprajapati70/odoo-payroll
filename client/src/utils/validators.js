export const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || '').trim())

/** Exactly 10 digits (spaces/dashes stripped). */
export const isValidPhone = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '')
  return digits.length === 10
}

export const normalizePhone = (phone) => String(phone || '').replace(/\D/g, '').slice(0, 10)

export const isRequired = (value) => value !== undefined && value !== null && String(value).trim() !== ''

export const minLength = (value, min) => String(value || '').length >= min

export const maxLength = (value, max) => String(value || '').length <= max

export const isPositiveNumber = (value) => !Number.isNaN(Number(value)) && Number(value) > 0

export const isNonNegativeNumber = (value) => !Number.isNaN(Number(value)) && Number(value) >= 0

export const isDateBefore = (dateA, dateB) => new Date(dateA) < new Date(dateB)

/** Leave may start from the first day of the current month onward (no past months). */
export const isLeaveMonthAllowed = (dateStr) => {
  if (!dateStr) return false
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return false
  const now = new Date()
  const min = new Date(now.getFullYear(), now.getMonth(), 1)
  min.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return d >= min
}
