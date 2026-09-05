const PayslipService = require('../services/payslip.service');
const PDFService = require('../services/pdf.service');
const EmailService = require('../services/email.service');
const { successResponse } = require('../utils/response.util');

class PayslipController {
  static async getPayslips(req, res, next) {
    try {
      const result = await PayslipService.getPayslips(req.query, req.user);
      return successResponse(res, 'Payslips retrieved', result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getPayslipById(req, res, next) {
    try {
      const payslip = await PayslipService.getPayslipById(req.params.id, req.user);
      return successResponse(res, 'Payslip retrieved', { payslip }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async downloadPDF(req, res, next) {
    try {
      const payslip = await PayslipService.getPayslipById(req.params.id, req.user);
      await PDFService.streamPDF(payslip, res);
    } catch (error) {
      next(error);
    }
  }

  static async sendEmail(req, res, next) {
    try {
      const payslip = await PayslipService.getPayslipById(req.params.id, req.user);
      const result = await EmailService.sendPayslipEmail(payslip);
      return successResponse(res, 'Payslip email sent successfully', result, 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PayslipController;
