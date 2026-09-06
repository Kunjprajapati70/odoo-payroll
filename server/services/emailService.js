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
const templates = require('./emailTemplates')

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const isEmailConfigured = () => Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS)

const isValidEmail = (email) => EMAIL_RE.test(String(email || '').trim())

const getTransporter = () => {
  if (!isEmailConfigured()) return null
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })
}

const formatMoney = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    Number(n) || 0
  )

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN') : '—')

/**
 * Low-level send. Never throws for missing SMTP in development (mocked).
 * Returns { sent, mocked, to, error? }.
 */
const sendMailSafe = async ({ to, subject, html, text, attachments }) => {
  if (!to || !isValidEmail(to)) {
    console.warn(`[email] Invalid or missing recipient: ${to}`)
    return { sent: false, mocked: false, to, error: 'Invalid recipient email' }
  }

  const transporter = getTransporter()
  if (!transporter) {
    console.warn(`[email] SMTP not configured — mocking send to ${to}: ${subject}`)
    if (NODE_ENV === 'production') {
      return {
        sent: false,
        mocked: false,
        to,
        error: 'Email is not configured. Set SMTP_HOST/MAIL_HOST, SMTP_USER/MAIL_USER, and SMTP_PASS/MAIL_PASSWORD.',
      }
    }
    return {
      sent: true,
      mocked: true,
      to,
      message: 'SMTP not configured — email mocked for local demo',
    }
  }

  try {
    await transporter.sendMail({
      from: SMTP_FROM || `PeoplePay360 <${SMTP_USER}>`,
      to,
      subject,
      html,
      text: text || subject,
      attachments: attachments || undefined,
    })
    return { sent: true, mocked: false, to }
  } catch (err) {
    console.error(`[email] Failed to send to ${to}:`, err.message)
    return { sent: false, mocked: false, to, error: err.message }
  }
}

const sendLeaveRequestEmail = async ({ to, employeeName, leaveType, startDate, endDate, reason, status }) => {
  const { subject, html } = templates.leaveRequestEmail({
    employeeName,
    leaveType,
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    reason,
    status,
    companyName: COMPANY_NAME,
  })
  return sendMailSafe({ to, subject, html })
}

const sendLeaveStatusEmail = async ({
  to,
  approved,
  employeeName,
  leaveType,
  startDate,
  endDate,
  comment,
  reason,
}) => {
  const tpl = approved
    ? templates.leaveApprovedEmail({
        employeeName,
        leaveType,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        status: 'approved',
        comment,
        companyName: COMPANY_NAME,
      })
    : templates.leaveRejectedEmail({
        employeeName,
        leaveType,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        status: 'rejected',
        reason: reason || comment,
        companyName: COMPANY_NAME,
      })
  return sendMailSafe({ to, subject: tpl.subject, html: tpl.html })
}

/**
 * Email a payslip PDF to the employee.
 * Optional pdfBuffer avoids regenerating if caller already has one.
 */
const sendPayslipEmail = async (payslip, { pdfBuffer } = {}) => {
  const employee = payslip.employee
  if (!employee?.email) {
    console.warn('[email] Employee email missing; cannot send payslip')
    return { sent: false, mocked: false, error: 'Employee email is missing' }
  }

  const period = `${formatDate(payslip.periodStart)} - ${formatDate(payslip.periodEnd)}`
  const employeeName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'Employee'

  let pdf = pdfBuffer
  if (!pdf) {
    try {
      pdf = await generatePayslipPdf(payslip)
    } catch (err) {
      console.error('[email] PDF generation failed:', err.message)
      pdf = null
    }
  }

  const { subject, html } = templates.payslipGeneratedEmail({
    employeeName,
    payPeriod: period,
    basicSalary: formatMoney(payslip.basicSalary),
    allowances: formatMoney(payslip.totalAllowances),
    deductions: formatMoney(payslip.totalDeductions),
    grossSalary: formatMoney(payslip.grossSalary),
    netSalary: formatMoney(payslip.netSalary),
    companyName: COMPANY_NAME,
  })

  const attachments = pdf
    ? [
        {
          filename: `payslip-${employee.employeeId || payslip._id}.pdf`,
          content: pdf,
          contentType: 'application/pdf',
        },
      ]
    : undefined

  return sendMailSafe({
    to: employee.email,
    subject,
    html,
    text: `Dear ${employeeName},\n\nYour payslip for ${period} is ready.\nNet pay: ${formatMoney(payslip.netSalary)}\n\n${COMPANY_NAME}`,
    attachments,
  })
}

