const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const WorkingSchedule = require('../models/WorkingSchedule');
const { AppError } = require('../utils/response.util');

class AttendanceService {
  /**
   * Normalize a Date to midnight UTC for calendar date matching
   */
  static normalizeDate(dateInput = new Date()) {
    const d = new Date(dateInput);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }

  /**
   * Determine scheduled minutes and start time for an employee on a given date
   */
  static async getScheduledInfo(employeeId, date) {
    const employee = await Employee.findById(employeeId).populate('workingScheduleId');
    if (!employee || !employee.workingScheduleId) {
      return { scheduledMinutes: 480, startTime: '09:00', endTime: '18:00' };
    }

    const schedule = employee.workingScheduleId;
    const dayOfWeek = new Date(date).getDay(); // 0 = Sunday, 1 = Monday, etc.
    const line = (schedule.lines || []).find((l) => l.dayOfWeek === dayOfWeek);

    if (line) {
      const scheduledMinutes = Math.round((line.workHours || 8) * 60);
      return { scheduledMinutes, startTime: line.startTime, endTime: line.endTime };
    }

    return { scheduledMinutes: 480, startTime: '09:00', endTime: '18:00' };
  }

  /**
   * Employee Check-In
   */
  static async checkIn(employeeId, checkInTime = new Date()) {
    const today = AttendanceService.normalizeDate(checkInTime);

    let attendance = await Attendance.findOne({ employeeId, date: today });

    if (attendance && attendance.checkIn) {
      throw new AppError(
        'Employee has already checked in for today',
        409,
        'ALREADY_CHECKED_IN',
        { checkInTime: attendance.checkIn }
      );
    }

    const { scheduledMinutes, startTime } = await AttendanceService.getScheduledInfo(employeeId, today);

    // Late detection: compare checkIn time with scheduled startTime (with 15-min grace period)
    const checkInDate = new Date(checkInTime);
    const [schedH, schedM] = startTime.split(':').map(Number);
    const scheduledStart = new Date(checkInDate);
    scheduledStart.setHours(schedH, schedM, 0, 0);

    const diffMinutes = Math.round((checkInDate.getTime() - scheduledStart.getTime()) / (1000 * 60));
    const isLate = diffMinutes > 15;
    const lateMinutes = isLate ? diffMinutes : 0;

    if (!attendance) {
      attendance = new Attendance({
        employeeId,
        date: today,
        checkIn: checkInDate,
        scheduledMinutes,
        isLate,
        lateMinutes,
        status: 'PRESENT'
      });
    } else {
      attendance.checkIn = checkInDate;
      attendance.scheduledMinutes = scheduledMinutes;
      attendance.isLate = isLate;
      attendance.lateMinutes = lateMinutes;
      attendance.status = 'PRESENT';
    }

    await attendance.save();
    return attendance;
  }

  /**
   * Employee Check-Out
   */
  static async checkOut(employeeId, checkOutTime = new Date()) {
    const today = AttendanceService.normalizeDate(checkOutTime);

    // Look for active check-in record for today
    let attendance = await Attendance.findOne({ employeeId, date: today });

    // Fallback: search for any recent pending check-in without checkOut
    if (!attendance || !attendance.checkIn) {
      attendance = await Attendance.findOne({
        employeeId,
        checkIn: { $ne: null },
        checkOut: null
      }).sort({ date: -1 });
    }

    if (!attendance || !attendance.checkIn) {
      throw new AppError('No active check-in record found. Please check in first.', 400, 'CHECKIN_REQUIRED');
    }

    if (attendance.checkOut) {
      throw new AppError('Employee has already checked out for this record', 409, 'ALREADY_CHECKED_OUT');
    }

    const checkOutDate = new Date(checkOutTime);
    if (checkOutDate < new Date(attendance.checkIn)) {
      throw new AppError(
        'Check-out time cannot be earlier than check-in time',
        422,
        'VALIDATION_ERROR',
        { checkIn: attendance.checkIn, checkOut: checkOutDate }
      );
    }

    const checkInMs = new Date(attendance.checkIn).getTime();
    const workedMinutes = Math.round((checkOutDate.getTime() - checkInMs) / (1000 * 60));
    const scheduledMinutes = attendance.scheduledMinutes || 480;
    const overtimeMinutes = Math.max(0, workedMinutes - scheduledMinutes);

    // Status calculation based on worked duration
    let status = 'PRESENT';
    if (workedMinutes < scheduledMinutes * 0.4) {
      status = 'ABSENT';
    } else if (workedMinutes < scheduledMinutes * 0.8) {
      status = 'HALF_DAY';
    }

    attendance.checkOut = checkOutDate;
    attendance.workedMinutes = workedMinutes;
    attendance.overtimeMinutes = overtimeMinutes;
    attendance.status = status;
    attendance.isMissingCheckout = false;

    await attendance.save();
    return attendance;
  }

