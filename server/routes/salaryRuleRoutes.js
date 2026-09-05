const router = require('express').Router()
const { getAll, getById, create, update, remove } = require('../controllers/salaryRuleController')
const { protect } = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')
const { PAYROLL_WRITE_ROLES, PAYROLL_APPROVE_ROLES } = require('../utils/roles')

router.use(protect)
router.get('/', getAll)
router.post('/', requireRole(...PAYROLL_WRITE_ROLES), create)
router.get('/:id', getById)
router.put('/:id', requireRole(...PAYROLL_WRITE_ROLES), update)
router.delete('/:id', requireRole(...PAYROLL_APPROVE_ROLES), remove)

module.exports = router
