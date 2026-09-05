const TimeOffService = require('../services/timeOff.service');
const { successResponse } = require('../utils/response.util');

class TimeOffController {
  // ==========================================
  // TIME OFF TYPES
  // ==========================================

  static async createType(req, res, next) {
    try {
      const type = await TimeOffService.createType(req.body);
      return successResponse(res, 'Time off type created successfully', { type }, 201);
    } catch (error) {
      next(error);
    }
  }

  static async getAllTypes(req, res, next) {
    try {
      const types = await TimeOffService.getAllTypes();
      return successResponse(res, 'Time off types retrieved', { types }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getTypeById(req, res, next) {
    try {
      const type = await TimeOffService.getTypeById(req.params.id);
      return successResponse(res, 'Time off type retrieved', { type }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async updateType(req, res, next) {
    try {
      const type = await TimeOffService.updateType(req.params.id, req.body);
      return successResponse(res, 'Time off type updated successfully', { type }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async deleteType(req, res, next) {
    try {
      const result = await TimeOffService.deleteType(req.params.id);
      return successResponse(res, result.message, { typeId: result.typeId }, 200);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // LEAVE ALLOCATIONS
  // ==========================================

  static async createAllocation(req, res, next) {
    try {
      const allocation = await TimeOffService.createAllocation(req.body);
      return successResponse(res, 'Leave allocation created successfully', { allocation }, 201);
    } catch (error) {
      next(error);
    }
  }

  static async getAllocations(req, res, next) {
    try {
      const result = await TimeOffService.getAllocations(req.query, req.user);
      return successResponse(res, 'Leave allocations retrieved', result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getAllocationById(req, res, next) {
    try {
      const allocation = await TimeOffService.getAllocationById(req.params.id, req.user);
      return successResponse(res, 'Leave allocation retrieved', { allocation }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async updateAllocation(req, res, next) {
    try {
      const allocation = await TimeOffService.updateAllocation(req.params.id, req.body);
      return successResponse(res, 'Leave allocation updated successfully', { allocation }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async approveAllocation(req, res, next) {
    try {
      const allocation = await TimeOffService.approveAllocation(req.params.id);
      return successResponse(res, 'Leave allocation approved', { allocation }, 200);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // LEAVE REQUESTS
  // ==========================================

  static async createLeaveRequest(req, res, next) {
    try {
      const request = await TimeOffService.createLeaveRequest(req.body, req.user);
      return successResponse(res, 'Leave request submitted successfully', { request }, 201);
    } catch (error) {
      next(error);
    }
  }

  static async getLeaveRequests(req, res, next) {
    try {
      const result = await TimeOffService.getLeaveRequests(req.query, req.user);
      return successResponse(res, 'Leave requests retrieved', result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getLeaveRequestById(req, res, next) {
    try {
      const request = await TimeOffService.getLeaveRequestById(req.params.id, req.user);
      return successResponse(res, 'Leave request retrieved', { request }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async updateLeaveRequest(req, res, next) {
    try {
      const request = await TimeOffService.updateLeaveRequest(req.params.id, req.body, req.user);
      return successResponse(res, 'Leave request updated successfully', { request }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async approveLeaveRequest(req, res, next) {
    try {
      const request = await TimeOffService.approveLeaveRequest(req.params.id, req.user);
      return successResponse(res, 'Leave request approved and balance deducted', { request }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async refuseLeaveRequest(req, res, next) {
    try {
      const request = await TimeOffService.refuseLeaveRequest(req.params.id, req.user, req.body.reason);
      return successResponse(res, 'Leave request refused', { request }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async cancelLeaveRequest(req, res, next) {
    try {
      const request = await TimeOffService.cancelLeaveRequest(req.params.id, req.user);
      return successResponse(res, 'Leave request cancelled successfully', { request }, 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = TimeOffController;
