const express = require('express');
const PayslipController = require('../controllers/payslip.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { param } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');

const router = express.Router();

router.use(authenticate);

// List payslips (Employees only see their own; Payroll/HR/Admin see all or filtered)
router.get('/', PayslipController.getPayslips);

// Get single payslip by ID (Employees restricted to their own; others can view all)
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid payslip ID in URL parameter')],
  validate,
  PayslipController.getPayslipById
);

// Download PDF for payslip (Employee can download own; HR/Payroll/Admin can download any)
router.get(
  '/:id/pdf',
  [param('id').isMongoId().withMessage('Invalid payslip ID in URL parameter')],
  validate,
  PayslipController.downloadPDF
);

// Send payslip via email (Employee can request own resend, or Payroll/Admin can send)
router.post(
  '/:id/email',
  [param('id').isMongoId().withMessage('Invalid payslip ID in URL parameter')],
  validate,
  PayslipController.sendEmail
);

module.exports = router;