const sendPayrollPaidEmail = async ({
  to,
  employeeName,
  payPeriod,
  netSalary,
  paymentStatus,
  paymentDate,
}) => {
  const { subject, html } = templates.payrollPaidEmail({
    employeeName,
    payPeriod,
    netSalary: formatMoney(netSalary),
    paymentStatus,
    paymentDate: paymentDate ? formatDate(paymentDate) : '—',
    companyName: COMPANY_NAME,
  })
  return sendMailSafe({ to, subject, html })
}

const sendContractExpiryEmail = async ({
  to,
  employeeName,
  endDate,
  remainingDays,
  department,
}) => {
  const { subject, html } = templates.contractExpiryEmail({
    employeeName,
    endDate: formatDate(endDate),
    remainingDays,
    department,
    companyName: COMPANY_NAME,
  })
  return sendMailSafe({ to, subject, html })
}

const sendPasswordResetEmail = async (toEmail, rawToken, name, { baseUrl } = {}) => {
  const { CLIENT_URL } = require('../config/env')
  const origin = String(baseUrl || CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '')
  // Keep token unencoded in path-safe hex (raw is already hex); still encode for query safety
  const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(rawToken)}`

  if (!isValidEmail(toEmail)) {
    throw new AppError('Valid email is required', 400)
  }

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

  const { subject, html } = templates.passwordResetEmail({
    name,
    resetUrl,
    companyName: COMPANY_NAME,
  })

  try {
    await transporter.sendMail({
      from: SMTP_FROM || `PeoplePay360 <${SMTP_USER}>`,
      to: toEmail,
      subject,
      html,
      text: `Hi ${name || 'there'},\n\nReset your password (valid 1 hour):\n${resetUrl}\n\nIf you did not request this, ignore this email.\n\n${COMPANY_NAME}`,
    })
    return { sent: true, mocked: false, to: toEmail, resetUrl }
  } catch (err) {
    console.error('[email] Password reset send failed:', err.message)
    throw new AppError('Failed to send password reset email', 502)
  }
}

/** Welcome email with login ID + password for newly created users. */
const sendWelcomeCredentialsEmail = async ({
  to,
  name,
  loginId,
  password,
  role,
}) => {
  const { CLIENT_URL } = require('../config/env')
  const loginUrl = `${CLIENT_URL || 'http://localhost:5173'}/login`
  const { subject, html } = templates.welcomeCredentialsEmail({
    name,
    loginId: loginId || to,
    password,
    role,
    loginUrl,
    companyName: COMPANY_NAME,
  })
  return sendMailSafe({
    to,
    subject,
    html,
    text: `Hi ${name || 'there'},\n\nYour ${COMPANY_NAME} account is ready.\n\nLogin ID: ${loginId || to}\nPassword: ${password}\nRole: ${role}\nLogin: ${loginUrl}\n\nPlease change your password after first login.\n\n${COMPANY_NAME}`,
  })
}

/** Dev-only SMTP probe — does not touch HR data. */
const sendTestEmail = async (to) => {
  const recipient = to || SMTP_USER
  const tpl = templates.leaveRequestEmail({
    employeeName: 'SMTP Test',
    leaveType: 'N/A',
    startDate: formatDate(new Date()),
    endDate: formatDate(new Date()),
    reason: 'This is a development SMTP configuration test.',
    status: 'test',
    companyName: COMPANY_NAME,
  })
  return sendMailSafe({
    to: recipient,
    subject: `${COMPANY_NAME} — SMTP test`,
    html: tpl.html,
    text: 'PeoplePay360 SMTP configuration test.',
  })
}

module.exports = {
  isEmailConfigured,
  isValidEmail,
  sendMailSafe,
  sendLeaveRequestEmail,
  sendLeaveStatusEmail,
  sendPayslipEmail,
  sendPayrollPaidEmail,
  sendContractExpiryEmail,
  sendWelcomeCredentialsEmail,
  sendPasswordResetEmail,
  sendTestEmail,
}
