const TimeOffType = require('../models/TimeOffType');
const LeaveAllocation = require('../models/LeaveAllocation');
const LeaveRequest = require('../models/LeaveRequest');
const Employee = require('../models/Employee');
const { AppError } = require('../utils/response.util');

class TimeOffService {
  // ==========================================
  // TIME OFF TYPES
  // ==========================================

  static async createType(data) {
    const existing = await TimeOffType.findOne({ name: data.name.trim() });
    if (existing) {
      throw new AppError(`Time off type '${data.name}' already exists`, 409, 'CONFLICT');
    }

    return TimeOffType.create({
      name: data.name.trim(),
      code: data.code ? data.code.trim().toUpperCase() : undefined,
      unit: data.unit || 'DAYS',
      requiresAllocation: data.requiresAllocation !== undefined ? data.requiresAllocation : true,
      approvalRequired: data.approvalRequired !== undefined ? data.approvalRequired : true,
      payrollIntegration: data.payrollIntegration || 'PAID',
      isActive: data.isActive !== undefined ? data.isActive : true
    });
  }

  static async getAllTypes() {
    return TimeOffType.find().sort({ name: 1 });
  }

  static async getTypeById(id) {
    const type = await TimeOffType.findById(id);
    if (!type) throw new AppError('Time off type not found', 404, 'TIME_OFF_TYPE_NOT_FOUND');
    return type;
  }

  static async updateType(id, data) {
    const type = await TimeOffType.findById(id);
    if (!type) throw new AppError('Time off type not found', 404, 'TIME_OFF_TYPE_NOT_FOUND');

    if (data.name && data.name.trim() !== type.name) {
      const existing = await TimeOffType.findOne({ name: data.name.trim() });
      if (existing) throw new AppError(`Time off type '${data.name}' already exists`, 409, 'CONFLICT');
      type.name = data.name.trim();
    }

    Object.assign(type, data);
    await type.save();
    return type;
  }

  static async deleteType(id) {
    const type = await TimeOffType.findById(id);
    if (!type) throw new AppError('Time off type not found', 404, 'TIME_OFF_TYPE_NOT_FOUND');
    await TimeOffType.findByIdAndDelete(id);
    return { message: 'Time off type deleted successfully', typeId: id };
  }

  // ==========================================
  // LEAVE ALLOCATIONS
  // ==========================================

  static async createAllocation(data) {
    const employee = await Employee.findById(data.employeeId);
    if (!employee) throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');

    const type = await TimeOffType.findById(data.timeOffTypeId);
    if (!type) throw new AppError('Time off type not found', 404, 'TIME_OFF_TYPE_NOT_FOUND');

    const validFrom = data.validFrom || data.effectiveFrom || new Date();
    const validTo = data.validTo || data.effectiveTo || new Date(new Date().getFullYear(), 11, 31);

    if (new Date(validTo) < new Date(validFrom)) {
      throw new AppError('validTo cannot be earlier than validFrom', 422, 'VALIDATION_ERROR');
    }

    const allocated = Number(data.allocated);
    if (isNaN(allocated) || allocated <= 0) {
      throw new AppError('allocated days/hours must be a positive number', 422, 'VALIDATION_ERROR');
    }

    const allocation = await LeaveAllocation.create({
      employeeId: data.employeeId,
      timeOffTypeId: data.timeOffTypeId,
      allocated,
      used: 0,
      remaining: allocated,
      validFrom: new Date(validFrom),
      validTo: new Date(validTo),
      status: data.status || 'APPROVED'
    });

    return allocation.populate([
      { path: 'employeeId', select: 'employeeCode firstName lastName email department' },
      { path: 'timeOffTypeId', select: 'name unit payrollIntegration' }
    ]);
  }

