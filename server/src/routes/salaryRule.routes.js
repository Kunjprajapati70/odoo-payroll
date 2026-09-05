const express = require('express');
const SalaryRuleController = require('../controllers/salaryRule.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
  createRuleValidator,
  updateRuleValidator
} = require('../validators/salaryRule.validator');

const router = express.Router();

router.use(authenticate);

// List & view rules (HR, Payroll, Admin)
router.get(
  '/',
  authorize('HR_MANAGER', 'PAYROLL_USER', 'PAYROLL_MANAGER', 'ADMIN'),
  SalaryRuleController.getRules
);

router.get(
  '/:id',
  authorize('HR_MANAGER', 'PAYROLL_USER', 'PAYROLL_MANAGER', 'ADMIN'),
  SalaryRuleController.getRuleById
);

// Create, update, delete rules (Payroll Manager and Admin only)
router.post(
  '/',
  authorize('PAYROLL_MANAGER', 'ADMIN'),
  createRuleValidator,
  validate,
  SalaryRuleController.createRule
);

router.put(
  '/:id',
  authorize('PAYROLL_MANAGER', 'ADMIN'),
  updateRuleValidator,
  validate,
  SalaryRuleController.updateRule
);

router.delete(
  '/:id',
  authorize('PAYROLL_MANAGER', 'ADMIN'),
  SalaryRuleController.deleteRule
);

module.exports = router;
