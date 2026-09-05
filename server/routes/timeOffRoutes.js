const router = require('express').Router()
const ctrl = require('../controllers/timeOffController')
const { protect } = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')
const { ROLES, TIMEOFF_APPROVE_ROLES, HR_ROLES } = require('../utils/roles')

router.use(protect)

router.get('/types', ctrl.getTypes)
router.post('/types', requireRole(...HR_ROLES), ctrl.createType)
router.put('/types/:id', requireRole(...HR_ROLES), ctrl.updateType)
router.delete('/types/:id', requireRole(ROLES.ADMIN, ROLES.HR_MANAGER), ctrl.deleteType)

router.get('/allocations', ctrl.getAllocations)
router.post('/allocations', requireRole(...HR_ROLES), ctrl.createAllocation)
router.put('/allocations/:id', requireRole(...HR_ROLES), ctrl.updateAllocation)

router.get('/requests', ctrl.getRequests)
router.post('/requests', ctrl.createRequest)
router.put('/requests/:id', ctrl.updateRequest)
router.put('/requests/:id/approve', requireRole(...TIMEOFF_APPROVE_ROLES), ctrl.approveRequest)
router.put('/requests/:id/reject', requireRole(...TIMEOFF_APPROVE_ROLES), ctrl.rejectRequest)

module.exports = router
