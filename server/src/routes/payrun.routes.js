const express = require('express');
const PayrunController = require('../controllers/payrun.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
  previewPayrunValidator,
  createPayrunValidator,
  payrunIdValidator
} = require('../validators/payrun.validator');

const router = express.Router();

router.use(authenticate);

// Payrun List & Detail
router.get(
  '/',
  authorize('PAYROLL_USER', 'PAYROLL_MANAGER', 'ADMIN'),
  PayrunController.getPayruns
);

router.get(
  '/:id',
  authorize('PAYROLL_USER', 'PAYROLL_MANAGER', 'ADMIN'),
  payrunIdValidator,
  validate,
  PayrunController.getPayrunById
);

// Two-Step Payrun Creation
// Step 1: Preview eligible employees (does NOT create payrun)
router.post(
  '/preview',
  authorize('PAYROLL_USER', 'PAYROLL_MANAGER', 'ADMIN'),
  previewPayrunValidator,
  validate,
  PayrunController.preview
);

// Step 2: Create payrun in DRAFT status with selected employees
router.post(
  '/',
  authorize('PAYROLL_USER', 'PAYROLL_MANAGER', 'ADMIN'),
  createPayrunValidator,
  validate,
  PayrunController.createPayrun
);

// Payrun State Machine & Lifecycle Actions
// Compute: DRAFT -> COMPUTED
router.post(
  '/:id/compute',
  authorize('PAYROLL_USER', 'PAYROLL_MANAGER', 'ADMIN'),
  payrunIdValidator,
  validate,
  PayrunController.compute
);

// Validate: COMPUTED -> VALIDATED
router.post(
  '/:id/validate',
  authorize('PAYROLL_MANAGER', 'ADMIN'),
  payrunIdValidator,
  validate,
  PayrunController.validate
);

// Mark Paid: VALIDATED -> PAID
router.post(
  '/:id/pay',
  authorize('PAYROLL_MANAGER', 'ADMIN'),
  payrunIdValidator,
  validate,
  PayrunController.pay
);

// Send payslips
router.post(
  '/:id/send-payslips',
  authorize('PAYROLL_MANAGER', 'ADMIN'),
  payrunIdValidator,
  validate,
  PayrunController.sendPayslips
);

module.exports = router;
