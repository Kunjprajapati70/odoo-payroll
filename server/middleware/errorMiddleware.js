const notFound = (req, res, next) => {
  const error = new Error(`Not Found: ${req.originalUrl}`)
  error.statusCode = 404
  next(error)
}

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500)
  let message = err.message || 'Server error'

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    statusCode = 400
    message = `Invalid ${err.path}: ${err.value}`
  }

  // Mongoose validation
  if (err.name === 'ValidationError') {
    statusCode = 400
    message = Object.values(err.errors).map((e) => e.message).join(', ')
  }

  // Duplicate key
  if (err.code === 11000) {
    statusCode = 409
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'field'
    message = `Duplicate value for ${field}`
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || undefined,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  })
}

module.exports = { notFound, errorHandler }
