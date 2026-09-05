const express = require('express');
const authRoutes = require('./auth.routes');

const router = express.Router();

/**
 * Health check endpoint
 * GET /api/v1/health
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'PeoplePay360 API is running'
  });
});

// Authentication routes
router.use('/auth', authRoutes);

// Core HR & Schedule routes
const employeeRoutes = require('./employee.routes');
const contractRoutes = require('./contract.routes');
const scheduleRoutes = require('./schedule.routes');

router.use('/employees', employeeRoutes);
router.use('/contracts', contractRoutes);
router.use('/schedules', scheduleRoutes);

// Attendance & Time Off routes
const attendanceRoutes = require('./attendance.routes');
const timeOffTypeRoutes = require('./timeOffType.routes');
const leaveAllocationRoutes = require('./leaveAllocation.routes');
const leaveRequestRoutes = require('./leaveRequest.routes');

router.use('/attendance', attendanceRoutes);
router.use('/time-off/types', timeOffTypeRoutes);
router.use('/leave-allocations', leaveAllocationRoutes);
router.use('/leave-requests', leaveRequestRoutes);

// Salary Structure & Salary Rule routes
const salaryRuleRoutes = require('./salaryRule.routes');
const salaryStructureRoutes = require('./salaryStructure.routes');

router.use('/salary-rules', salaryRuleRoutes);
router.use('/salary-structures', salaryStructureRoutes);

// Payrun & Payslip routes
const payrunRoutes = require('./payrun.routes');
const payslipRoutes = require('./payslip.routes');

router.use('/payruns', payrunRoutes);
router.use('/payslips', payslipRoutes);

// Payroll Dashboard routes
const dashboardRoutes = require('./dashboard.routes');
router.use('/dashboard', dashboardRoutes);

// RBAC demonstration & testing routes
const rbacDemoRoutes = require('./rbac-demo.routes');
router.use('/rbac-demo', rbacDemoRoutes);

module.exports = router;
