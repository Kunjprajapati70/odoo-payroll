const router = require('express').Router()
const { getAll, getById, create, update, remove } = require('../controllers/contractController')
const { protect } = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')
const { validate } = require('../middleware/validationMiddleware')
const { contractValidation } = require('../utils/validators')
const { HR_ROLES, ROLES } = require('../utils/roles')

router.use(protect)
router.get('/', getAll)
router.post('/', requireRole(...HR_ROLES), contractValidation, validate, create)
router.get('/:id', getById)
router.put('/:id', requireRole(...HR_ROLES), update)
router.delete('/:id', requireRole(ROLES.ADMIN, ROLES.HR_MANAGER), remove)

module.exports = router
