const SalaryStructure = require('../models/SalaryStructure');
const Contract = require('../models/Contract');
const Payrun = require('../models/Payrun');
const SalaryRuleService = require('./salaryRule.service');
const { AppError } = require('../utils/response.util');

class SalaryStructureService {
  /**
   * Create a new salary structure
   */
  static async createStructure(data) {
    const name = (data.name || '').trim();
    const code = (data.code || '').trim().toUpperCase();

    if (!name) {
      throw new AppError('Salary structure name is required', 422, 'VALIDATION_ERROR', { field: 'name' });
    }
    if (!code) {
      throw new AppError('Salary structure code is required', 422, 'VALIDATION_ERROR', { field: 'code' });
    }

    // Check duplicate name or code
    const existing = await SalaryStructure.findOne({
      $or: [{ name }, { code }]
    });
    if (existing) {
      const field = existing.code === code ? 'code' : 'name';
      throw new AppError(
        `Salary structure with ${field} '${existing[field]}' already exists`,
        409,
        'DUPLICATE_STRUCTURE',
        { field, value: existing[field] }
      );
    }

    // Support ruleIds or rules in input
    const ruleIds = data.ruleIds || data.rules || [];

    // Missing salary structure rules check
    if (!Array.isArray(ruleIds) || ruleIds.length === 0) {
      throw new AppError('Salary structure must contain at least one salary rule', 422, 'MISSING_STRUCTURE_RULES', { field: 'ruleIds' });
    }

    // Validate rules existence, activity, and sequential execution order
    const validatedRules = await SalaryRuleService.getRulesSortedBySequence(ruleIds, true);
    const sortedRuleIds = validatedRules.map((r) => r._id);

    const structure = await SalaryStructure.create({
      name,
      code,
      description: data.description ? data.description.trim() : '',
      ruleIds: sortedRuleIds,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true
    });

    return structure.populate({
      path: 'ruleIds',
      options: { sort: { sequence: 1 } }
    });
  }

  /**
   * Get all salary structures
   */
  static async getStructures(query = {}) {
    const { search, isActive } = query;
    const filter = {};

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true' || isActive === true;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    const structures = await SalaryStructure.find(filter)
      .populate({
        path: 'ruleIds',
        options: { sort: { sequence: 1 } }
      })
      .sort({ name: 1 });

    return structures;
  }

  /**
   * Get salary structure by ID
   */
  static async getStructureById(id) {
    const structure = await SalaryStructure.findById(id).populate({
      path: 'ruleIds',
      options: { sort: { sequence: 1 } }
    });

    if (!structure) {
      throw new AppError('Salary structure not found', 404, 'STRUCTURE_NOT_FOUND');
    }

    return structure;
  }

  /**
   * Update salary structure
   */
  static async updateStructure(id, data) {
    const structure = await SalaryStructure.findById(id);
    if (!structure) {
      throw new AppError('Salary structure not found', 404, 'STRUCTURE_NOT_FOUND');
    }

    if (data.name && data.name.trim() !== structure.name) {
      const existingName = await SalaryStructure.findOne({
        name: data.name.trim(),
        _id: { $ne: id }
      });
      if (existingName) {
        throw new AppError(`Salary structure name '${data.name}' already exists`, 409, 'DUPLICATE_STRUCTURE');
      }
      structure.name = data.name.trim();
    }

    if (data.code && data.code.trim().toUpperCase() !== structure.code) {
      const upperCode = data.code.trim().toUpperCase();
      const existingCode = await SalaryStructure.findOne({
        code: upperCode,
        _id: { $ne: id }
      });
      if (existingCode) {
        throw new AppError(`Salary structure code '${upperCode}' already exists`, 409, 'DUPLICATE_STRUCTURE');
      }
      structure.code = upperCode;
    }

    if (data.description !== undefined) {
      structure.description = data.description ? data.description.trim() : '';
    }

    if (data.isActive !== undefined) {
      structure.isActive = Boolean(data.isActive);
    }

    const incomingRules = data.ruleIds || data.rules;
    if (incomingRules !== undefined) {
      if (!Array.isArray(incomingRules) || incomingRules.length === 0) {
        throw new AppError('Salary structure must contain at least one salary rule', 422, 'MISSING_STRUCTURE_RULES');
      }

      const validatedRules = await SalaryRuleService.getRulesSortedBySequence(incomingRules, true);
      structure.ruleIds = validatedRules.map((r) => r._id);
    }

    await structure.save();

    return structure.populate({
      path: 'ruleIds',
      options: { sort: { sequence: 1 } }
    });
  }

  /**
   * Delete salary structure
   */
  static async deleteStructure(id) {
    const structure = await SalaryStructure.findById(id);
    if (!structure) {
      throw new AppError('Salary structure not found', 404, 'STRUCTURE_NOT_FOUND');
    }

    // Check if in use by active contracts
    const activeContract = await Contract.findOne({ salaryStructureId: id, status: 'ACTIVE' });
    if (activeContract) {
      throw new AppError(
        `Cannot delete salary structure '${structure.name}' as it is currently associated with an active contract`,
        409,
        'STRUCTURE_IN_USE',
        { contractId: activeContract._id }
      );
    }

    // Check if in use by payruns
    const attachedPayrun = await Payrun.findOne({ salaryStructureId: id });
    if (attachedPayrun) {
      throw new AppError(
        `Cannot delete salary structure '${structure.name}' as it is referenced in past/current payruns`,
        409,
        'STRUCTURE_IN_USE',
        { payrunId: attachedPayrun._id }
      );
    }

    await SalaryStructure.findByIdAndDelete(id);
    return { message: `Salary structure '${structure.name}' deleted successfully`, structureId: id };
  }
}

module.exports = SalaryStructureService;
