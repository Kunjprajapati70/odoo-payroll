const ContractService = require('../services/contract.service');
const { successResponse } = require('../utils/response.util');

class ContractController {
  static async getAllContracts(req, res, next) {
    try {
      const result = await ContractService.getAllContracts(req.query);
      return successResponse(res, 'Contracts retrieved successfully', result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getContractById(req, res, next) {
    try {
      const contract = await ContractService.getContractById(req.params.id);
      return successResponse(res, 'Contract retrieved successfully', { contract }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async createContract(req, res, next) {
    try {
      const contract = await ContractService.createContract(req.body);
      return successResponse(res, 'Contract created successfully', { contract }, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateContract(req, res, next) {
    try {
      const contract = await ContractService.updateContract(req.params.id, req.body);
      return successResponse(res, 'Contract updated successfully', { contract }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async deleteContract(req, res, next) {
    try {
      const result = await ContractService.deleteContract(req.params.id);
      return successResponse(res, result.message, { contractId: result.contractId }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getContractsByEmployee(req, res, next) {
    try {
      const result = await ContractService.getContractsByEmployee(req.params.employeeId);
      return successResponse(res, 'Employee contract history retrieved', result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getApplicableContract(req, res, next) {
    try {
      const { employeeId, periodStart, periodEnd } = req.query;
      const contract = await ContractService.findApplicableContract(employeeId, periodStart, periodEnd);
      return successResponse(
        res,
        contract ? 'Applicable contract found' : 'No applicable contract for this period',
        { contract },
        200
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ContractController;
