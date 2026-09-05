const asyncHandler = require('../utils/asyncHandler')
const Payslip = require('../models/Payslip')
const { generatePayslipPdf } = require('../services/pdfService')
const { sendPayslipEmail } = require('../services/emailService')
const { success, notFound } = require('../utils/response')
const AppError = require('../utils/AppError')

const getAll = asyncHandler(async (req, res) => {
  const { payrun, employee } = req.query
  const filter = {}
  if (req.user?.role === 'employee') {
    const empId = req.user.employee?._id || req.user.employee
    if (!empId) return success(res, [])
    filter.employee = empId
  } else {
    if (payrun) filter.payrun = payrun
    if (employee) filter.employee = employee
  }

  const payslips = await Payslip.find(filter)
    .populate('employee', 'firstName lastName employeeId department')
    .populate('payrun', 'name status')
    .sort({ createdAt: -1 })
  success(res, payslips)
})

const getById = asyncHandler(async (req, res) => {
  const p = await Payslip.findById(req.params.id)
    .populate({
      path: 'employee',
      populate: { path: 'department', select: 'name' },
    })
    .populate('contract')
    .populate('salaryStructure', 'name code')
    .populate('lines')
    .populate('payrun', 'name status')
  if (!p) return notFound(res, 'Payslip not found')
  success(res, p)
})

const downloadPdf = asyncHandler(async (req, res) => {
  const p = await Payslip.findById(req.params.id)
    .populate({
      path: 'employee',
      populate: { path: 'department', select: 'name' },
    })
    .populate('lines')
  if (!p) return notFound(res, 'Payslip not found')

  const pdf = await generatePayslipPdf(p)
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="payslip-${p.employee?.employeeId || p._id}.pdf"`
  )
  res.send(pdf)
})

const sendEmail = asyncHandler(async (req, res) => {
  const p = await Payslip.findById(req.params.id)
    .populate({
      path: 'employee',
      populate: { path: 'department', select: 'name' },
    })
    .populate('lines')
  if (!p) return notFound(res, 'Payslip not found')

  try {
    const result = await sendPayslipEmail(p)
    success(res, result, 'Payslip emailed successfully')
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode || 400).json({ success: false, message: err.message })
    }
    throw err
  }
})

module.exports = { getAll, getById, downloadPdf, sendEmail }
