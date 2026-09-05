const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const { CLIENT_URL, NODE_ENV } = require('./config/env')
const { errorHandler, notFound } = require('./middleware/errorMiddleware')

// Route imports
const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')
const employeeRoutes = require('./routes/employeeRoutes')
const departmentRoutes = require('./routes/departmentRoutes')
const contractRoutes = require('./routes/contractRoutes')
const scheduleRoutes = require('./routes/scheduleRoutes')
const attendanceRoutes = require('./routes/attendanceRoutes')
const timeOffRoutes = require('./routes/timeOffRoutes')
const salaryStructureRoutes = require('./routes/salaryStructureRoutes')
const salaryRuleRoutes = require('./routes/salaryRuleRoutes')
const payrunRoutes = require('./routes/payrunRoutes')
const payslipRoutes = require('./routes/payslipRoutes')
const dashboardRoutes = require('./routes/dashboardRoutes')
const notificationRoutes = require('./routes/notificationRoutes')

const app = express()

const isPrivateLanOrigin = (origin = '') =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin) ||
  /^https?:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/i.test(origin)

// Allow configured client + local/LAN origins (Wi‑Fi phones & tablets)
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (origin === CLIENT_URL || isPrivateLanOrigin(origin)) return callback(null, true)
    if (NODE_ENV !== 'production') return callback(null, true)
    return callback(new Error(`CORS blocked for origin: ${origin}`))
  },
  credentials: true,
}))
app.use(express.json())
app.use(morgan('dev'))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/employees', employeeRoutes)
app.use('/api/departments', departmentRoutes)
app.use('/api/contracts', contractRoutes)
app.use('/api/schedules', scheduleRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/time-off', timeOffRoutes)
app.use('/api/salary-structures', salaryStructureRoutes)
app.use('/api/salary-rules', salaryRuleRoutes)
app.use('/api/payruns', payrunRoutes)
app.use('/api/payslips', payslipRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/notifications', notificationRoutes)

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'PeoplePay360 API' }))

// Error handling
app.use(notFound)
app.use(errorHandler)

module.exports = app
