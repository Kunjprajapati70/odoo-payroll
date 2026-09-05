const Contract = require('../models/Contract');
const Employee = require('../models/Employee');
const SalaryStructure = require('../models/SalaryStructure');
const { AppError } = require('../utils/response.util');

class ContractService {
  /**
   * Helper to check if two date intervals [start1, end1] and [start2, end2] overlap
   */
  static intervalsOverlap(start1, end1, start2, end2) {
    const s1 = new Date(start1).getTime();
    const e1 = end1 ? new Date(end1).getTime() : Infinity;
    const s2 = new Date(start2).getTime();
    const e2 = end2 ? new Date(end2).getTime() : Infinity;

    return s1 <= e2 && s2 <= e1;
  }

  /**
   * Validate date order: endDate must be >= startDate
   */
  static validateDates(startDate, endDate) {
    if (startDate && endDate) {
      if (new Date(endDate) < new Date(startDate)) {
        throw new AppError(
          'Contract end date cannot be earlier than start date',
          422,
          'VALIDATION_ERROR',
          { field: 'endDate', startDate, endDate }
        );
      }
    }
  }

  /**
   * Check for overlapping ACTIVE contracts for an employee
   */
  static async checkOverlappingActiveContracts(employeeId, startDate, endDate, excludeContractId = null) {
    const query = {
      employeeId,
      status: 'ACTIVE'
    };

    if (excludeContractId) {
      query._id = { $ne: excludeContractId };
    }

    const activeContracts = await Contract.find(query);

    for (const existing of activeContracts) {
      if (ContractService.intervalsOverlap(existing.startDate, existing.endDate, startDate, endDate)) {
        throw new AppError(
          `Employee already has an active overlapping contract from ${new Date(existing.startDate).toISOString().split('T')[0]}`,
          409,
          'CONTRACT_OVERLAP',
          {
            conflictingContractId: existing._id,
            existingStart: existing.startDate,
            existingEnd: existing.endDate
          }
        );
      }
    }
  }

  /**
   * Create a new employment contract
   */
  static async createContract(data) {
    const employee = await Employee.findById(data.employeeId);
    if (!employee) {
      throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
    }

    const structure = await SalaryStructure.findById(data.salaryStructureId);
    if (!structure) {
      throw new AppError('Salary structure not found', 404, 'SALARY_STRUCTURE_NOT_FOUND');
    }

    ContractService.validateDates(data.startDate, data.endDate);

    if (data.status === 'ACTIVE') {
      await ContractService.checkOverlappingActiveContracts(data.employeeId, data.startDate, data.endDate);
    }

    const contract = await Contract.create({
      employeeId: data.employeeId,
      startDate: data.startDate,
      endDate: data.endDate || null,
      department: data.department || employee.department,
      jobPosition: data.jobPosition || employee.jobPosition,
      salary: data.salary,
      salaryStructureId: data.salaryStructureId,
      status: data.status || 'DRAFT'
    });

    return contract.populate([
      { path: 'employeeId', select: 'employeeCode firstName lastName email department jobPosition' },
      { path: 'salaryStructureId', select: 'name code description' }
    ]);
  }

