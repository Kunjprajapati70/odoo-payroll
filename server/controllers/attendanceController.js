const asyncHandler = require('../utils/asyncHandler')
const Attendance = require('../models/Attendance')
const { getMonthlySummary } = require('../services/attendanceService')
const { resolveEmployeeIdForUser } = require('../services/employeeLinkService')
const { success, created, notFound, badRequest } = require('../utils/response')

const parseLocalDate = (value) => {
  if (!value) return undefined
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate())
  }
  const raw = String(value).trim()
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  }
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return undefined
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

const toDateTime = (dateValue, timeValue) => {
  if (timeValue == null || timeValue === '') return undefined
  if (timeValue instanceof Date && !Number.isNaN(timeValue.getTime())) return timeValue

  const raw = String(timeValue).trim()
  if (raw.includes('T') && !/^\d{1,2}:\d{2}/.test(raw)) {
    const d = new Date(raw)
    return Number.isNaN(d.getTime()) ? undefined : d
  }

  const timeMatch = raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
  if (timeMatch) {
    const base = parseLocalDate(dateValue) || new Date()
    return new Date(
      base.getFullYear(),
      base.getMonth(),
      base.getDate(),
      Number(timeMatch[1]),
      Number(timeMatch[2]),
      Number(timeMatch[3] || 0),
      0
    )
  }

  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? undefined : d
}

const pad2 = (n) => String(n).padStart(2, '0')

const computeHours = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0
  const ms = new Date(checkOut) - new Date(checkIn)
  if (!Number.isFinite(ms) || ms <= 0) return 0
  // Exact from whole seconds → 2 decimal hours
  return Math.round((Math.floor(ms / 1000) / 3600) * 100) / 100
}

const formatDurationHms = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return ''
  const ms = new Date(checkOut) - new Date(checkIn)
  if (!Number.isFinite(ms) || ms <= 0) return '00:00:00'
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`
}

const normalizeAttendanceBody = (body = {}, existing = null) => {
  const data = { ...body }
  if (data.date) {
    const local = parseLocalDate(data.date)
    if (!local) throw Object.assign(new Error('Invalid date'), { statusCode: 400 })
    data.date = local
  }
  const baseDate = data.date || (existing && existing.date) || new Date()
  const checkIn = toDateTime(baseDate, data.checkIn)
  const checkOut = toDateTime(baseDate, data.checkOut)

  if (data.checkIn !== undefined) {
    if (data.checkIn === '' || data.checkIn == null) data.checkIn = null
    else if (checkIn) data.checkIn = checkIn
    else throw Object.assign(new Error('Invalid checkIn time'), { statusCode: 400 })
  }
  if (data.checkOut !== undefined) {
    if (data.checkOut === '' || data.checkOut == null) data.checkOut = null
    else if (checkOut) data.checkOut = checkOut
    else throw Object.assign(new Error('Invalid checkOut time'), { statusCode: 400 })
  }

  const finalIn = data.checkIn !== undefined ? data.checkIn : existing?.checkIn
  const finalOut = data.checkOut !== undefined ? data.checkOut : existing?.checkOut
  if (finalIn && finalOut && new Date(finalOut) < new Date(finalIn)) {
    throw Object.assign(new Error('Check-out must be after check-in'), { statusCode: 400 })
  }
  data.hoursWorked = computeHours(finalIn, finalOut)
  if (data.notes === '') delete data.notes
  return data
}

const formatTime = (d) => {
  if (!d) return ''
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return ''
  // Accurate local wall-clock time HH:mm:ss
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`
}

const serializeAttendance = (doc) => {
  if (!doc) return doc
  const obj = doc.toObject ? doc.toObject() : { ...doc }
  obj.checkInTime = formatTime(obj.checkIn)
  obj.checkOutTime = formatTime(obj.checkOut)
  // Always derive hours from actual punch timestamps
  obj.hoursWorked = computeHours(obj.checkIn, obj.checkOut)
  obj.duration = formatDurationHms(obj.checkIn, obj.checkOut)
  return obj
}

