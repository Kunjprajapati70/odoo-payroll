const PayrunService = require('../services/payrun.service');
const { successResponse } = require('../utils/response.util');

class PayrunController {
  static async preview(req, res, next) {
    try {
      const result = await PayrunService.previewPayrun(req.body);
      return successResponse(res, 'Payrun preview generated: eligible employees discovered', result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async createPayrun(req, res, next) {
    try {
      const payrun = await PayrunService.createPayrun({
        ...req.body,
        createdBy: req.user._id
      });
      return successResponse(res, 'Payrun created in DRAFT state', { payrun }, 201);
    } catch (error) {
      next(error);
    }
  }

  static async getPayruns(req, res, next) {
    try {
      const result = await PayrunService.getPayruns(req.query);
      return successResponse(res, 'Payruns retrieved', result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getPayrunById(req, res, next) {
    try {
      const payrun = await PayrunService.getPayrunById(req.params.id);
      return successResponse(res, 'Payrun retrieved', { payrun }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async compute(req, res, next) {
    try {
      const payrun = await PayrunService.computePayrun(req.params.id);
      return successResponse(res, 'Payrun successfully computed', { payrun }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async validate(req, res, next) {
    try {
      const result = await PayrunService.validatePayrun(req.params.id);
      return successResponse(res, result.message, result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async pay(req, res, next) {
    try {
      const result = await PayrunService.payPayrun(req.params.id);
      return successResponse(res, result.message, result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async sendPayslips(req, res, next) {
    try {
      const result = await PayrunService.sendPayslips(req.params.id);
      return successResponse(res, result.message, result, 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PayrunController;
