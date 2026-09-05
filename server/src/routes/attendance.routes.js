const express = require('express');
const AttendanceController = require('../controllers/attendance.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
  checkInValidator,
  checkOutValidator,
  createAttendanceValidator,
  updateAttendanceValidator
} = require('../validators/attendance.validator');

const router = express.Router();

// All attendance routes require authentication
router.use(authenticate);

// Check-in and Check-out
router.post('/check-in', checkInValidator, validate, AttendanceController.checkIn);
router.post('/check-out', checkOutValidator, validate, AttendanceController.checkOut);

// List and view attendance
router.get('/', AttendanceController.getAllAttendance);
router.get('/:id', AttendanceController.getAttendanceById);

// Manual attendance management (HR and Admin only)
router.post(
  '/',
  authorize('HR_MANAGER', 'PAYROLL_MANAGER', 'ADMIN'),
  createAttendanceValidator,
  validate,
  AttendanceController.createAttendance
);

router.put(
  '/:id',
  authorize('HR_MANAGER', 'PAYROLL_MANAGER', 'ADMIN'),
  updateAttendanceValidator,
  validate,
  AttendanceController.updateAttendance
);

module.exports = router;
