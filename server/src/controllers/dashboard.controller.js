const DashboardService = require('../services/dashboard.service');
const { successResponse } = require('../utils/response.util');

class DashboardController {
  /**
   * GET /api/v1/dashboard
   * Optional query filters: periodStart, periodEnd, department, employeeType
   */
  static async getDashboard(req, res, next) {
    try {
      const data = await DashboardService.getDashboardData(req.query, req.user);
      return successResponse(res, 'Dashboard metrics retrieved successfully', data, 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DashboardController;
