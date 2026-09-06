const express = require('express')
const { getAll, getById, create, update, remove } = require('../controllers/userController')
const { protect } = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')
const { USER_MANAGE_ROLES } = require('../utils/roles')

const router = express.Router()

router.use(protect)

router.get('/', requireRole(...USER_MANAGE_ROLES), getAll)
router.post('/', requireRole(...USER_MANAGE_ROLES), create)
router.get('/:id', requireRole(...USER_MANAGE_ROLES), getById)
router.put('/:id', requireRole(...USER_MANAGE_ROLES), update)
router.delete('/:id', requireRole(...USER_MANAGE_ROLES), remove)

module.exports = router
