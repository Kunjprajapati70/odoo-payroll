const router = require('express').Router()
const {
  getAll,
  getById,
  getEmployeeAttendance,
  create,
  update,
  remove,
  checkIn,
  checkOut,
  todayStatus,
} = require('../controllers/attendanceController')
const { protect } = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')
const { HR_ROLES, ROLES } = require('../utils/roles')

router.use(protect)
router.get('/', getAll)
router.get('/today', todayStatus)
// Any authenticated user can punch (auto-links employee profile)
router.post('/check-in', checkIn)
router.post('/check-out', checkOut)
router.get('/employee/:employeeId', getEmployeeAttendance)
router.post('/', requireRole(...HR_ROLES), create)
router.get('/:id', getById)
router.put('/:id', requireRole(...HR_ROLES), update)
router.delete('/:id', requireRole(ROLES.ADMIN, ROLES.HR_MANAGER), remove)

module.exports = router
