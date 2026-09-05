const EmployeeService = require('../services/employee.service');
const { successResponse } = require('../utils/response.util');

class EmployeeController {
  static async getAllEmployees(req, res, next) {
    try {
      const result = await EmployeeService.getAllEmployees(req.query);
      return successResponse(res, 'Employees fetched successfully', result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getEmployeeById(req, res, next) {
    try {
      const employee = await EmployeeService.getEmployeeById(req.params.id);
      return successResponse(res, 'Employee retrieved successfully', { employee }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async createEmployee(req, res, next) {
    try {
      const employee = await EmployeeService.createEmployee(req.body);
      return successResponse(res, 'Employee created successfully', { employee }, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateEmployee(req, res, next) {
    try {
      const employee = await EmployeeService.updateEmployee(req.params.id, req.body);
      return successResponse(res, 'Employee updated successfully', { employee }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async deleteEmployee(req, res, next) {
    try {
      const result = await EmployeeService.deleteEmployee(req.params.id);
      return successResponse(res, result.message, { employeeId: result.employeeId }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req, res, next) {
    try {
      const employee = await EmployeeService.updateStatus(req.params.id, req.body.status);
      return successResponse(res, `Employee status updated to ${req.body.status}`, { employee }, 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = EmployeeController;
