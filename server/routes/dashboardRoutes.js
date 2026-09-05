const router = require('express').Router()
const { getStats, getSalaryChart, getAttendanceChart, getDepartmentChart, getAlerts } = require('../controllers/dashboardController')
const { protect } = require('../middleware/authMiddleware')

router.use(protect)
router.get('/stats', getStats)
router.get('/salary-chart', getSalaryChart)
router.get('/attendance-chart', getAttendanceChart)
router.get('/department-chart', getDepartmentChart)
router.get('/alerts', getAlerts)

module.exports = router
