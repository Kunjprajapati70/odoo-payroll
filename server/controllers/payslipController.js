const Payslip = require('../models/Payslip')
const { success, notFound } = require('../utils/response')

const getAll = async (req, res) => {
  const { payrun, employee } = req.query
  const filter = {}
  if (payrun) filter.payrun = payrun
  if (employee) filter.employee = employee
  const payslips = await Payslip.find(filter).populate('employee', 'firstName lastName employeeId').sort({ createdAt: -1 })
  success(res, payslips)
}

const getById = async (req, res) => {
  const p = await Payslip.findById(req.params.id).populate('employee').populate('lines')
  if (!p) return notFound(res, 'Payslip not found')
  success(res, p)
}

const downloadPdf = async (req, res) => {
  // TODO: implement PDF generation via pdfService
  res.status(501).json({ success: false, message: 'PDF generation not yet implemented' })
}

const sendEmail = async (req, res) => {
  // TODO: implement email via emailService
  res.status(501).json({ success: false, message: 'Email not yet implemented' })
}

module.exports = { getAll, getById, downloadPdf, sendEmail }
