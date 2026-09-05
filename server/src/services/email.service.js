const nodemailer = require('nodemailer');
const env = require('../config/env');
const Payslip = require('../models/Payslip');
const Payrun = require('../models/Payrun');
const PDFService = require('./pdf.service');
const { AppError } = require('../utils/response.util');

class EmailService {
  /**
   * Create configured nodemailer transporter
   * Uses environment variables; falls back to json/stream transporter in test/dev if SMTP not configured.
   */
  static createTransporter() {
    // If SMTP credentials are configured, use real SMTP
    if (env.SMTP_USER && env.SMTP_PASS) {
      return nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS
        }
      });
    }

    // Safe simulated transporter for local development / testing without external dependency
    return nodemailer.createTransport({
      jsonTransport: true
    });
  }

  /**
   * Send single payslip email with attached PDF to employee
   * @param {string|Object} payslipOrId - Payslip ID or document
   * @returns {Promise<Object>} Delivery result
   */
  static async sendPayslipEmail(payslipOrId) {
    let payslip = payslipOrId;
    if (!payslip || !payslip.employeeId || !payslip.employeeId.email) {
      payslip = await Payslip.findById(payslipOrId)
        .populate('employeeId')
        .populate('contractId')
        .populate('salaryStructureId')
        .populate('payrunId');
    }

    if (!payslip) {
      throw new AppError('Payslip not found', 404, 'PAYSLIP_NOT_FOUND');
    }

    const employee = payslip.employeeId;
    if (!employee || !employee.email) {
      throw new AppError(
        `Employee '${employee?.employeeCode || 'Unknown'}' is missing an email address`,
        422,
        'MISSING_EMPLOYEE_EMAIL'
      );
    }

    const periodStr = `${PDFService.formatDate(payslip.periodStart)} to ${PDFService.formatDate(payslip.periodEnd)}`;
    const slipNumber = payslip.payslipNumber || `SLIP-${payslip._id}`;
    const empName = `${employee.firstName} ${employee.lastName}`;

    // 1. Generate PDF in-memory buffer
    const pdfBuffer = await PDFService.generatePayslipBuffer(payslip);

    // 2. Prepare Email Content
    const transporter = EmailService.createTransporter();

    const mailOptions = {
      from: env.EMAIL_FROM,
      to: employee.email,
      subject: `Your Payslip for ${periodStr} - PeoplePay360`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #1e3a8a; margin-top: 0;">PeoplePay360 HR & Payroll</h2>
          <p>Dear <strong>${empName}</strong>,</p>
          <p>Your official salary payslip for the pay period <strong>${periodStr}</strong> has been generated and is attached to this email.</p>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Employee Code:</strong> ${employee.employeeCode}</p>
            <p style="margin: 5px 0;"><strong>Payslip Reference:</strong> ${slipNumber}</p>
            <p style="margin: 5px 0;"><strong>Gross Pay:</strong> ${PDFService.formatCurrency(payslip.totals?.gross)}</p>
            <p style="margin: 5px 0;"><strong>Total Deductions:</strong> ${PDFService.formatCurrency(payslip.totals?.deductions)}</p>
            <p style="margin: 5px 0; font-size: 16px; color: #065f46;"><strong>Net Take-Home Pay:</strong> ${PDFService.formatCurrency(payslip.totals?.net)}</p>
          </div>

          <p style="font-size: 12px; color: #6b7280;">Please find your itemized printable payslip attached as a PDF. If you have questions regarding your compensation or attendance record, please contact the payroll department.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="font-size: 11px; color: #9ca3af; text-align: center;">This is an automated notification from PeoplePay360. Please do not reply directly to this message.</p>
        </div>
      `,
      attachments: [
        {
          filename: `payslip-${slipNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    // 3. Send email
    const info = await transporter.sendMail(mailOptions);

    // 4. Update emailedAt timestamp on stored payslip
    payslip.emailedAt = new Date();
    await payslip.save();

    return {
      success: true,
      payslipId: payslip._id,
      employeeId: employee._id,
      email: employee.email,
      messageId: info.messageId || 'simulated-message-id',
      emailedAt: payslip.emailedAt
    };
  }

  /**
   * Bulk email: Send all payslips in a payrun to their respective employees.
   * STRICT: Each employee receives ONLY their own payslip.
   * If an employee email is missing, records failure and continues without crashing.
   * @param {string} payrunId
   * @returns {Promise<Object>} { sent: number, failed: number, results: Array }
   */
  static async sendBulkPayrunPayslips(payrunId) {
    const payrun = await Payrun.findById(payrunId);
    if (!payrun) {
      throw new AppError('Payrun not found', 404, 'PAYRUN_NOT_FOUND');
    }

    // Load all payslips for this payrun
    const payslips = await Payslip.find({ payrunId })
      .populate('employeeId')
      .populate('contractId')
      .populate('salaryStructureId')
      .populate('payrunId');

    if (payslips.length === 0) {
      throw new AppError('No payslips found for this payrun', 422, 'NO_PAYSLIPS');
    }

    const results = [];
    let sentCount = 0;
    let failedCount = 0;

    for (const payslip of payslips) {
      const emp = payslip.employeeId;

      // Handle missing employee profile or email
      if (!emp || !emp.email || !emp.email.trim()) {
        failedCount++;
        results.push({
          payslipId: payslip._id,
          employeeId: emp?._id || null,
          email: null,
          status: 'FAILED',
          error: 'Employee email address is missing or empty'
        });
        continue;
      }

      try {
        // Send individual payslip with strictly that employee's PDF attached
        const sendResult = await EmailService.sendPayslipEmail(payslip);
        sentCount++;
        results.push({
          payslipId: payslip._id,
          employeeId: emp._id,
          email: emp.email,
          status: 'SENT',
          messageId: sendResult.messageId
        });
      } catch (err) {
        failedCount++;
        results.push({
          payslipId: payslip._id,
          employeeId: emp._id,
          email: emp.email,
          status: 'FAILED',
          error: err.message
        });
      }
    }

    return {
      sent: sentCount,
      failed: failedCount,
      results
    };
  }
}

module.exports = EmailService;
