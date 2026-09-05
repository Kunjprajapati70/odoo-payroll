/**
 * PeoplePay360 HTML email templates.
 * Values are escaped before interpolation to reduce XSS in mail clients.
 */

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const wrap = (title, bodyHtml, companyName = 'PeoplePay360') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr>
            <td style="background:#0f766e;padding:20px 24px;">
              <div style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:0.02em;">${escapeHtml(companyName)}</div>
              <div style="font-size:12px;color:#ccfbf1;margin-top:4px;">HR &amp; Payroll</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <h1 style="margin:0 0 16px;font-size:18px;color:#111827;">${escapeHtml(title)}</h1>
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;">
              This is an automated message from ${escapeHtml(companyName)}. Please do not reply directly to this email.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

const row = (label, value) => `
  <tr>
    <td style="padding:8px 0;color:#6b7280;width:40%;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:8px 0;color:#111827;font-weight:600;">${escapeHtml(value)}</td>
  </tr>
`

const detailsTable = (rows) => `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:12px 0 8px;">
    ${rows.map(([l, v]) => row(l, v)).join('')}
  </table>
`

const leaveRequestEmail = ({ employeeName, leaveType, startDate, endDate, reason, status, companyName }) => {
  const title = `New Leave Request - ${employeeName}`
  const html = wrap(
    title,
    `
      <p style="margin:0 0 12px;line-height:1.5;">A new leave request requires your attention.</p>
      ${detailsTable([
        ['Employee', employeeName],
        ['Leave type', leaveType],
        ['Start date', startDate],
        ['End date', endDate],
        ['Reason', reason || '—'],
        ['Status', status || 'pending'],
      ])}
    `,
    companyName
  )
  return { subject: title, html }
}

const leaveApprovedEmail = ({ employeeName, leaveType, startDate, endDate, status, comment, companyName }) => {
  const title = `Leave Request Approved - ${employeeName}`
  const html = wrap(
    title,
    `
      <p style="margin:0 0 12px;line-height:1.5;">Your leave request has been approved.</p>
      ${detailsTable([
        ['Employee', employeeName],
        ['Leave type', leaveType],
        ['Start date', startDate],
        ['End date', endDate],
        ['Status', status || 'approved'],
        ['HR comment', comment || '—'],
      ])}
    `,
    companyName
  )
  return { subject: title, html }
}

const leaveRejectedEmail = ({ employeeName, leaveType, startDate, endDate, status, reason, companyName }) => {
  const title = `Leave Request Rejected - ${employeeName}`
  const html = wrap(
    title,
    `
      <p style="margin:0 0 12px;line-height:1.5;">Your leave request was not approved.</p>
      ${detailsTable([
        ['Employee', employeeName],
        ['Leave type', leaveType],
        ['Start date', startDate],
        ['End date', endDate],
        ['Status', status || 'rejected'],
        ['Rejection reason', reason || '—'],
      ])}
    `,
    companyName
  )
  return { subject: title, html }
}

const payslipGeneratedEmail = ({
  employeeName,
  payPeriod,
  basicSalary,
  allowances,
  deductions,
  grossSalary,
  netSalary,
  companyName,
}) => {
  const title = `Your Payslip - ${payPeriod}`
  const html = wrap(
    title,
    `
      <p style="margin:0 0 12px;line-height:1.5;">Hi ${escapeHtml(employeeName)}, your payslip is ready. A PDF is attached if available.</p>
      ${detailsTable([
        ['Employee', employeeName],
        ['Pay period', payPeriod],
        ['Basic salary', basicSalary],
        ['Allowances', allowances],
        ['Deductions', deductions],
        ['Gross salary', grossSalary],
        ['Net salary', netSalary],
      ])}
    `,
    companyName
  )
  return { subject: title, html }
}

const payrollPaidEmail = ({ employeeName, payPeriod, netSalary, paymentStatus, paymentDate, companyName }) => {
  const title = `Salary Payment Completed - ${payPeriod}`
  const html = wrap(
    title,
    `
      <p style="margin:0 0 12px;line-height:1.5;">Your salary payment has been processed.</p>
      ${detailsTable([
        ['Employee', employeeName],
        ['Pay period', payPeriod],
        ['Net salary', netSalary],
        ['Payment status', paymentStatus || 'paid'],
        ['Payment date', paymentDate || '—'],
      ])}
    `,
    companyName
  )
  return { subject: title, html }
}

const contractExpiryEmail = ({
  employeeName,
  endDate,
  remainingDays,
  department,
  companyName,
}) => {
  const title = `Contract Expiring Soon - ${employeeName}`
  const html = wrap(
    title,
    `
      <p style="margin:0 0 12px;line-height:1.5;">An employee contract is approaching its end date. Please review and take HR action if needed.</p>
      ${detailsTable([
        ['Employee', employeeName],
        ['Department', department || '—'],
        ['Contract end date', endDate],
        ['Remaining days', String(remainingDays)],
        ['Action', 'Review renewal / offboarding'],
      ])}
    `,
    companyName
  )
  return { subject: title, html }
}

const welcomeCredentialsEmail = ({
  name,
  loginId,
  password,
  role,
  loginUrl,
  companyName,
}) => {
  const title = `Your ${companyName || 'PeoplePay360'} Account`
  const roleLabel = String(role || 'employee').replace(/_/g, ' ')
  const html = wrap(
    title,
    `
      <p style="margin:0 0 12px;line-height:1.5;">Hi ${escapeHtml(name || 'there')}, an administrator has created your PeoplePay360 account. Use the credentials below to sign in.</p>
      ${detailsTable([
        ['Login ID (Email)', loginId],
        ['Temporary password', password],
        ['Role', roleLabel],
        ['Login URL', loginUrl || '—'],
      ])}
      <p style="margin:16px 0 0;line-height:1.5;font-size:13px;color:#4b5563;">
        For your security, please sign in and change your password from <strong>Settings</strong> after your first login.
      </p>
    `,
    companyName
  )
  return { subject: title, html }
}

module.exports = {
  escapeHtml,
  leaveRequestEmail,
  leaveApprovedEmail,
  leaveRejectedEmail,
  payslipGeneratedEmail,
  payrollPaidEmail,
  contractExpiryEmail,
  welcomeCredentialsEmail,
}
