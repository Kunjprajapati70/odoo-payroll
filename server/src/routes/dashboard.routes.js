const express = require('express');
const DashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

const router = express.Router();

router.use(authenticate);

/**
 * GET /api/v1/dashboard
 * Access: HR_MANAGER, PAYROLL_USER, PAYROLL_MANAGER, ADMIN
 */
router.get(
  '/',
  authorize('HR_MANAGER', 'PAYROLL_USER', 'PAYROLL_MANAGER', 'ADMIN'),
  DashboardController.getDashboard
);

module.exports = router;
