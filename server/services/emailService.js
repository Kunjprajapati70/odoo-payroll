/**
 * Email Service
 * Sends payslips and notifications via email.
 * TODO: implement using nodemailer or a transactional email provider
 */

const sendPayslipEmail = async (employee, payslip) => {
  throw new Error('Email service not yet implemented')
}

const sendPasswordResetEmail = async (email, resetToken) => {
  throw new Error('Email service not yet implemented')
}

module.exports = { sendPayslipEmail, sendPasswordResetEmail }
