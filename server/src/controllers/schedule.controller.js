const ScheduleService = require('../services/schedule.service');
const { successResponse } = require('../utils/response.util');

class ScheduleController {
  static async getAllSchedules(req, res, next) {
    try {
      const schedules = await ScheduleService.getAllSchedules(req.query);
      return successResponse(res, 'Working schedules retrieved successfully', { schedules }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getScheduleById(req, res, next) {
    try {
      const schedule = await ScheduleService.getScheduleById(req.params.id);
      return successResponse(res, 'Working schedule retrieved', { schedule }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async createSchedule(req, res, next) {
    try {
      const schedule = await ScheduleService.createSchedule(req.body);
      return successResponse(res, 'Working schedule created successfully', { schedule }, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateSchedule(req, res, next) {
    try {
      const schedule = await ScheduleService.updateSchedule(req.params.id, req.body);
      return successResponse(res, 'Working schedule updated successfully', { schedule }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async deleteSchedule(req, res, next) {
    try {
      const result = await ScheduleService.deleteSchedule(req.params.id);
      return successResponse(res, result.message, { scheduleId: result.scheduleId }, 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ScheduleController;
