const router = require('express').Router()
const { getAll, getById, create, update, remove } = require('../controllers/userController')
const { protect } = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')

router.use(protect)
router.get('/', requireRole('admin'), getAll)
router.post('/', requireRole('admin'), create)
router.get('/:id', requireRole('admin'), getById)
router.put('/:id', requireRole('admin'), update)
router.delete('/:id', requireRole('admin'), remove)

module.exports = router
