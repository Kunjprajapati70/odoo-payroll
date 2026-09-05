const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

router.use(authenticate);

// Admin-only route
router.get('/admin', authorize(ROLES.ADMIN), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome Admin - Full System Access Granted',
    user: { id: req.user._id, role: req.user.role }
  });
});

// HR Manager route (HR_MANAGER and ADMIN)
router.get('/hr', authorize(ROLES.HR_MANAGER), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'HR Operations Access Granted',
    user: { id: req.user._id, role: req.user.role }
  });
});

// Payroll route (PAYROLL_USER, PAYROLL_MANAGER, and ADMIN)
router.get('/payroll', authorize(ROLES.PAYROLL_USER, ROLES.PAYROLL_MANAGER), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Payroll Processing Access Granted',
    user: { id: req.user._id, role: req.user.role }
  });
});

// Employee route
router.get('/employee', authorize(ROLES.EMPLOYEE), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Employee Portal Access Granted',
    user: { id: req.user._id, role: req.user.role }
  });
});

module.exports = router;
