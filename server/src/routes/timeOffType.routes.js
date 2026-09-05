const express = require('express');
const TimeOffController = require('../controllers/timeOff.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
  createTypeValidator,
  updateTypeValidator
} = require('../validators/timeOff.validator');

const router = express.Router();

router.use(authenticate);

// List all active time off types (accessible to all authenticated users)
router.get('/', TimeOffController.getAllTypes);
router.get('/:id', TimeOffController.getTypeById);

// Manage time off types (HR & Admin only)
router.post(
  '/',
  authorize('HR_MANAGER', 'PAYROLL_MANAGER', 'ADMIN'),
  createTypeValidator,
  validate,
  TimeOffController.createType
);

router.put(
  '/:id',
  authorize('HR_MANAGER', 'PAYROLL_MANAGER', 'ADMIN'),
  updateTypeValidator,
  validate,
  TimeOffController.updateType
);

router.delete(
  '/:id',
  authorize('HR_MANAGER', 'PAYROLL_MANAGER', 'ADMIN'),
  TimeOffController.deleteType
);

module.exports = router;
