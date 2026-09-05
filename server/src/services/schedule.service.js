const WorkingSchedule = require('../models/WorkingSchedule');
const { AppError } = require('../utils/response.util');

class ScheduleService {
  /**
   * Calculate daily workHours and aggregate weeklyHours from schedule lines
   * Formula: workHours = (endTimeMinutes - startTimeMinutes - breakMinutes) / 60
   */
  static processScheduleLines(lines) {
    if (!Array.isArray(lines) || lines.length === 0) {
      throw new AppError('Schedule must contain at least one daily schedule line', 422, 'VALIDATION_ERROR');
    }

    let totalWeeklyHours = 0;

    const processedLines = lines.map((line, index) => {
      if (line.dayOfWeek === undefined || line.dayOfWeek < 0 || line.dayOfWeek > 6) {
        throw new AppError(`Line at index ${index} has invalid dayOfWeek (must be 0-6)`, 422, 'VALIDATION_ERROR');
      }

      if (!line.startTime || !line.endTime) {
        throw new AppError(`Line for day ${line.dayOfWeek} must have startTime and endTime`, 422, 'VALIDATION_ERROR');
      }

      const [startH, startM] = line.startTime.split(':').map(Number);
      const [endH, endM] = line.endTime.split(':').map(Number);

      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      if (endMinutes <= startMinutes) {
        throw new AppError(
          `Line for day ${line.dayOfWeek}: endTime (${line.endTime}) must be after startTime (${line.startTime})`,
          422,
          'VALIDATION_ERROR'
        );
      }

      const breakMinutes = parseInt(line.breakMinutes, 10) || 0;
      const netMinutes = endMinutes - startMinutes - breakMinutes;

      if (netMinutes < 0) {
        throw new AppError(
          `Line for day ${line.dayOfWeek}: breakMinutes (${breakMinutes}) exceeds shift duration`,
          422,
          'VALIDATION_ERROR'
        );
      }

      const workHours = Number((netMinutes / 60).toFixed(2));
      totalWeeklyHours += workHours;

      return {
        dayOfWeek: line.dayOfWeek,
        startTime: line.startTime,
        endTime: line.endTime,
        breakMinutes,
        workHours
      };
    });

    return {
      lines: processedLines,
      weeklyHours: Number(totalWeeklyHours.toFixed(2))
    };
  }

  /**
   * Create a new working schedule
   */
  static async createSchedule(data) {
    const existing = await WorkingSchedule.findOne({ name: data.name.trim() });
    if (existing) {
      throw new AppError(`Working schedule with name '${data.name}' already exists`, 409, 'CONFLICT', { name: data.name });
    }

    // Strictly compute weeklyHours from lines rather than trusting user input
    const { lines, weeklyHours } = ScheduleService.processScheduleLines(data.lines);

    const schedule = await WorkingSchedule.create({
      name: data.name.trim(),
      lines,
      weeklyHours,
      isActive: data.isActive !== undefined ? data.isActive : true
    });

    return schedule;
  }

  /**
   * List working schedules
   */
  static async getAllSchedules(query = {}) {
    const { isActive } = query;
    const filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    return WorkingSchedule.find(filter).sort({ name: 1 });
  }

  /**
   * Get working schedule by ID
   */
  static async getScheduleById(id) {
    const schedule = await WorkingSchedule.findById(id);
    if (!schedule) {
      throw new AppError('Working schedule not found', 404, 'SCHEDULE_NOT_FOUND');
    }
    return schedule;
  }

  /**
   * Update working schedule
   */
  static async updateSchedule(id, data) {
    const schedule = await WorkingSchedule.findById(id);
    if (!schedule) {
      throw new AppError('Working schedule not found', 404, 'SCHEDULE_NOT_FOUND');
    }

    if (data.name && data.name.trim() !== schedule.name) {
      const existing = await WorkingSchedule.findOne({ name: data.name.trim() });
      if (existing) {
        throw new AppError(`Working schedule with name '${data.name}' already exists`, 409, 'CONFLICT');
      }
      schedule.name = data.name.trim();
    }

    if (data.lines) {
      const { lines, weeklyHours } = ScheduleService.processScheduleLines(data.lines);
      schedule.lines = lines;
      schedule.weeklyHours = weeklyHours;
    }

    if (data.isActive !== undefined) {
      schedule.isActive = data.isActive;
    }

    await schedule.save();
    return schedule;
  }

  /**
   * Delete working schedule
   */
  static async deleteSchedule(id) {
    const schedule = await WorkingSchedule.findById(id);
    if (!schedule) {
      throw new AppError('Working schedule not found', 404, 'SCHEDULE_NOT_FOUND');
    }

    await WorkingSchedule.findByIdAndDelete(id);
    return { message: 'Working schedule deleted successfully', scheduleId: id };
  }
}

module.exports = ScheduleService;
