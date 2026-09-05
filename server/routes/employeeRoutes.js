const router = require('express').Router()
const { getAll, getById, create, update, remove } = require('../controllers/employeeController')
const { protect } = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')
const { validate } = require('../middleware/validationMiddleware')
const { employeeValidation } = require('../utils/validators')
const { ROLES, HR_ROLES } = require('../utils/roles')

router.use(protect)
router.get('/', getAll)
router.post('/', requireRole(...HR_ROLES), employeeValidation, validate, create)
router.get('/:id', getById)
router.put('/:id', requireRole(...HR_ROLES), update)
router.delete('/:id', requireRole(ROLES.ADMIN, ROLES.HR_MANAGER), remove)

module.exports = router
