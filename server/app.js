const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const { CLIENT_URL } = require('./config/env')
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

const app = express()

// Middleware
app.use(cors({ origin: CLIENT_URL, credentials: true }))
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

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'PeoplePay360 API' }))

// Error handling
app.use(notFound)
app.use(errorHandler)

module.exports = app
