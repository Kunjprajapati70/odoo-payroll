const express = require('express');
const TimeOffController = require('../controllers/timeOff.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
  createAllocationValidator,
  updateAllocationValidator
} = require('../validators/timeOff.validator');

const router = express.Router();

router.use(authenticate);

// List & view leave allocations (Employees see own, HR/Admin see all)
router.get('/', TimeOffController.getAllocations);
router.get('/:id', TimeOffController.getAllocationById);

// Create, update, and approve allocations (HR & Admin only)
router.post(
  '/',
  authorize('HR_MANAGER', 'PAYROLL_MANAGER', 'ADMIN'),
  createAllocationValidator,
  validate,
  TimeOffController.createAllocation
);

router.put(
  '/:id',
  authorize('HR_MANAGER', 'PAYROLL_MANAGER', 'ADMIN'),
  updateAllocationValidator,
  validate,
  TimeOffController.updateAllocation
);

router.post(
  '/:id/approve',
  authorize('HR_MANAGER', 'PAYROLL_MANAGER', 'ADMIN'),
  TimeOffController.approveAllocation
);

module.exports = router;
