const PDFDocument = require('pdfkit');
const { AppError } = require('../utils/response.util');

class PDFService {
  /**
   * Format numbers as Indian Rupee string: e.g. INR 50,000.00
   */
  static formatCurrency(amount) {
    const num = Number(amount) || 0;
    return `INR ${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  /**
   * Format Date to YYYY-MM-DD
   */
  static formatDate(date) {
    if (!date) return 'N/A';
    return new Date(date).toISOString().slice(0, 10);
  }

  /**
   * Generate PDF Document stream / buffer from stored payslip data
   * @param {Object} payslip - Populated payslip document
   * @returns {Promise<Buffer>}
   */
  static async generatePayslipBuffer(payslip) {
    if (!payslip) throw new AppError('Payslip data is required to generate PDF', 422, 'INVALID_PAYSLIP');

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      try {
        PDFService.buildPDFContent(doc, payslip);
        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Build complete printable payslip PDF layout
   */
  static buildPDFContent(doc, payslip) {
    const employee = payslip.employeeId || {};
    const contract = payslip.contractId || {};
    const payrun = payslip.payrunId || {};
    const totals = payslip.totals || {};
    const lines = payslip.lines || [];

    const empName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'Employee';
    const empCode = employee.employeeCode || 'N/A';
    const department = employee.department || contract.department || 'N/A';
    const jobPosition = employee.jobPosition || contract.jobPosition || 'N/A';
    const slipNumber = payslip.payslipNumber || `SLIP-${payslip._id}`;
    const periodStr = `${PDFService.formatDate(payslip.periodStart)} to ${PDFService.formatDate(payslip.periodEnd)}`;

    // 1. Company Header
    doc
      .fillColor('#1E3A8A')
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('PeoplePay360 HR & Payroll', 40, 40);

    doc
      .fillColor('#4B5563')
      .fontSize(10)
      .font('Helvetica')
      .text('Confidential Salary Statement', 40, 65)
      .text(`Payslip Reference: ${slipNumber}`, 360, 45, { align: 'right' })
      .text(`Generated: ${new Date().toISOString().slice(0, 10)}`, 360, 60, { align: 'right' });

    doc.moveTo(40, 85).lineTo(555, 85).strokeColor('#E5E7EB').lineWidth(1.5).stroke();

    // 2. Employee & Pay Period Details Grid
    let y = 100;
    doc.rect(40, y, 515, 80).fillColor('#F9FAFB').fill().strokeColor('#E5E7EB').lineWidth(1).stroke();

    doc.fillColor('#111827').font('Helvetica-Bold').fontSize(10);
    doc.text('EMPLOYEE DETAILS', 55, y + 10);
    doc.text('PAY PERIOD & ATTENDANCE', 310, y + 10);

    doc.font('Helvetica').fontSize(9).fillColor('#374151');
    doc.text(`Name: ${empName}`, 55, y + 28);
    doc.text(`Employee Code: ${empCode}`, 55, y + 42);
    doc.text(`Department: ${department}`, 55, y + 56);
    doc.text(`Job Position: ${jobPosition}`, 55, y + 70);

    doc.text(`Period: ${periodStr}`, 310, y + 28);
    doc.text(`Payrun: ${payrun.name || 'Monthly Payroll'}`, 310, y + 42);
    doc.text(`Worked Days: ${payslip.workedDays || 0} days`, 310, y + 56);
    doc.text(`Worked Hours: ${payslip.workedHours || 0} hrs`, 310, y + 70);

    // 3. Earnings & Deductions Tables Header
    y = 195;
    doc.rect(40, y, 250, 22).fillColor('#1E3A8A').fill();
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9).text('EARNINGS', 50, y + 6);
    doc.text('AMOUNT (INR)', 220, y + 6, { align: 'right', width: 60 });

    doc.rect(305, y, 250, 22).fillColor('#1E3A8A').fill();
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9).text('DEDUCTIONS', 315, y + 6);
    doc.text('AMOUNT (INR)', 485, y + 6, { align: 'right', width: 60 });

    // Filter Earnings and Deductions lines
    const earningsLines = lines.filter((l) => l.category === 'BASIC' || l.category === 'ALLOWANCE');
    const deductionLines = lines.filter((l) => l.category === 'DEDUCTION');

    const maxLines = Math.max(earningsLines.length, deductionLines.length, 1);
    let rowY = y + 25;
    const rowHeight = 20;

    doc.font('Helvetica').fontSize(9);

    for (let i = 0; i < maxLines; i++) {
      const isAlt = i % 2 === 1;
      const bg = isAlt ? '#F3F4F6' : '#FFFFFF';

      // Left box (Earnings)
      doc.rect(40, rowY, 250, rowHeight).fillColor(bg).fill().strokeColor('#E5E7EB').lineWidth(0.5).stroke();
      if (i < earningsLines.length) {
        const el = earningsLines[i];
        doc.fillColor('#1F2937').text(`${el.name || el.code}`, 50, rowY + 5, { width: 160 });
        doc.text(PDFService.formatCurrency(el.amount), 200, rowY + 5, { align: 'right', width: 80 });
      }

      // Right box (Deductions)
      doc.rect(305, rowY, 250, rowHeight).fillColor(bg).fill().strokeColor('#E5E7EB').lineWidth(0.5).stroke();
      if (i < deductionLines.length) {
        const dl = deductionLines[i];
        doc.fillColor('#1F2937').text(`${dl.name || dl.code}`, 315, rowY + 5, { width: 160 });
        doc.text(PDFService.formatCurrency(dl.amount), 465, rowY + 5, { align: 'right', width: 80 });
      }

      rowY += rowHeight;
    }

    // Totals Rows
    doc.rect(40, rowY, 250, 22).fillColor('#E5E7EB').fill();
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#111827').text('GROSS EARNINGS', 50, rowY + 6);
    doc.text(PDFService.formatCurrency(totals.gross), 200, rowY + 6, { align: 'right', width: 80 });

    doc.rect(305, rowY, 250, 22).fillColor('#E5E7EB').fill();
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#111827').text('TOTAL DEDUCTIONS', 315, rowY + 6);
    doc.text(PDFService.formatCurrency(totals.deductions), 465, rowY + 6, { align: 'right', width: 80 });

    rowY += 32;

    // 4. NET PAY BANNER
    doc.rect(40, rowY, 515, 36).fillColor('#065F46').fill();
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(12).text('NET SALARY PAYABLE:', 55, rowY + 11);
    doc.fontSize(14).text(PDFService.formatCurrency(totals.net), 350, rowY + 10, { align: 'right', width: 195 });

    rowY += 48;

    // 5. Detailed Rule Breakdown Table
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#1E3A8A').text('SALARY RULE BREAKDOWN (EXECUTION SEQUENCE)', 40, rowY);
    rowY += 15;

    doc.rect(40, rowY, 515, 18).fillColor('#374151').fill();
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8);
    doc.text('SEQ', 45, rowY + 5);
    doc.text('RULE CODE', 75, rowY + 5);
    doc.text('DESCRIPTION', 160, rowY + 5);
    doc.text('CATEGORY', 330, rowY + 5);
    doc.text('CALC TYPE', 420, rowY + 5);
    doc.text('AMOUNT', 490, rowY + 5, { align: 'right', width: 55 });

    rowY += 18;
    doc.font('Helvetica').fontSize(8);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const bg = i % 2 === 1 ? '#F9FAFB' : '#FFFFFF';

      doc.rect(40, rowY, 515, 16).fillColor(bg).fill().strokeColor('#E5E7EB').lineWidth(0.5).stroke();
      doc.fillColor('#374151');
      doc.text(String(line.sequence || (i + 1) * 10), 45, rowY + 4);
      doc.text(line.code, 75, rowY + 4);
      doc.text(line.name || line.code, 160, rowY + 4, { width: 160, lineBreak: false });
      doc.text(line.category, 330, rowY + 4);
      doc.text(line.calculationType || 'FIXED', 420, rowY + 4);
      doc.text(PDFService.formatCurrency(line.amount), 470, rowY + 4, { align: 'right', width: 75 });

      rowY += 16;
    }

    // 6. Security Footer
    const footerY = 770;
    doc.moveTo(40, footerY).lineTo(555, footerY).strokeColor('#E5E7EB').lineWidth(1).stroke();
    doc
      .fillColor('#6B7280')
      .fontSize(8)
      .font('Helvetica')
      .text('This is a computer-generated document authorized by PeoplePay360 HR & Payroll Engine.', 40, footerY + 8, { align: 'center', width: 515 })
      .text('No physical signature is required. For inquiries, contact payroll@peoplepay360.com.', 40, footerY + 20, { align: 'center', width: 515 });
  }

  /**
   * Stream PDF directly to HTTP response
   */
  static async streamPDF(payslip, res) {
    const buffer = await PDFService.generatePayslipBuffer(payslip);
    const filename = `payslip-${payslip.payslipNumber || payslip._id}.pdf`;

    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Content-Length': buffer.length
    });

    res.end(buffer);
  }
}

module.exports = PDFService;
