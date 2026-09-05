const express = require('express');
const TimeOffController = require('../controllers/timeOff.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
  createLeaveRequestValidator,
  updateLeaveRequestValidator,
  refuseLeaveRequestValidator
} = require('../validators/timeOff.validator');

const router = express.Router();

router.use(authenticate);

// View leave requests (Employees see own, HR/Admin see all)
router.get('/', TimeOffController.getLeaveRequests);
router.get('/:id', TimeOffController.getLeaveRequestById);

// Submit leave request (Employees submit for self, HR/Admin can submit for employees)
router.post(
  '/',
  createLeaveRequestValidator,
  validate,
  TimeOffController.createLeaveRequest
);

// Update pending leave request (owner or HR/Admin)
router.put(
  '/:id',
  updateLeaveRequestValidator,
  validate,
  TimeOffController.updateLeaveRequest
);

// Approve leave request (HR & Admin only) - Deducts allocation atomically
router.post(
  '/:id/approve',
  authorize('HR_MANAGER', 'PAYROLL_MANAGER', 'ADMIN'),
  TimeOffController.approveLeaveRequest
);

// Refuse leave request (HR & Admin only)
router.post(
  '/:id/refuse',
  authorize('HR_MANAGER', 'PAYROLL_MANAGER', 'ADMIN'),
  refuseLeaveRequestValidator,
  validate,
  TimeOffController.refuseLeaveRequest
);

// Cancel leave request (Employees can cancel own, HR/Admin can cancel any) - Restores allocation balance
router.post(
  '/:id/cancel',
  TimeOffController.cancelLeaveRequest
);

module.exports = router;
