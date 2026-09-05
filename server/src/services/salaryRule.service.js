const SalaryRule = require('../models/SalaryRule');
const SalaryStructure = require('../models/SalaryStructure');
const SafeCalculator = require('../utils/safeCalculator.util');
const { AppError } = require('../utils/response.util');

// Standard payroll context variables that are always permitted
const STANDARD_CONTEXT_VARS = new Set([
  'CONTRACT.SALARY',
  'CONTRACT.WAGE',
  'WAGE',
  'SALARY',
  'WORKED_DAYS',
  'WORKING_DAYS',
  'PAID_LEAVES',
  'UNPAID_LEAVES',
  'DEDUCTIONS',
  'ALLOWANCES',
  'TOTAL_DEDUCTION',
  'TOTAL_ALLOWANCE',
  'GROSS',
  'BASIC'
]);

class SalaryRuleService {
  /**
   * Validate rule attributes, formulas, sequences, and dependencies
   */
  static async validateRuleData(data, ruleId = null) {
    const code = (data.code || '').trim().toUpperCase();
    
    // 1. Validate Code
    if (!code) {
      throw new AppError('Rule code is required', 422, 'VALIDATION_ERROR', { field: 'code' });
    }

    // Check duplicate rule codes
    const existingRule = await SalaryRule.findOne({
      code,
      ...(ruleId ? { _id: { $ne: ruleId } } : {})
    });
    if (existingRule) {
      throw new AppError(`Salary rule with code '${code}' already exists`, 409, 'DUPLICATE_RULE_CODE', { code });
    }

    // 2. Validate Sequence
    if (data.sequence !== undefined) {
      const seq = Number(data.sequence);
      if (isNaN(seq) || seq < 1 || !Number.isInteger(seq)) {
        throw new AppError('Sequence must be a positive integer (minimum 1)', 422, 'INVALID_SEQUENCE', { sequence: data.sequence });
      }
    }

    // 3. Validate Calculation Type & specific dependencies
    const calcType = data.calculationType;

    if (calcType === 'FIXED') {
      if (data.value !== undefined && isNaN(Number(data.value))) {
        throw new AppError('Value must be a valid number for FIXED calculation type', 422, 'VALIDATION_ERROR', { value: data.value });
      }
    } else if (calcType === 'PERCENTAGE') {
      const baseCode = (data.baseCode || '').trim();
      if (!baseCode) {
        throw new AppError('baseCode is required when calculationType is PERCENTAGE', 422, 'MISSING_BASE_CODE', { field: 'baseCode' });
      }

      // Percentage value must be a valid number
      if (data.value === undefined || isNaN(Number(data.value))) {
        throw new AppError('Percentage value is required and must be numeric', 422, 'VALIDATION_ERROR', { value: data.value });
      }

      // Check if baseCode is standard context variable or existing rule code
      const upperBase = baseCode.toUpperCase();
      if (!STANDARD_CONTEXT_VARS.has(upperBase)) {
        const baseRuleExists = await SalaryRule.findOne({ code: upperBase });
        if (!baseRuleExists) {
          throw new AppError(`Referenced baseCode '${baseCode}' does not exist as a standard variable or salary rule`, 422, 'INVALID_BASE_CODE', { baseCode });
        }
      }
    } else if (calcType === 'FORMULA') {
      const formula = (data.formula || '').trim();
      if (!formula) {
        throw new AppError('formula string is required when calculationType is FORMULA', 422, 'MISSING_FORMULA', { field: 'formula' });
      }

      // Extract variables referenced in the formula
      const referencedVars = SafeCalculator.extractVariables(formula);

      // Verify each referenced variable is valid (either a standard context var or existing rule)
      for (const varName of referencedVars) {
        const upperVar = varName.toUpperCase();
        if (!STANDARD_CONTEXT_VARS.has(upperVar)) {
          const ruleExists = await SalaryRule.findOne({ code: upperVar });
          if (!ruleExists && upperVar !== code) {
            throw new AppError(`Formula contains invalid or unknown reference '${varName}'`, 422, 'INVALID_FORMULA_REFERENCE', { variable: varName, formula });
          }
        }
      }

      // Test formula parsing with dummy values
      try {
        const testContext = {};
        for (const v of referencedVars) {
          testContext[v] = 1000;
          testContext[v.toUpperCase()] = 1000;
        }
        testContext['CONTRACT.SALARY'] = 50000;
        testContext['WORKED_DAYS'] = 30;
        testContext['WORKING_DAYS'] = 30;
        SafeCalculator.evaluate(formula, testContext);
      } catch (err) {
        throw new AppError(`Formula syntax error: ${err.message}`, 422, 'INVALID_FORMULA_SYNTAX', { formula, error: err.message });
      }
    }
  }

