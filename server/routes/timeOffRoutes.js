const router = require('express').Router()
const ctrl = require('../controllers/timeOffController')
const { protect } = require('../middleware/authMiddleware')

router.use(protect)

router.get('/types', ctrl.getTypes)
router.post('/types', ctrl.createType)
router.put('/types/:id', ctrl.updateType)
router.delete('/types/:id', ctrl.deleteType)

router.get('/allocations', ctrl.getAllocations)
router.post('/allocations', ctrl.createAllocation)
router.put('/allocations/:id', ctrl.updateAllocation)

router.get('/requests', ctrl.getRequests)
router.post('/requests', ctrl.createRequest)
router.put('/requests/:id/approve', ctrl.approveRequest)
router.put('/requests/:id/reject', ctrl.rejectRequest)

module.exports = router
