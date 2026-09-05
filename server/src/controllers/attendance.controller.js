const AttendanceService = require('../services/attendance.service');
const { successResponse } = require('../utils/response.util');

class AttendanceController {
  static async checkIn(req, res, next) {
    try {
      const employeeId = req.user.role === 'EMPLOYEE' ? req.user.employeeId : (req.body.employeeId || req.user.employeeId);
      const attendance = await AttendanceService.checkIn(employeeId, req.body.checkInTime);
      return successResponse(res, 'Checked in successfully', { attendance }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async checkOut(req, res, next) {
    try {
      const employeeId = req.user.role === 'EMPLOYEE' ? req.user.employeeId : (req.body.employeeId || req.user.employeeId);
      const attendance = await AttendanceService.checkOut(employeeId, req.body.checkOutTime);
      return successResponse(res, 'Checked out successfully', { attendance }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getAllAttendance(req, res, next) {
    try {
      const result = await AttendanceService.getAllAttendance(req.query, req.user);
      return successResponse(res, 'Attendance records retrieved', result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getAttendanceById(req, res, next) {
    try {
      const attendance = await AttendanceService.getAttendanceById(req.params.id, req.user);
      return successResponse(res, 'Attendance record retrieved', { attendance }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async createAttendance(req, res, next) {
    try {
      const attendance = await AttendanceService.createManualAttendance(req.body, req.user);
      return successResponse(res, 'Manual attendance record created', { attendance }, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateAttendance(req, res, next) {
    try {
      const attendance = await AttendanceService.updateAttendance(req.params.id, req.body, req.user);
      return successResponse(res, 'Attendance record updated with correction log', { attendance }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getEmployeeAttendance(req, res, next) {
    try {
      const result = await AttendanceService.getEmployeeAttendance(req.params.employeeId, req.query, req.user);
      return successResponse(res, 'Employee attendance history retrieved', result, 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AttendanceController;
