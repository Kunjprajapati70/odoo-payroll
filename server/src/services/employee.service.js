const Employee = require('../models/Employee');
const { AppError } = require('../utils/response.util');

class EmployeeService {
  /**
   * Create a new employee
   */
  static async createEmployee(data) {
    const existing = await Employee.findOne({
      $or: [
        { employeeCode: data.employeeCode.toUpperCase() },
        { email: data.email.toLowerCase() }
      ]
    });

    if (existing) {
      const field = existing.employeeCode === data.employeeCode.toUpperCase() ? 'employeeCode' : 'email';
      throw new AppError(
        `An employee with this ${field} already exists`,
        409,
        'CONFLICT',
        { field, value: field === 'employeeCode' ? data.employeeCode : data.email }
      );
    }

    const employee = await Employee.create({
      ...data,
      employeeCode: data.employeeCode.toUpperCase(),
      email: data.email.toLowerCase()
    });

    return employee;
  }

  /**
   * List employees with filtering and pagination
   */
  static async getAllEmployees(query = {}) {
    const { search, department, employeeType, status, page = 1, limit = 20 } = query;
    const filter = {};

    if (department) filter.department = department;
    if (employeeType) filter.employeeType = employeeType;
    if (status) filter.status = status;

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { employeeCode: searchRegex },
        { email: searchRegex },
        { jobPosition: searchRegex }
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [employees, total] = await Promise.all([
      Employee.find(filter)
        .populate('managerId', 'employeeCode firstName lastName email department jobPosition')
        .populate('workingScheduleId', 'name weeklyHours')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Employee.countDocuments(filter)
    ]);

    return {
      employees,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10))
      }
    };
  }

  /**
   * Get single employee by ID
   */
  static async getEmployeeById(id) {
    const employee = await Employee.findById(id)
      .populate('managerId', 'employeeCode firstName lastName email department jobPosition')
      .populate('workingScheduleId');

    if (!employee) {
      throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
    }
    return employee;
  }

  /**
   * Update employee
   */
  static async updateEmployee(id, data) {
    const employee = await Employee.findById(id);
    if (!employee) {
      throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
    }

    // Check unique employeeCode
    if (data.employeeCode && data.employeeCode.toUpperCase() !== employee.employeeCode) {
      const existingCode = await Employee.findOne({ employeeCode: data.employeeCode.toUpperCase() });
      if (existingCode) {
        throw new AppError('Employee code already taken', 409, 'CONFLICT', { field: 'employeeCode' });
      }
      data.employeeCode = data.employeeCode.toUpperCase();
    }

    // Check unique email
    if (data.email && data.email.toLowerCase() !== employee.email) {
      const existingEmail = await Employee.findOne({ email: data.email.toLowerCase() });
      if (existingEmail) {
        throw new AppError('Email address already taken', 409, 'CONFLICT', { field: 'email' });
      }
      data.email = data.email.toLowerCase();
    }

    Object.assign(employee, data);
    await employee.save();

    return employee.populate([
      { path: 'managerId', select: 'employeeCode firstName lastName email department' },
      { path: 'workingScheduleId', select: 'name weeklyHours' }
    ]);
  }

  /**
   * Delete employee
   */
  static async deleteEmployee(id) {
    const employee = await Employee.findById(id);
    if (!employee) {
      throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
    }

    await Employee.findByIdAndDelete(id);
    return { message: 'Employee deleted successfully', employeeId: id };
  }

  /**
   * Update employee status (ACTIVE, INACTIVE, TERMINATED, ON_LEAVE)
   */
  static async updateStatus(id, status) {
    const validStatuses = ['ACTIVE', 'INACTIVE', 'TERMINATED', 'ON_LEAVE'];
    if (!validStatuses.includes(status)) {
      throw new AppError(
        `Invalid employee status: '${status}'. Allowed: ${validStatuses.join(', ')}`,
        422,
        'VALIDATION_ERROR',
        { status, validStatuses }
      );
    }

    const employee = await Employee.findById(id);
    if (!employee) {
      throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
    }

    employee.status = status;
    await employee.save();

    return employee;
  }
}

module.exports = EmployeeService;
