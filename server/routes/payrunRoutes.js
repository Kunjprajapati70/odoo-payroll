const router = require('express').Router()
const { getAll, getById, create, compute, approve, cancel } = require('../controllers/payrunController')
const { protect } = require('../middleware/authMiddleware')

router.use(protect)
router.get('/', getAll)
router.post('/', create)
router.get('/:id', getById)
router.post('/:id/compute', compute)
router.put('/:id/approve', approve)
router.put('/:id/cancel', cancel)

module.exports = router
