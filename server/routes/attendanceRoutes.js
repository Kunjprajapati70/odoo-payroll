const router = require('express').Router()
const { getAll, getById, create, update, remove } = require('../controllers/attendanceController')
const { protect } = require('../middleware/authMiddleware')

router.use(protect)
router.get('/', getAll)
router.post('/', create)
router.get('/:id', getById)
router.put('/:id', update)
router.delete('/:id', remove)

module.exports = router
