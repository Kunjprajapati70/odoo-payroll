const PDFDocument = require('pdfkit')
const { COMPANY_NAME } = require('../config/env')
const AppError = require('../utils/AppError')

const formatMoney = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n) || 0)

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

/**
 * Generate a payslip PDF buffer.
 * @param {object} payslip - populated payslip (employee, lines/breakdown, contract)
 * @returns {Promise<Buffer>}
 */
const generatePayslipPdf = (payslip) =>
  new Promise((resolve, reject) => {
    if (!payslip) return reject(new AppError('Payslip is required for PDF generation'))

    const doc = new PDFDocument({ margin: 50, size: 'A4' })
    const chunks = []
    doc.on('data', (c) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const employee = payslip.employee || {}
    const lines = (payslip.breakdown?.length
      ? payslip.breakdown
      : (payslip.lines || []).map((l) => (l.toObject ? l.toObject() : l))
    ).sort((a, b) => (a.sequence || 0) - (b.sequence || 0))

    // Header
    doc.fontSize(20).fillColor('#1e293b').text(COMPANY_NAME, { align: 'left' })
    doc.fontSize(12).fillColor('#64748b').text('Payslip', { align: 'left' })
    doc.moveDown()
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e2e8f0')
    doc.moveDown()

    // Employee info
    doc.fontSize(11).fillColor('#0f172a')
    const left = 50
    const right = 300
    let y = doc.y

    const info = [
      ['Employee', `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || '—'],
      ['Employee ID', employee.employeeId || '—'],
      ['Department', employee.department?.name || '—'],
      ['Job Title', employee.jobTitle || '—'],
      ['Period', `${formatDate(payslip.periodStart)} – ${formatDate(payslip.periodEnd)}`],
      ['Status', (payslip.status || '').toUpperCase()],
    ]

    info.forEach(([label, value], i) => {
      const col = i % 2
      const row = Math.floor(i / 2)
      const x = col === 0 ? left : right
      const yy = y + row * 28
      doc.fontSize(9).fillColor('#64748b').text(label, x, yy)
      doc.fontSize(11).fillColor('#0f172a').text(String(value), x, yy + 12)
    })

    doc.y = y + Math.ceil(info.length / 2) * 28 + 10
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e2e8f0')
    doc.moveDown()

    // Breakdown table
    doc.fontSize(12).fillColor('#0f172a').text('Salary Breakdown', { underline: false })
    doc.moveDown(0.5)

    doc.fontSize(9).fillColor('#64748b')
    doc.text('Description', 50, doc.y, { continued: true, width: 280 })
    doc.text('Category', 330, doc.y, { continued: true, width: 100 })
    doc.text('Amount', 450, doc.y, { width: 95, align: 'right' })
    doc.moveDown(0.3)
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e2e8f0')
    doc.moveDown(0.4)

    lines.forEach((line) => {
      if (['gross', 'net'].includes(line.category)) return
      doc.fontSize(10).fillColor('#0f172a')
      const rowY = doc.y
      doc.text(line.name || line.code || '—', 50, rowY, { width: 270 })
      doc.fillColor('#64748b').text((line.category || '').toUpperCase(), 330, rowY, { width: 100 })
      doc.fillColor('#0f172a').text(formatMoney(line.amount), 450, rowY, { width: 95, align: 'right' })
      doc.moveDown(0.6)
    })

    doc.moveDown(0.5)
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e2e8f0')
    doc.moveDown(0.5)

    const totals = [
      ['Basic Salary', payslip.basicSalary],
      ['Allowances', payslip.totalAllowances],
      ['Gross Salary', payslip.grossSalary],
      ['Deductions', payslip.totalDeductions],
      ['Net Salary', payslip.netSalary],
    ]

    totals.forEach(([label, value], idx) => {
      const isNet = idx === totals.length - 1
      doc.fontSize(isNet ? 12 : 10).fillColor('#0f172a').font(isNet ? 'Helvetica-Bold' : 'Helvetica')
      const rowY = doc.y
      doc.text(label, 330, rowY, { width: 120 })
      doc.text(formatMoney(value), 450, rowY, { width: 95, align: 'right' })
      doc.moveDown(0.55)
    })

    doc.font('Helvetica')
    doc.moveDown(2)
    doc.fontSize(8).fillColor('#94a3b8').text(
      'This document is system-generated. Historical payslip amounts are frozen and do not change if salary rules are updated later.',
      { align: 'left' }
    )

    doc.end()
  })

module.exports = { generatePayslipPdf }
