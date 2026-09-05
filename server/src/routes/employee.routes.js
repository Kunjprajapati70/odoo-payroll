const express = require('express');
const EmployeeController = require('../controllers/employee.controller');
const ContractController = require('../controllers/contract.controller');
const AttendanceController = require('../controllers/attendance.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize, authorizeSelfOrRoles } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { ROLES } = require('../constants/roles');
const {
  createEmployeeValidator,
  updateEmployeeValidator,
  updateStatusValidator
} = require('../validators/employee.validator');

const router = express.Router();

router.use(authenticate);

/**
 * @route   GET /api/v1/employees
 * @desc    Get all employees with filters (search, department, employeeType, status, page, limit)
 * @access  HR_MANAGER, PAYROLL_USER, PAYROLL_MANAGER, ADMIN
 */
router.get(
  '/',
  authorize(ROLES.HR_MANAGER, ROLES.PAYROLL_USER, ROLES.PAYROLL_MANAGER),
  EmployeeController.getAllEmployees
);

/**
 * @route   GET /api/v1/employees/:id
 * @desc    Get employee by ID
 * @access  Self (EMPLOYEE) or HR_MANAGER, PAYROLL_USER, PAYROLL_MANAGER, ADMIN
 */
router.get(
  '/:id',
  authorizeSelfOrRoles('id', ROLES.HR_MANAGER, ROLES.PAYROLL_USER, ROLES.PAYROLL_MANAGER),
  EmployeeController.getEmployeeById
);

/**
 * @route   POST /api/v1/employees
 * @desc    Create a new employee
 * @access  HR_MANAGER, PAYROLL_MANAGER, ADMIN
 */
router.post(
  '/',
  authorize(ROLES.HR_MANAGER, ROLES.PAYROLL_MANAGER),
  createEmployeeValidator,
  validate,
  EmployeeController.createEmployee
);

/**
 * @route   PUT /api/v1/employees/:id
 * @desc    Update employee details
 * @access  HR_MANAGER, PAYROLL_MANAGER, ADMIN
 */
router.put(
  '/:id',
  authorize(ROLES.HR_MANAGER, ROLES.PAYROLL_MANAGER),
  updateEmployeeValidator,
  validate,
  EmployeeController.updateEmployee
);

/**
 * @route   DELETE /api/v1/employees/:id
 * @desc    Delete an employee
 * @access  HR_MANAGER, PAYROLL_MANAGER, ADMIN
 */
router.delete(
  '/:id',
  authorize(ROLES.HR_MANAGER, ROLES.PAYROLL_MANAGER),
  EmployeeController.deleteEmployee
);

/**
 * @route   PATCH /api/v1/employees/:id/status
 * @desc    Update employee status
 * @access  HR_MANAGER, PAYROLL_MANAGER, ADMIN
 */
router.patch(
  '/:id/status',
  authorize(ROLES.HR_MANAGER, ROLES.PAYROLL_MANAGER),
  updateStatusValidator,
  validate,
  EmployeeController.updateStatus
);

/**
 * @route   GET /api/v1/employees/:employeeId/contracts
 * @desc    Get employee contract history
 * @access  Self (EMPLOYEE) or HR_MANAGER, PAYROLL_USER, PAYROLL_MANAGER, ADMIN
 */
router.get(
  '/:employeeId/contracts',
  authorizeSelfOrRoles('employeeId', ROLES.HR_MANAGER, ROLES.PAYROLL_USER, ROLES.PAYROLL_MANAGER),
  ContractController.getContractsByEmployee
);

/**
 * @route   GET /api/v1/employees/:employeeId/attendance
 * @desc    Get employee attendance history
 * @access  Self (EMPLOYEE) or HR_MANAGER, PAYROLL_USER, PAYROLL_MANAGER, ADMIN
 */
router.get(
  '/:employeeId/attendance',
  authorizeSelfOrRoles('employeeId', ROLES.HR_MANAGER, ROLES.PAYROLL_USER, ROLES.PAYROLL_MANAGER),
  AttendanceController.getEmployeeAttendance
);

module.exports = router;
