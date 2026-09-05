const express = require('express');
const SalaryStructureController = require('../controllers/salaryStructure.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
  createStructureValidator,
  updateStructureValidator
} = require('../validators/salaryStructure.validator');

const router = express.Router();

router.use(authenticate);

// List & view structures (HR, Payroll, Admin)
router.get(
  '/',
  authorize('HR_MANAGER', 'PAYROLL_USER', 'PAYROLL_MANAGER', 'ADMIN'),
  SalaryStructureController.getStructures
);

router.get(
  '/:id',
  authorize('HR_MANAGER', 'PAYROLL_USER', 'PAYROLL_MANAGER', 'ADMIN'),
  SalaryStructureController.getStructureById
);

// Create, update, delete structures (Payroll Manager and Admin only)
router.post(
  '/',
  authorize('PAYROLL_MANAGER', 'ADMIN'),
  createStructureValidator,
  validate,
  SalaryStructureController.createStructure
);

router.put(
  '/:id',
  authorize('PAYROLL_MANAGER', 'ADMIN'),
  updateStructureValidator,
  validate,
  SalaryStructureController.updateStructure
);

router.delete(
  '/:id',
  authorize('PAYROLL_MANAGER', 'ADMIN'),
  SalaryStructureController.deleteStructure
);

module.exports = router;
