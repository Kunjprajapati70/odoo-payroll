/**
 * Payslip helpers — generation/locking is owned by payrunService during compute.
 */
const Payslip = require('../models/Payslip')
const PayslipLine = require('../models/PayslipLine')
const { generatePayslipPdf } = require('./pdfService')
const { sendPayslipEmail } = require('./emailService')

const getPayslipWithDetails = async (id) =>
  Payslip.findById(id)
    .populate({
      path: 'employee',
      populate: { path: 'department', select: 'name' },
    })
    .populate('contract')
    .populate('salaryStructure', 'name code')
    .populate('lines')
    .populate('payrun', 'name status')

module.exports = {
  getPayslipWithDetails,
  generatePayslipPdf,
  sendPayslipEmail,
  Payslip,
  PayslipLine,
}