  /**
   * Create a new salary rule
   */
  static async createRule(data) {
    await SalaryRuleService.validateRuleData(data);

    const rule = await SalaryRule.create({
      name: data.name.trim(),
      code: data.code.trim().toUpperCase(),
      category: data.category,
      sequence: Number(data.sequence) || 10,
      calculationType: data.calculationType || 'FIXED',
      value: data.value !== undefined ? Number(data.value) : 0,
      formula: data.formula ? data.formula.trim() : '',
      baseCode: data.baseCode ? data.baseCode.trim() : '',
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true
    });

    return rule;
  }

  /**
   * Get all salary rules sorted by sequence ascending
   */
  static async getRules(query = {}) {
    const { category, calculationType, isActive, search } = query;
    const filter = {};

    if (category) filter.category = category;
    if (calculationType) filter.calculationType = calculationType;
    if (isActive !== undefined) filter.isActive = isActive === 'true' || isActive === true;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    return SalaryRule.find(filter).sort({ sequence: 1, createdAt: 1 });
  }

  /**
   * Get rule by ID
   */
  static async getRuleById(id) {
    const rule = await SalaryRule.findById(id);
    if (!rule) {
      throw new AppError('Salary rule not found', 404, 'RULE_NOT_FOUND');
    }
    return rule;
  }

  /**
   * Update salary rule
   */
  static async updateRule(id, data) {
    const rule = await SalaryRule.findById(id);
    if (!rule) {
      throw new AppError('Salary rule not found', 404, 'RULE_NOT_FOUND');
    }

    const mergedData = {
      code: data.code || rule.code,
      sequence: data.sequence !== undefined ? data.sequence : rule.sequence,
      calculationType: data.calculationType || rule.calculationType,
      value: data.value !== undefined ? data.value : rule.value,
      formula: data.formula !== undefined ? data.formula : rule.formula,
      baseCode: data.baseCode !== undefined ? data.baseCode : rule.baseCode
    };

    await SalaryRuleService.validateRuleData(mergedData, id);

    if (data.name) rule.name = data.name.trim();
    if (data.code) rule.code = data.code.trim().toUpperCase();
    if (data.category) rule.category = data.category;
    if (data.sequence !== undefined) rule.sequence = Number(data.sequence);
    if (data.calculationType) rule.calculationType = data.calculationType;
    if (data.value !== undefined) rule.value = Number(data.value);
    if (data.formula !== undefined) rule.formula = data.formula.trim();
    if (data.baseCode !== undefined) rule.baseCode = data.baseCode.trim();
    if (data.isActive !== undefined) rule.isActive = Boolean(data.isActive);

    await rule.save();
    return rule;
  }

  /**
   * Delete salary rule
   */
  static async deleteRule(id) {
    const rule = await SalaryRule.findById(id);
    if (!rule) {
      throw new AppError('Salary rule not found', 404, 'RULE_NOT_FOUND');
    }

    // Prevent deletion if rule is attached to any salary structure
    const usedInStructure = await SalaryStructure.findOne({ ruleIds: id });
    if (usedInStructure) {
      throw new AppError(
        `Cannot delete rule '${rule.code}' because it is in use by salary structure '${usedInStructure.name}'`,
        409,
        'RULE_IN_USE',
        { structureId: usedInStructure._id, structureName: usedInStructure.name }
      );
    }

    await SalaryRule.findByIdAndDelete(id);
    return { message: `Salary rule '${rule.code}' deleted successfully`, ruleId: id };
  }

