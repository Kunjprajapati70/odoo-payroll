const router = require('express').Router()
const ctrl = require('../controllers/payrunController')
const { protect } = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')
const { PAYROLL_WRITE_ROLES, PAYROLL_APPROVE_ROLES } = require('../utils/roles')

router.use(protect)

router.get('/', ctrl.getAll)
router.get('/:id', ctrl.getById)
router.post('/', requireRole(...PAYROLL_WRITE_ROLES), ctrl.create)
router.post('/:id/compute', requireRole(...PAYROLL_WRITE_ROLES), ctrl.compute)
router.put('/:id/approve', requireRole(...PAYROLL_APPROVE_ROLES), ctrl.approve)
router.put('/:id/validate', requireRole(...PAYROLL_APPROVE_ROLES), ctrl.validate)
router.put('/:id/mark-paid', requireRole(...PAYROLL_APPROVE_ROLES), ctrl.markPaid)
router.post('/:id/send-payslips', requireRole(...PAYROLL_WRITE_ROLES, ...PAYROLL_APPROVE_ROLES), ctrl.sendPayslips)
router.put('/:id/cancel', requireRole(...PAYROLL_APPROVE_ROLES), ctrl.cancel)

module.exports = router
