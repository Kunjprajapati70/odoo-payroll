const SalaryRuleService = require('../services/salaryRule.service');
const { successResponse } = require('../utils/response.util');

class SalaryRuleController {
  static async createRule(req, res, next) {
    try {
      const rule = await SalaryRuleService.createRule(req.body);
      return successResponse(res, 'Salary rule created successfully', { rule }, 201);
    } catch (error) {
      next(error);
    }
  }

  static async getRules(req, res, next) {
    try {
      const rules = await SalaryRuleService.getRules(req.query);
      return successResponse(res, 'Salary rules retrieved', { rules }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getRuleById(req, res, next) {
    try {
      const rule = await SalaryRuleService.getRuleById(req.params.id);
      return successResponse(res, 'Salary rule retrieved', { rule }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async updateRule(req, res, next) {
    try {
      const rule = await SalaryRuleService.updateRule(req.params.id, req.body);
      return successResponse(res, 'Salary rule updated successfully', { rule }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async deleteRule(req, res, next) {
    try {
      const result = await SalaryRuleService.deleteRule(req.params.id);
      return successResponse(res, result.message, { ruleId: result.ruleId }, 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SalaryRuleController;
