const nodemailer = require('nodemailer')
const {
  SMTP_HOST,
  SMTP_USER,
  SMTP_PASS,
  SMTP_PORT,
  SMTP_FROM,
  COMPANY_NAME,
  NODE_ENV,
} = require('../config/env')
const AppError = require('../utils/AppError')
const { generatePayslipPdf } = require('./pdfService')

const isEmailConfigured = () =>
  Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS)

const getTransporter = () => {
  if (!isEmailConfigured()) return null
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })
}

/**
 * Email a payslip PDF to the employee.
 * When SMTP is not configured, returns a mocked success in development
 * so hackathon demos are not blocked.
 */
const sendPayslipEmail = async (payslip) => {
  const employee = payslip.employee
  if (!employee?.email) {
    throw new AppError('Employee email is missing; cannot send payslip')
  }

  const period = `${new Date(payslip.periodStart).toLocaleDateString()} - ${new Date(payslip.periodEnd).toLocaleDateString()}`
  const pdf = await generatePayslipPdf(payslip)
  const transporter = getTransporter()

  if (!transporter) {
    console.warn(
      `[email] SMTP not configured — mocking send to ${employee.email} (payslip ${payslip._id})`
    )
    if (NODE_ENV === 'production') {
      throw new AppError(
        'Email is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.',
        503
      )
    }
    return {
      sent: true,
      mocked: true,
      to: employee.email,
      message: 'SMTP not configured — email mocked for local demo',
    }
  }

  await transporter.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to: employee.email,
    subject: `${COMPANY_NAME} Payslip — ${period}`,
    text: `Dear ${employee.firstName || 'Employee'},\n\nPlease find attached your payslip for ${period}.\n\nNet pay: ${payslip.netSalary}\n\nRegards,\n${COMPANY_NAME}`,
    attachments: [
      {
        filename: `payslip-${employee.employeeId || payslip._id}.pdf`,
        content: pdf,
        contentType: 'application/pdf',
      },
    ],
  })

  return { sent: true, mocked: false, to: employee.email }
}

/**
 * Send password-reset email (or mock in local demo).
 */
const sendPasswordResetEmail = async (toEmail, rawToken, name) => {
  const { CLIENT_URL } = require('../config/env')
  const resetUrl = `${CLIENT_URL}/reset-password?token=${encodeURIComponent(rawToken)}`
  const transporter = getTransporter()

  if (!transporter) {
    console.warn(`[email] SMTP not configured — mocking password reset to ${toEmail}`)
    console.warn(`[email] Reset URL: ${resetUrl}`)
    if (NODE_ENV === 'production') {
      throw new AppError(
        'Email is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.',
        503
      )
    }
    return {
      sent: true,
      mocked: true,
      to: toEmail,
      resetUrl,
      message: `SMTP not configured — use reset token from response (demo). Link: ${resetUrl}`,
    }
  }

  await transporter.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to: toEmail,
    subject: `${COMPANY_NAME} — Password reset`,
    text: `Hi ${name || 'there'},\n\nReset your password using this link (valid 1 hour):\n${resetUrl}\n\nIf you did not request this, ignore this email.\n\n${COMPANY_NAME}`,
  })

  return { sent: true, mocked: false, to: toEmail, resetUrl }
}

module.exports = {
  isEmailConfigured,
  sendPayslipEmail,
  sendPasswordResetEmail,
}
