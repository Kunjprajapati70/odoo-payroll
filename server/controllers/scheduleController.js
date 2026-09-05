const asyncHandler = require('../utils/asyncHandler')
const WorkingSchedule = require('../models/WorkingSchedule')
const { success, created, notFound, badRequest } = require('../utils/response')

const normalizeScheduleBody = (body = {}) => {
  const data = { ...body }
  if (data.weeklyHours != null && data.hoursPerWeek == null) {
    data.hoursPerWeek = Number(data.weeklyHours)
  }
  if (data.hoursPerDay != null && data.hoursPerWeek == null && Array.isArray(data.workDays)) {
    data.hoursPerWeek = Number(data.hoursPerDay) * data.workDays.length
  }
  return data
}

const serializeSchedule = (s) => {
  if (!s) return s
  const obj = s.toObject ? s.toObject() : { ...s }
  obj.weeklyHours = obj.hoursPerWeek
  if (obj.workDays?.length) {
    obj.hoursPerDay = Math.round((obj.hoursPerWeek / obj.workDays.length) * 100) / 100
  }
  return obj
}

const getAll = asyncHandler(async (req, res) => {
  const list = await WorkingSchedule.find().sort({ name: 1 })
  success(res, list.map(serializeSchedule))
})

const getById = asyncHandler(async (req, res) => {
  const s = await WorkingSchedule.findById(req.params.id)
  if (!s) return notFound(res, 'Schedule not found')
  success(res, serializeSchedule(s))
})

const create = asyncHandler(async (req, res) => {
  const data = normalizeScheduleBody(req.body)
  if (!data.name) return badRequest(res, 'name is required')
  created(res, serializeSchedule(await WorkingSchedule.create(data)))
})

const update = asyncHandler(async (req, res) => {
  const data = normalizeScheduleBody(req.body)
  const s = await WorkingSchedule.findByIdAndUpdate(req.params.id, data, {
    new: true,
    runValidators: true,
  })
  if (!s) return notFound(res, 'Schedule not found')
  success(res, serializeSchedule(s))
})

const remove = asyncHandler(async (req, res) => {
  const s = await WorkingSchedule.findByIdAndDelete(req.params.id)
  if (!s) return notFound(res, 'Schedule not found')
  success(res, null, 'Schedule deleted')
})

module.exports = { getAll, getById, create, update, remove }