  static async getAllocations(query = {}, user) {
    const { employeeId, timeOffTypeId, status, page = 1, limit = 20 } = query;
    const filter = {};

    if (user.role === 'EMPLOYEE') {
      filter.employeeId = user.employeeId;
    } else if (employeeId) {
      filter.employeeId = employeeId;
    }

    if (timeOffTypeId) filter.timeOffTypeId = timeOffTypeId;
    if (status) filter.status = status;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [allocations, total] = await Promise.all([
      LeaveAllocation.find(filter)
        .populate('employeeId', 'employeeCode firstName lastName email department')
        .populate('timeOffTypeId', 'name unit payrollIntegration')
        .sort({ validFrom: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      LeaveAllocation.countDocuments(filter)
    ]);

    return {
      allocations,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10))
      }
    };
  }

  static async getAllocationById(id, user) {
    const allocation = await LeaveAllocation.findById(id)
      .populate('employeeId')
      .populate('timeOffTypeId');

    if (!allocation) throw new AppError('Leave allocation not found', 404, 'ALLOCATION_NOT_FOUND');

    if (user.role === 'EMPLOYEE' && allocation.employeeId._id.toString() !== user.employeeId?.toString()) {
      throw new AppError('You are not authorized to view this allocation', 403, 'FORBIDDEN');
    }

    return allocation;
  }

  static async updateAllocation(id, data) {
    const allocation = await LeaveAllocation.findById(id);
    if (!allocation) throw new AppError('Leave allocation not found', 404, 'ALLOCATION_NOT_FOUND');

    if (data.allocated !== undefined) {
      const newAllocated = Number(data.allocated);
      if (newAllocated < allocation.used) {
        throw new AppError(
          `Allocated units (${newAllocated}) cannot be less than already used units (${allocation.used})`,
          422,
          'VALIDATION_ERROR'
        );
      }
      allocation.allocated = newAllocated;
      allocation.remaining = newAllocated - allocation.used;
    }

    if (data.validFrom) allocation.validFrom = new Date(data.validFrom);
    if (data.validTo) allocation.validTo = new Date(data.validTo);
    if (data.status) allocation.status = data.status;

    await allocation.save();
    return allocation.populate([
      { path: 'employeeId', select: 'employeeCode firstName lastName email department' },
      { path: 'timeOffTypeId', select: 'name unit' }
    ]);
  }

  static async approveAllocation(id) {
    const allocation = await LeaveAllocation.findById(id);
    if (!allocation) throw new AppError('Leave allocation not found', 404, 'ALLOCATION_NOT_FOUND');

    allocation.status = 'APPROVED';
    await allocation.save();
    return allocation;
  }

  // ==========================================
  // LEAVE REQUESTS
  // ==========================================

  /**
   * Helper to verify if dates overlap
   */
  static datesOverlap(start1, end1, start2, end2) {
    const s1 = new Date(start1).getTime();
    const e1 = new Date(end1).getTime();
    const s2 = new Date(start2).getTime();
    const e2 = new Date(end2).getTime();
    return s1 <= e2 && s2 <= e1;
  }

  /**
   * Create a new leave request
   */
  static async createLeaveRequest(data, user) {
    const employeeId = user.role === 'EMPLOYEE' ? user.employeeId : data.employeeId;
    if (!employeeId) {
      throw new AppError('Employee ID is required', 422, 'VALIDATION_ERROR');
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');

    const type = await TimeOffType.findById(data.timeOffTypeId);
    if (!type) throw new AppError('Time off type not found', 404, 'TIME_OFF_TYPE_NOT_FOUND');

    const sDate = new Date(data.startDate);
    const eDate = new Date(data.endDate);

    if (isNaN(sDate.getTime()) || isNaN(eDate.getTime())) {
      throw new AppError('Invalid startDate or endDate format', 422, 'VALIDATION_ERROR');
    }

    if (eDate < sDate) {
      throw new AppError('endDate cannot be earlier than startDate', 422, 'VALIDATION_ERROR');
    }

    const duration = Number(data.duration);
    if (isNaN(duration) || duration <= 0) {
      throw new AppError('duration must be a positive number', 422, 'VALIDATION_ERROR');
    }

    // 1. Prevent overlapping leave requests
    const overlappingRequests = await LeaveRequest.find({
      employeeId,
      status: { $in: ['PENDING', 'APPROVED'] },
      startDate: { $lte: eDate },
      endDate: { $gte: sDate }
    });

    if (overlappingRequests.length > 0) {
      throw new AppError(
        'Employee already has a pending or approved leave request overlapping these dates',
        409,
        'LEAVE_OVERLAP',
        {
          conflictingRequestId: overlappingRequests[0]._id,
          existingStart: overlappingRequests[0].startDate,
          existingEnd: overlappingRequests[0].endDate
        }
      );
    }

    // 2. Leave Balance Validation
    let allocationId = null;
    if (type.requiresAllocation) {
      const activeAllocation = await LeaveAllocation.findOne({
        employeeId,
        timeOffTypeId: type._id,
        status: 'APPROVED',
        validFrom: { $lte: sDate },
        validTo: { $gte: eDate }
      });

      if (!activeAllocation) {
        throw new AppError(
          `No approved leave allocation found for type '${type.name}' covering the requested period`,
          422,
          'NO_ALLOCATION'
        );
      }

      if (activeAllocation.remaining < duration) {
        throw new AppError(
          `Insufficient leave balance. Available: ${activeAllocation.remaining} ${type.unit}, Requested: ${duration} ${type.unit}`,
          422,
          'INSUFFICIENT_BALANCE',
          { available: activeAllocation.remaining, requested: duration }
        );
      }

      allocationId = activeAllocation._id;
    }

    const request = await LeaveRequest.create({
      employeeId,
      timeOffTypeId: type._id,
      allocationId,
      startDate: sDate,
      endDate: eDate,
      duration,
      reason: data.reason || '',
      status: 'PENDING'
    });

    return request.populate([
      { path: 'employeeId', select: 'employeeCode firstName lastName email department' },
      { path: 'timeOffTypeId', select: 'name unit payrollIntegration' }
    ]);
  }

  /**
   * Get leave requests with filters
   */
  static async getLeaveRequests(query = {}, user) {
    const { employeeId, timeOffTypeId, status, startDate, endDate, page = 1, limit = 20 } = query;
    const filter = {};

    if (user.role === 'EMPLOYEE') {
      filter.employeeId = user.employeeId;
    } else if (employeeId) {
      filter.employeeId = employeeId;
    }

    if (timeOffTypeId) filter.timeOffTypeId = timeOffTypeId;
    if (status) filter.status = status;

    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) filter.startDate.$gte = new Date(startDate);
      if (endDate) filter.startDate.$lte = new Date(endDate);
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [requests, total] = await Promise.all([
      LeaveRequest.find(filter)
        .populate('employeeId', 'employeeCode firstName lastName email department')
        .populate('timeOffTypeId', 'name unit payrollIntegration')
        .populate('approvedBy', 'email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      LeaveRequest.countDocuments(filter)
    ]);

    return {
      leaveRequests: requests,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10))
      }
    };
  }

  /**
   * Get leave request by ID
   */
  static async getLeaveRequestById(id, user) {
    const request = await LeaveRequest.findById(id)
      .populate('employeeId')
      .populate('timeOffTypeId')
      .populate('approvedBy', 'email role');

    if (!request) throw new AppError('Leave request not found', 404, 'REQUEST_NOT_FOUND');

    if (user.role === 'EMPLOYEE' && request.employeeId._id.toString() !== user.employeeId?.toString()) {
      throw new AppError('You are not authorized to view this leave request', 403, 'FORBIDDEN');
    }

    return request;
  }

  /**
   * Update leave request (only while in PENDING status)
   */
  static async updateLeaveRequest(id, data, user) {
    const request = await LeaveRequest.findById(id);
    if (!request) throw new AppError('Leave request not found', 404, 'REQUEST_NOT_FOUND');

    if (request.status !== 'PENDING') {
      throw new AppError(`Cannot update a leave request in status '${request.status}'`, 400, 'INVALID_STATUS');
    }

    if (user.role === 'EMPLOYEE' && request.employeeId.toString() !== user.employeeId?.toString()) {
      throw new AppError('You are not authorized to update this request', 403, 'FORBIDDEN');
    }

    if (data.reason !== undefined) request.reason = data.reason;
    if (data.duration !== undefined) request.duration = Number(data.duration);
    if (data.startDate) request.startDate = new Date(data.startDate);
    if (data.endDate) request.endDate = new Date(data.endDate);

    await request.save();
    return request.populate([
      { path: 'employeeId', select: 'employeeCode firstName lastName email' },
      { path: 'timeOffTypeId', select: 'name unit' }
    ]);
  }

  /**
   * Approve leave request with atomic allocation balance deduction
   */
  static async approveLeaveRequest(id, approverUser) {
    const request = await LeaveRequest.findById(id);
    if (!request) throw new AppError('Leave request not found', 404, 'REQUEST_NOT_FOUND');

    if (request.status !== 'PENDING') {
      throw new AppError(`Cannot approve request in status '${request.status}'`, 400, 'INVALID_STATUS');
    }

    // Atomic balance deduction if linked to allocation
    if (request.allocationId) {
      const updatedAllocation = await LeaveAllocation.findOneAndUpdate(
        {
          _id: request.allocationId,
          remaining: { $gte: request.duration },
          status: 'APPROVED'
        },
        {
          $inc: {
            used: request.duration,
            remaining: -request.duration
          }
        },
        { returnDocument: 'after' }
      );

      if (!updatedAllocation) {
        throw new AppError(
          'Insufficient leave balance remaining on allocation to approve this request',
          422,
          'INSUFFICIENT_BALANCE'
        );
      }
    }

    request.status = 'APPROVED';
    request.approvedBy = approverUser._id;
    request.approvedAt = new Date();
    await request.save();

    return request.populate([
      { path: 'employeeId', select: 'employeeCode firstName lastName email' },
      { path: 'timeOffTypeId', select: 'name unit' },
      { path: 'approvedBy', select: 'email role' }
    ]);
  }

  /**
   * Refuse / Reject leave request
   */
  static async refuseLeaveRequest(id, approverUser, reason = 'Refused by manager') {
    const request = await LeaveRequest.findById(id);
    if (!request) throw new AppError('Leave request not found', 404, 'REQUEST_NOT_FOUND');

    if (request.status !== 'PENDING') {
      throw new AppError(`Cannot refuse request in status '${request.status}'`, 400, 'INVALID_STATUS');
    }

    request.status = 'REJECTED';
    request.approvedBy = approverUser._id;
    request.approvedAt = new Date();
    request.rejectionReason = reason;
    await request.save();

    return request.populate([
      { path: 'employeeId', select: 'employeeCode firstName lastName email' },
      { path: 'timeOffTypeId', select: 'name unit' },
      { path: 'approvedBy', select: 'email role' }
    ]);
  }

  /**
   * Cancel leave request (restores balance if previously approved)
   */
  static async cancelLeaveRequest(id, user) {
    const request = await LeaveRequest.findById(id);
    if (!request) throw new AppError('Leave request not found', 404, 'REQUEST_NOT_FOUND');

    if (user.role === 'EMPLOYEE' && request.employeeId.toString() !== user.employeeId?.toString()) {
      throw new AppError('You are not authorized to cancel this request', 403, 'FORBIDDEN');
    }

    if (['REJECTED', 'CANCELLED'].includes(request.status)) {
      throw new AppError(`Cannot cancel a request that is already ${request.status}`, 400, 'INVALID_STATUS');
    }

    // If was APPROVED with allocation, restore balance atomically
    if (request.status === 'APPROVED' && request.allocationId) {
      await LeaveAllocation.findByIdAndUpdate(request.allocationId, {
        $inc: {
          used: -request.duration,
          remaining: request.duration
        }
      });
    }

    request.status = 'CANCELLED';
    await request.save();

    return request;
  }
}

module.exports = TimeOffService;