  /**
   * List contracts with filtering and pagination
   */
  static async getAllContracts(query = {}) {
    const { employeeId, status, department, page = 1, limit = 20 } = query;
    const filter = {};

    if (employeeId) filter.employeeId = employeeId;
    if (status) filter.status = status;
    if (department) filter.department = department;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [contracts, total] = await Promise.all([
      Contract.find(filter)
        .populate('employeeId', 'employeeCode firstName lastName email department jobPosition')
        .populate('salaryStructureId', 'name code')
        .sort({ startDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Contract.countDocuments(filter)
    ]);

    return {
      contracts,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10))
      }
    };
  }

  /**
   * Get single contract by ID
   */
  static async getContractById(id) {
    const contract = await Contract.findById(id)
      .populate('employeeId')
      .populate('salaryStructureId');

    if (!contract) {
      throw new AppError('Contract not found', 404, 'CONTRACT_NOT_FOUND');
    }
    return contract;
  }

  /**
   * Get contract history for an employee (ordered by startDate desc)
   */
  static async getContractsByEmployee(employeeId) {
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
    }

    const contracts = await Contract.find({ employeeId })
      .populate('salaryStructureId', 'name code')
      .sort({ startDate: -1 });

    const activeContract = contracts.find((c) => c.status === 'ACTIVE') || null;

    return {
      employeeId,
      activeContract,
      history: contracts
    };
  }

  /**
   * Get currently active contract for employee
   */
  static async getActiveContract(employeeId) {
    const contract = await Contract.findOne({
      employeeId,
      status: 'ACTIVE'
    })
      .populate('salaryStructureId')
      .sort({ startDate: -1 });

    return contract;
  }

  /**
   * Update contract
   */
  static async updateContract(id, data) {
    const contract = await Contract.findById(id);
    if (!contract) {
      throw new AppError('Contract not found', 404, 'CONTRACT_NOT_FOUND');
    }

    const newStart = data.startDate || contract.startDate;
    const newEnd = data.endDate !== undefined ? data.endDate : contract.endDate;
    const newStatus = data.status || contract.status;

    ContractService.validateDates(newStart, newEnd);

    if (newStatus === 'ACTIVE') {
      await ContractService.checkOverlappingActiveContracts(
        contract.employeeId,
        newStart,
        newEnd,
        contract._id
      );
    }

    Object.assign(contract, data);
    await contract.save();

    return contract.populate([
      { path: 'employeeId', select: 'employeeCode firstName lastName email department jobPosition' },
      { path: 'salaryStructureId', select: 'name code' }
    ]);
  }

  /**
   * Delete contract
   */
  static async deleteContract(id) {
    const contract = await Contract.findById(id);
    if (!contract) {
      throw new AppError('Contract not found', 404, 'CONTRACT_NOT_FOUND');
    }

    await Contract.findByIdAndDelete(id);
    return { message: 'Contract deleted successfully', contractId: id };
  }

  /**
   * CRITICAL REQUIREMENT:
   * Find applicable contract for a payroll period
   * 
   * Rules:
   * - contract must overlap payroll period:
   *   c.startDate <= periodEnd AND (c.endDate == null OR c.endDate >= periodStart)
   * - detect multiple applicable contracts
   * - return a clear CONTRACT_CONFLICT error if more than one applies
   * - do not simply select the latest contract
   * 
   * @param {string|ObjectId} employeeId 
   * @param {Date|string} periodStart 
   * @param {Date|string} periodEnd 
   * @returns {Promise<Object|null>} Applicable contract
   */
  static async findApplicableContract(employeeId, periodStart, periodEnd) {
    const pStart = new Date(periodStart);
    const pEnd = new Date(periodEnd);

    if (isNaN(pStart.getTime()) || isNaN(pEnd.getTime())) {
      throw new AppError('Invalid payroll period dates', 422, 'VALIDATION_ERROR', { periodStart, periodEnd });
    }

    if (pStart > pEnd) {
      throw new AppError('Period start date must be before or equal to period end date', 422, 'VALIDATION_ERROR');
    }

    // Find all valid contracts (ACTIVE or historical EXPIRED) that overlap with this period
    const applicableContracts = await Contract.find({
      employeeId,
      status: { $in: ['ACTIVE', 'EXPIRED'] },
      startDate: { $lte: pEnd },
      $or: [{ endDate: null }, { endDate: { $gte: pStart } }]
    }).populate('salaryStructureId');

    // Rule 1: Zero applicable contracts found
    if (applicableContracts.length === 0) {
      return null;
    }

    // Rule 2: Multiple applicable contracts found -> CONTRACT_CONFLICT!
    if (applicableContracts.length > 1) {
      throw new AppError(
        `Multiple applicable contracts (${applicableContracts.length}) found for employee in payroll period. Cannot automatically determine applicable salary terms without conflict resolution.`,
        409,
        'CONTRACT_CONFLICT',
        {
          employeeId,
          periodStart: pStart.toISOString().split('T')[0],
          periodEnd: pEnd.toISOString().split('T')[0],
          applicableCount: applicableContracts.length,
          contracts: applicableContracts.map((c) => ({
            id: c._id,
            status: c.status,
            salary: c.salary,
            startDate: c.startDate,
            endDate: c.endDate
          }))
        }
      );
    }

    // Rule 3: Exactly one applicable contract
    return applicableContracts[0];
  }
}

module.exports = ContractService;