const startOfDay = (d = new Date()) => {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

const endOfDay = (d = new Date()) => {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

const getAll = asyncHandler(async (req, res) => {
  const { employee, from, to, dateFrom, dateTo, status, search } = req.query
  const filter = {}
  if (req.user?.role === 'employee') {
    const empId = await resolveEmployeeIdForUser(req.user)
    if (!empId) return badRequest(res, 'Your account is not linked to an employee record')
    filter.employee = empId
  } else if (employee) {
    filter.employee = employee
  }
  if (status) filter.status = status
  const start = from || dateFrom
  const end = to || dateTo
  if (start || end) filter.date = {}
  if (start) filter.date.$gte = new Date(start)
  if (end) {
    const endDate = new Date(end)
    endDate.setHours(23, 59, 59, 999)
    filter.date.$lte = endDate
  }

  let records = await Attendance.find(filter)
    .populate('employee', 'firstName lastName employeeId email')
    .sort({ date: -1 })

  if (search) {
    const q = String(search).toLowerCase()
    records = records.filter((r) => {
      const e = r.employee || {}
      const name = `${e.firstName || ''} ${e.lastName || ''}`.toLowerCase()
      return name.includes(q) || (e.employeeId || '').toLowerCase().includes(q) || (e.email || '').toLowerCase().includes(q)
    })
  }

  success(res, records.map(serializeAttendance))
})

const getById = asyncHandler(async (req, res) => {
  const r = await Attendance.findById(req.params.id).populate('employee')
  if (!r) return notFound(res, 'Record not found')
  success(res, serializeAttendance(r))
})

const getEmployeeAttendance = asyncHandler(async (req, res) => {
  const { employeeId } = req.params
  const year = Number(req.query.year) || new Date().getFullYear()
  const month = Number(req.query.month) || new Date().getMonth() + 1
  const summary = await getMonthlySummary(employeeId, year, month)
  const records = await Attendance.find({
    employee: employeeId,
    date: { $gte: summary.start, $lte: summary.end },
  }).sort({ date: 1 })
  success(res, { ...summary, records: records.map(serializeAttendance) })
})

const create = asyncHandler(async (req, res) => {
  let data
  try {
    data = normalizeAttendanceBody(req.body)
  } catch (err) {
    return badRequest(res, err.message)
  }
  if (!data.employee || !data.date || Number.isNaN(data.date.getTime())) {
    return badRequest(res, 'employee and date are required')
  }
  try {
    const record = await Attendance.create(data)
    const populated = await Attendance.findById(record._id).populate('employee', 'firstName lastName employeeId')
    created(res, serializeAttendance(populated))
  } catch (err) {
    if (err.code === 11000) return badRequest(res, 'Attendance already recorded for this employee on this date')
    throw err
  }
})

const update = asyncHandler(async (req, res) => {
  const existing = await Attendance.findById(req.params.id)
  if (!existing) return notFound(res, 'Record not found')
  let data
  try {
    data = normalizeAttendanceBody(
      { ...req.body, date: req.body.date || existing.date },
      existing
    )
  } catch (err) {
    return badRequest(res, err.message)
  }
  try {
    Object.assign(existing, data)
    await existing.save()
    const r = await Attendance.findById(existing._id).populate('employee', 'firstName lastName employeeId')
    success(res, serializeAttendance(r))
  } catch (err) {
    if (err.code === 11000) return badRequest(res, 'Attendance already recorded for this employee on this date')
    throw err
  }
})

const remove = asyncHandler(async (req, res) => {
  const r = await Attendance.findByIdAndDelete(req.params.id)
  if (!r) return notFound(res, 'Record not found')
  success(res, null, 'Record deleted')
})

const checkIn = asyncHandler(async (req, res) => {
  const empId = await resolveEmployeeIdForUser(req.user)
  if (!empId) return badRequest(res, 'Could not create/link an employee profile for attendance')

  const today = startOfDay()
  let record = await Attendance.findOne({ employee: empId, date: { $gte: today, $lte: endOfDay() } })
  if (record?.checkIn) return badRequest(res, 'You have already checked in today')

  const now = new Date()
  if (record) {
    record.checkIn = now
    record.status = record.status || 'present'
    record.hoursWorked = computeHours(record.checkIn, record.checkOut)
    await record.save()
  } else {
    record = await Attendance.create({
      employee: empId,
      date: today,
      checkIn: now,
      status: 'present',
      hoursWorked: 0,
    })
  }

  const populated = await Attendance.findById(record._id).populate('employee', 'firstName lastName employeeId')
  created(res, serializeAttendance(populated), 'Checked in')
})

const checkOut = asyncHandler(async (req, res) => {
  const empId = await resolveEmployeeIdForUser(req.user)
  if (!empId) return badRequest(res, 'Could not create/link an employee profile for attendance')

  const today = startOfDay()
  const record = await Attendance.findOne({ employee: empId, date: { $gte: today, $lte: endOfDay() } })
  if (!record || !record.checkIn) return badRequest(res, 'Check in first before checking out')
  if (record.checkOut) return badRequest(res, 'You have already checked out today')

  record.checkOut = new Date()
  record.hoursWorked = computeHours(record.checkIn, record.checkOut)
  await record.save()

  const populated = await Attendance.findById(record._id).populate('employee', 'firstName lastName employeeId')
  success(res, serializeAttendance(populated), 'Checked out')
})

const todayStatus = asyncHandler(async (req, res) => {
  const empId = await resolveEmployeeIdForUser(req.user)
  if (!empId) return success(res, null)
  const record = await Attendance.findOne({
    employee: empId,
    date: { $gte: startOfDay(), $lte: endOfDay() },
  }).populate('employee', 'firstName lastName employeeId')
  success(res, record ? serializeAttendance(record) : null)
})

module.exports = {
  getAll, getById, getEmployeeAttendance, create, update, remove, checkIn, checkOut, todayStatus,
}
