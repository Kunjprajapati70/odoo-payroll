const express = require('express');
const ContractController = require('../controllers/contract.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { ROLES } = require('../constants/roles');
const {
  createContractValidator,
  updateContractValidator
} = require('../validators/contract.validator');

const router = express.Router();

router.use(authenticate);

/**
 * @route   GET /api/v1/contracts/applicable
 * @desc    Find the applicable contract for a payroll period
 * @access  HR_MANAGER, PAYROLL_USER, PAYROLL_MANAGER, ADMIN
 */
router.get(
  '/applicable',
  authorize(ROLES.HR_MANAGER, ROLES.PAYROLL_USER, ROLES.PAYROLL_MANAGER),
  ContractController.getApplicableContract
);

/**
 * @route   GET /api/v1/contracts
 * @desc    List all contracts with filters
 * @access  HR_MANAGER, PAYROLL_USER, PAYROLL_MANAGER, ADMIN
 */
router.get(
  '/',
  authorize(ROLES.HR_MANAGER, ROLES.PAYROLL_USER, ROLES.PAYROLL_MANAGER),
  ContractController.getAllContracts
);

/**
 * @route   GET /api/v1/contracts/:id
 * @desc    Get contract by ID
 * @access  HR_MANAGER, PAYROLL_USER, PAYROLL_MANAGER, ADMIN
 */
router.get(
  '/:id',
  authorize(ROLES.HR_MANAGER, ROLES.PAYROLL_USER, ROLES.PAYROLL_MANAGER),
  ContractController.getContractById
);

/**
 * @route   POST /api/v1/contracts
 * @desc    Create a new contract
 * @access  HR_MANAGER, PAYROLL_MANAGER, ADMIN
 */
router.post(
  '/',
  authorize(ROLES.HR_MANAGER, ROLES.PAYROLL_MANAGER),
  createContractValidator,
  validate,
  ContractController.createContract
);

/**
 * @route   PUT /api/v1/contracts/:id
 * @desc    Update a contract
 * @access  HR_MANAGER, PAYROLL_MANAGER, ADMIN
 */
router.put(
  '/:id',
  authorize(ROLES.HR_MANAGER, ROLES.PAYROLL_MANAGER),
  updateContractValidator,
  validate,
  ContractController.updateContract
);

/**
 * @route   DELETE /api/v1/contracts/:id
 * @desc    Delete a contract
 * @access  HR_MANAGER, PAYROLL_MANAGER, ADMIN
 */
router.delete(
  '/:id',
  authorize(ROLES.HR_MANAGER, ROLES.PAYROLL_MANAGER),
  ContractController.deleteContract
);

module.exports = router;
