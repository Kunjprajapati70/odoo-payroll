export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export const isValidPhone = (phone) => /^\+?[\d\s\-().]{7,20}$/.test(phone)

export const isRequired = (value) => value !== undefined && value !== null && value !== ''

export const minLength = (value, min) => String(value).length >= min

export const maxLength = (value, max) => String(value).length <= max

export const isPositiveNumber = (value) => !isNaN(value) && Number(value) > 0

export const isDateBefore = (dateA, dateB) => new Date(dateA) < new Date(dateB)