  /**
   * Reusable method: Get rules sorted by sequence ascending
   * Optionally filters only active rules, and validates existence.
   */
  static async getRulesSortedBySequence(ruleIds = null, onlyActive = true) {
    let query = {};
    if (ruleIds && Array.isArray(ruleIds) && ruleIds.length > 0) {
      query._id = { $in: ruleIds };
    }

    const rules = await SalaryRule.find(query).sort({ sequence: 1, _id: 1 });

    if (ruleIds && Array.isArray(ruleIds)) {
      if (rules.length !== ruleIds.length) {
        const foundIds = new Set(rules.map((r) => r._id.toString()));
        const missingIds = ruleIds.filter((id) => !foundIds.has(id.toString()));
        throw new AppError('One or more referenced salary rules do not exist', 404, 'RULE_NOT_FOUND', { missingIds });
      }

      if (onlyActive) {
        const inactiveRule = rules.find((r) => !r.isActive);
        if (inactiveRule) {
          throw new AppError(
            `Rule '${inactiveRule.code}' is inactive and cannot be used`,
            422,
            'INACTIVE_RULE',
            { ruleId: inactiveRule._id, code: inactiveRule.code }
          );
        }
      }
    }

    // Validate sequential execution integrity
    SalaryRuleService.validateRulesSequence(rules);

    return rules;
  }

  /**
   * Validate that rules execute in sequence ascending order without forward references
   */
  static validateRulesSequence(rules) {
    if (!Array.isArray(rules) || rules.length === 0) return;

    const evaluatedCodes = new Set([
      'CONTRACT.SALARY',
      'CONTRACT.WAGE',
      'WAGE',
      'SALARY',
      'WORKED_DAYS',
      'WORKING_DAYS',
      'PAID_LEAVES',
      'UNPAID_LEAVES',
      'DEDUCTIONS',
      'ALLOWANCES'
    ]);

    for (let i = 0; i < rules.length; i++) {
      const current = rules[i];

      // PERCENTAGE rule baseCode check
      if (current.calculationType === 'PERCENTAGE' && current.baseCode) {
        const baseUpper = current.baseCode.toUpperCase();
        if (!evaluatedCodes.has(baseUpper)) {
          throw new AppError(
            `Rule '${current.code}' (sequence ${current.sequence}) depends on '${current.baseCode}', which is not available prior in the execution sequence`,
            422,
            'INVALID_SEQUENCE_DEPENDENCY',
            { rule: current.code, sequence: current.sequence, missingDependency: current.baseCode }
          );
        }
      }

      // FORMULA rule references check
      if (current.calculationType === 'FORMULA' && current.formula) {
        const referencedVars = SafeCalculator.extractVariables(current.formula);
        for (const varName of referencedVars) {
          const upper = varName.toUpperCase();
          if (!evaluatedCodes.has(upper)) {
            throw new AppError(
              `Rule '${current.code}' (sequence ${current.sequence}) references '${varName}' in formula, which is not evaluated prior in sequence`,
              422,
              'INVALID_SEQUENCE_DEPENDENCY',
              { rule: current.code, sequence: current.sequence, missingDependency: varName }
            );
          }
        }
      }

      evaluatedCodes.add(current.code.toUpperCase());
    }
  }

  /**
   * Safely evaluate a single rule against payroll calculation context
   */
  static evaluateRule(rule, context) {
    let result = 0;

    switch (rule.calculationType) {
      case 'FIXED':
        result = Number(rule.value) || 0;
        break;

      case 'PERCENTAGE': {
        const baseKey = (rule.baseCode || 'contract.salary').toUpperCase();
        let baseVal = 0;

        if (baseKey === 'CONTRACT.SALARY' || baseKey === 'CONTRACT.WAGE' || baseKey === 'WAGE' || baseKey === 'SALARY') {
          baseVal = Number(context.wage || context.salary || context['CONTRACT.SALARY'] || (context.contract && context.contract.wage)) || 0;
        } else if (baseKey in context) {
          baseVal = Number(context[baseKey]) || 0;
        } else {
          baseVal = Number(context[rule.baseCode]) || 0;
        }

        const percentage = Number(rule.value) || 0;
        result = (baseVal * percentage) / 100;
        break;
      }

      case 'FORMULA': {
        result = SafeCalculator.evaluate(rule.formula, context);
        break;
      }

      default:
        result = Number(rule.value) || 0;
    }

    return Math.round((Number(result) + Number.EPSILON) * 100) / 100;
  }
}

module.exports = SalaryRuleService;