  /**
   * Get attendance records with filters & pagination
   */
  static async getAllAttendance(query = {}, user) {
    const { employeeId, startDate, endDate, status, isLate, isMissingCheckout, page = 1, limit = 20 } = query;
    const filter = {};

    // Role restriction: Employees only view their own records
    if (user.role === 'EMPLOYEE') {
      filter.employeeId = user.employeeId;
    } else if (employeeId) {
      filter.employeeId = employeeId;
    }

    if (status) filter.status = status;
    if (isLate !== undefined) filter.isLate = isLate === 'true';
    if (isMissingCheckout !== undefined) filter.isMissingCheckout = isMissingCheckout === 'true';

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = AttendanceService.normalizeDate(startDate);
      if (endDate) filter.date.$lte = AttendanceService.normalizeDate(endDate);
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [records, total] = await Promise.all([
      Attendance.find(filter)
        .populate('employeeId', 'employeeCode firstName lastName email department')
        .populate('manualCorrection.correctedBy', 'email role')
        .sort({ date: -1, checkIn: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Attendance.countDocuments(filter)
    ]);

    return {
      attendance: records,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10))
      }
    };
  }

  /**
   * Get attendance by ID
   */
  static async getAttendanceById(id, user) {
    const attendance = await Attendance.findById(id)
      .populate('employeeId')
      .populate('manualCorrection.correctedBy', 'email role');

    if (!attendance) {
      throw new AppError('Attendance record not found', 404, 'ATTENDANCE_NOT_FOUND');
    }

    if (user.role === 'EMPLOYEE' && attendance.employeeId._id.toString() !== user.employeeId?.toString()) {
      throw new AppError('You are not authorized to view this attendance record', 403, 'FORBIDDEN');
    }

    return attendance;
  }

  /**
   * Admin/HR Manual Attendance Creation
   */
  static async createManualAttendance(data, user) {
    const recordDate = AttendanceService.normalizeDate(data.date);

    const existing = await Attendance.findOne({ employeeId: data.employeeId, date: recordDate });
    if (existing) {
      throw new AppError('An attendance record already exists for this employee on this date', 409, 'CONFLICT');
    }

    const { scheduledMinutes } = await AttendanceService.getScheduledInfo(data.employeeId, recordDate);

    let workedMinutes = data.workedMinutes || 0;
    let overtimeMinutes = 0;

    if (data.checkIn && data.checkOut) {
      const cIn = new Date(data.checkIn);
      const cOut = new Date(data.checkOut);
      if (cOut < cIn) {
        throw new AppError('checkOut cannot be earlier than checkIn', 422, 'VALIDATION_ERROR');
      }
      workedMinutes = Math.round((cOut.getTime() - cIn.getTime()) / (1000 * 60));
      overtimeMinutes = Math.max(0, workedMinutes - scheduledMinutes);
    }

    const attendance = await Attendance.create({
      employeeId: data.employeeId,
      date: recordDate,
      checkIn: data.checkIn || null,
      checkOut: data.checkOut || null,
      workedMinutes,
      scheduledMinutes: data.scheduledMinutes || scheduledMinutes,
      overtimeMinutes,
      status: data.status || (workedMinutes >= scheduledMinutes * 0.8 ? 'PRESENT' : 'HALF_DAY'),
      correctedBy: user._id,
      correctedAt: new Date(),
      correctionReason: data.correctionReason || 'Manual Admin Creation',
      manualCorrection: {
        isManuallyCorrected: true,
        correctedBy: user._id,
        correctedAt: new Date(),
        correctionReason: data.correctionReason || 'Manual Admin Creation'
      }
    });

    return attendance.populate('employeeId', 'employeeCode firstName lastName email department');
  }

  /**
   * Admin/HR Manual Attendance Correction / Update
   */
  static async updateAttendance(id, data, user) {
    const attendance = await Attendance.findById(id);
    if (!attendance) {
      throw new AppError('Attendance record not found', 404, 'ATTENDANCE_NOT_FOUND');
    }

    if (!data.correctionReason || !data.correctionReason.trim()) {
      throw new AppError('A valid correctionReason is required for manual attendance adjustments', 422, 'VALIDATION_ERROR');
    }

    const originalCheckIn = attendance.checkIn;
    const originalCheckOut = attendance.checkOut;

    if (data.checkIn) attendance.checkIn = new Date(data.checkIn);
    if (data.checkOut !== undefined) attendance.checkOut = data.checkOut ? new Date(data.checkOut) : null;
    if (data.status) attendance.status = data.status;

    if (attendance.checkIn && attendance.checkOut) {
      if (new Date(attendance.checkOut) < new Date(attendance.checkIn)) {
        throw new AppError('checkOut cannot be earlier than checkIn', 422, 'VALIDATION_ERROR');
      }
      attendance.workedMinutes = Math.round((new Date(attendance.checkOut).getTime() - new Date(attendance.checkIn).getTime()) / (1000 * 60));
      attendance.overtimeMinutes = Math.max(0, attendance.workedMinutes - (attendance.scheduledMinutes || 480));
      attendance.isMissingCheckout = false;
    }

    const now = new Date();
    attendance.correctedBy = user._id;
    attendance.correctedAt = now;
    attendance.correctionReason = data.correctionReason.trim();
    attendance.manualCorrection = {
      isManuallyCorrected: true,
      correctedBy: user._id,
      correctedAt: now,
      correctionReason: data.correctionReason.trim(),
      originalCheckIn,
      originalCheckOut
    };

    await attendance.save();
    return attendance.populate([
      { path: 'employeeId', select: 'employeeCode firstName lastName email department' },
      { path: 'correctedBy', select: 'email role' },
      { path: 'manualCorrection.correctedBy', select: 'email role' }
    ]);
  }

  /**
   * Detect and mark past records where checkout is missing
   */
  static async detectMissingCheckouts() {
    const today = AttendanceService.normalizeDate(new Date());

    const result = await Attendance.updateMany(
      {
        date: { $lt: today },
        checkIn: { $ne: null },
        checkOut: null,
        isMissingCheckout: false
      },
      {
        $set: { isMissingCheckout: true, status: 'HALF_DAY' }
      }
    );

    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Get attendance for an employee
   */
  static async getEmployeeAttendance(employeeId, query = {}, user) {
    if (user.role === 'EMPLOYEE' && employeeId.toString() !== user.employeeId?.toString()) {
      throw new AppError('You are not authorized to view another employee\'s attendance', 403, 'FORBIDDEN');
    }

    return AttendanceService.getAllAttendance({ ...query, employeeId }, user);
  }
}

module.exports = AttendanceService;
