const express = require('express');
const ScheduleController = require('../controllers/schedule.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { ROLES } = require('../constants/roles');
const {
  createScheduleValidator,
  updateScheduleValidator
} = require('../validators/schedule.validator');

const router = express.Router();

router.use(authenticate);

/**
 * @route   GET /api/v1/schedules
 * @desc    Get all working schedules
 * @access  HR_MANAGER, PAYROLL_USER, PAYROLL_MANAGER, ADMIN
 */
router.get(
  '/',
  authorize(ROLES.HR_MANAGER, ROLES.PAYROLL_USER, ROLES.PAYROLL_MANAGER),
  ScheduleController.getAllSchedules
);

/**
 * @route   GET /api/v1/schedules/:id
 * @desc    Get working schedule by ID
 * @access  HR_MANAGER, PAYROLL_USER, PAYROLL_MANAGER, ADMIN
 */
router.get(
  '/:id',
  authorize(ROLES.HR_MANAGER, ROLES.PAYROLL_USER, ROLES.PAYROLL_MANAGER),
  ScheduleController.getScheduleById
);

/**
 * @route   POST /api/v1/schedules
 * @desc    Create a new working schedule
 * @access  HR_MANAGER, PAYROLL_MANAGER, ADMIN
 */
router.post(
  '/',
  authorize(ROLES.HR_MANAGER, ROLES.PAYROLL_MANAGER),
  createScheduleValidator,
  validate,
  ScheduleController.createSchedule
);

/**
 * @route   PUT /api/v1/schedules/:id
 * @desc    Update a working schedule
 * @access  HR_MANAGER, PAYROLL_MANAGER, ADMIN
 */
router.put(
  '/:id',
  authorize(ROLES.HR_MANAGER, ROLES.PAYROLL_MANAGER),
  updateScheduleValidator,
  validate,
  ScheduleController.updateSchedule
);

/**
 * @route   DELETE /api/v1/schedules/:id
 * @desc    Delete a working schedule
 * @access  HR_MANAGER, PAYROLL_MANAGER, ADMIN
 */
router.delete(
  '/:id',
  authorize(ROLES.HR_MANAGER, ROLES.PAYROLL_MANAGER),
  ScheduleController.deleteSchedule
);

module.exports = router;
