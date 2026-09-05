const SalaryStructureService = require('../services/salaryStructure.service');
const { successResponse } = require('../utils/response.util');

class SalaryStructureController {
  static async createStructure(req, res, next) {
    try {
      const structure = await SalaryStructureService.createStructure(req.body);
      return successResponse(res, 'Salary structure created successfully', { structure }, 201);
    } catch (error) {
      next(error);
    }
  }

  static async getStructures(req, res, next) {
    try {
      const structures = await SalaryStructureService.getStructures(req.query);
      return successResponse(res, 'Salary structures retrieved', { structures }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getStructureById(req, res, next) {
    try {
      const structure = await SalaryStructureService.getStructureById(req.params.id);
      return successResponse(res, 'Salary structure retrieved', { structure }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async updateStructure(req, res, next) {
    try {
      const structure = await SalaryStructureService.updateStructure(req.params.id, req.body);
      return successResponse(res, 'Salary structure updated successfully', { structure }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async deleteStructure(req, res, next) {
    try {
      const result = await SalaryStructureService.deleteStructure(req.params.id);
      return successResponse(res, result.message, { structureId: result.structureId }, 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SalaryStructureController;
