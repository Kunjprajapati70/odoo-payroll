const User = require('../models/User')
const { success, created, notFound } = require('../utils/response')

const getAll = async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 })
  success(res, users)
}

const getById = async (req, res) => {
  const user = await User.findById(req.params.id)
  if (!user) return notFound(res, 'User not found')
  success(res, user)
}

const create = async (req, res) => {
  const user = await User.create(req.body)
  created(res, user)
}

const update = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
  if (!user) return notFound(res, 'User not found')
  success(res, user)
}

module.exports = { getAll, getById, create, update }
