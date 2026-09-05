const http = require('http');
const mongoose = require('mongoose');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const seedUsers = require('./src/seed/seed');
const SalaryRule = require('./src/models/SalaryRule');
const SalaryStructure = require('./src/models/SalaryStructure');
const SalaryRuleService = require('./src/services/salaryRule.service');
const SafeCalculator = require('./src/utils/safeCalculator.util');

let server;
let baseUrl = '';
let adminToken = '';
let payrollMgrToken = '';
let empToken = '';

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
  };

  const fetchOptions = {
    method: options.method || 'GET',
    headers,
    ...(options.body ? { body: JSON.stringify(options.body) } : {})
  };

  const res = await fetch(url, fetchOptions);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('========================================================');
  console.log(' PEOPLEPAY360 - SALARY STRUCTURES & SALARY RULES TESTS');
  console.log('========================================================\n');

  try {
    await connectDB();
    await seedUsers(false);

    server = http.createServer(app);
    await new Promise((r) => server.listen(0, r));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}/api/v1`;

    // 1. Authenticate users
    console.log('[1] Authenticating ADMIN, PAYROLL_MANAGER, and EMPLOYEE...');
    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'admin@peoplepay360.com', password: 'Admin@123456' }
    });
    adminToken = adminLogin.data.data.token;

    const pmLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'payrollmgr@peoplepay360.com', password: 'PayrollMgr@123456' }
    });
    payrollMgrToken = pmLogin.data.data.token;

    const empLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'employee@peoplepay360.com', password: 'Employee@123456' }
    });
    empToken = empLogin.data.data.token;

    console.log('  ✓ Tokens retrieved successfully\n');

    // 2. SafeCalculator Unit Tests
    console.log('[2] Testing SafeCalculator Utility (Zero-Eval)...');
    
    // Arithmetic & precedence
    const res1 = SafeCalculator.evaluate('100 + 20 * 3', {});
    if (res1 !== 160) throw new Error(`Expected 160, got ${res1}`);
    console.log('  ✓ Operator precedence: 100 + 20 * 3 =', res1);

    // Percentage notation
    const res2 = SafeCalculator.evaluate('BASIC * 40%', { BASIC: 50000 });
    if (res2 !== 20000) throw new Error(`Expected 20000, got ${res2}`);
    console.log('  ✓ Percentage notation: BASIC * 40% =', res2);

    // Nested properties
    const res3 = SafeCalculator.evaluate('contract.salary * 0.5', { contract: { salary: 60000 } });
    if (res3 !== 30000) throw new Error(`Expected 30000, got ${res3}`);
    console.log('  ✓ Context nested property: contract.salary * 0.5 =', res3);

    // Ternary condition
    const res4 = SafeCalculator.evaluate('GROSS > 50000 ? (GROSS - 50000) * 0.1 : 0', { GROSS: 72000 });
    if (res4 !== 2200) throw new Error(`Expected 2200, got ${res4}`);
    console.log('  ✓ Ternary condition: GROSS > 50000 ? (GROSS - 50000) * 0.1 : 0 =', res4);

    // Math functions
    const res5 = SafeCalculator.evaluate('min(BASIC * 0.12, 1800)', { BASIC: 20000 });
    if (res5 !== 1800) throw new Error(`Expected 1800, got ${res5}`);
    console.log('  ✓ Safe Math function: min(BASIC * 0.12, 1800) =', res5);

    // Variable extraction
    const vars = SafeCalculator.extractVariables('GROSS - (PF + TAX)');
    console.log('  ✓ Extracted variables:', vars);
    if (!vars.includes('GROSS') || !vars.includes('PF') || !vars.includes('TAX')) {
      throw new Error('Failed to extract variables');
    }

    // 3. Clean up existing test rules and structures
    const testCodes = ['TEST_BASIC', 'TEST_HRA', 'TEST_TRANS', 'TEST_GROSS', 'TEST_PF', 'TEST_TAX', 'TEST_NET', 'DUP_CODE', 'INVAL_SEQ'];
    await SalaryStructure.deleteMany({ code: { $in: ['TEST_EXEC_STRUC', 'TEST_FAIL_STRUC'] } });
    await SalaryRule.deleteMany({ code: { $in: testCodes } });

    // 4. Test Salary Rule Validations
    console.log('\n[3] Testing Salary Rule Validations...');

    // Missing baseCode for PERCENTAGE
    const missBaseRes = await request('/salary-rules', {
      method: 'POST',
      token: payrollMgrToken,
      body: {
        name: 'Invalid HRA',
        code: 'TEST_HRA_FAIL',
        category: 'ALLOWANCE',
        sequence: 20,
        calculationType: 'PERCENTAGE',
        value: 40
        // missing baseCode
      }
    });
    console.log('  ✓ Missing baseCode rejected:', missBaseRes.status, missBaseRes.data.message);
    if (missBaseRes.status !== 422) throw new Error('Missing baseCode should return 422');

    // Invalid sequence
    const invalSeqRes = await request('/salary-rules', {
      method: 'POST',
      token: payrollMgrToken,
      body: {
        name: 'Invalid Seq Rule',
        code: 'INVAL_SEQ',
        category: 'BASIC',
        sequence: -10,
        calculationType: 'FIXED',
        value: 1000
      }
    });
    console.log('  ✓ Invalid sequence rejected:', invalSeqRes.status, invalSeqRes.data.message);
    if (invalSeqRes.status !== 422) throw new Error('Invalid sequence should return 422');

    // Invalid formula reference
    const invalRefRes = await request('/salary-rules', {
      method: 'POST',
      token: payrollMgrToken,
      body: {
        name: 'Invalid Formula Rule',
        code: 'TEST_FAIL_FORMULA',
        category: 'GROSS',
        sequence: 40,
        calculationType: 'FORMULA',
        formula: 'NON_EXISTENT_VAR * 2'
      }
    });
    console.log('  ✓ Invalid formula reference rejected:', invalRefRes.status, invalRefRes.data.message);
    if (invalRefRes.status !== 422) throw new Error('Invalid formula reference should return 422');

    // 5. Create Valid Salary Rules
    console.log('\n[4] Creating Valid Salary Rules with Strict Sequence Order...');

    const rulesData = [
      {
        name: 'Basic Salary',
        code: 'TEST_BASIC',
        category: 'BASIC',
        sequence: 10,
        calculationType: 'PERCENTAGE',
        baseCode: 'contract.salary',
        value: 100
      },
      {
        name: 'House Rent Allowance',
        code: 'TEST_HRA',
        category: 'ALLOWANCE',
        sequence: 20,
        calculationType: 'PERCENTAGE',
        baseCode: 'TEST_BASIC',
        value: 40
      },
      {
        name: 'Transport Allowance',
        code: 'TEST_TRANS',
        category: 'ALLOWANCE',
        sequence: 30,
        calculationType: 'FIXED',
        value: 2000
      },
      {
        name: 'Gross Salary',
        code: 'TEST_GROSS',
        category: 'GROSS',
        sequence: 40,
        calculationType: 'FORMULA',
        formula: 'TEST_BASIC + TEST_HRA + TEST_TRANS'
      },
      {
        name: 'Provident Fund',
        code: 'TEST_PF',
        category: 'DEDUCTION',
        sequence: 50,
        calculationType: 'PERCENTAGE',
        baseCode: 'TEST_BASIC',
        value: 12
      },
      {
        name: 'Professional Tax',
        code: 'TEST_TAX',
        category: 'DEDUCTION',
        sequence: 60,
        calculationType: 'FORMULA',
        formula: 'TEST_GROSS > 50000 ? (TEST_GROSS - 50000) * 0.1 : 0'
      },
      {
        name: 'Net Salary',
        code: 'TEST_NET',
        category: 'NET',
        sequence: 70,
        calculationType: 'FORMULA',
        formula: 'TEST_GROSS - TEST_PF - TEST_TAX'
      }
    ];

    const createdRules = [];
    for (const r of rulesData) {
      const res = await request('/salary-rules', {
        method: 'POST',
        token: payrollMgrToken,
        body: r
      });
      if (res.status !== 201) {
        throw new Error(`Failed to create rule ${r.code}: ` + JSON.stringify(res.data));
      }
      createdRules.push(res.data.data.rule);
      console.log(`  ✓ Created Rule: [Seq ${r.sequence}] ${r.code} (${r.category}) - Type: ${r.calculationType}`);
    }

    // Duplicate rule code check
    const dupRes = await request('/salary-rules', {
      method: 'POST',
      token: payrollMgrToken,
      body: {
        name: 'Duplicate Basic',
        code: 'TEST_BASIC',
        category: 'BASIC',
        sequence: 15,
        calculationType: 'FIXED',
        value: 5000
      }
    });
    console.log('  ✓ Duplicate rule code rejected:', dupRes.status, dupRes.data.message);
    if (dupRes.status !== 409) throw new Error('Duplicate rule code should return 409');

    // 6. Test Salary Structure Validations
    console.log('\n[5] Testing Salary Structure Validations...');

    // Missing structure rules
    const missRulesRes = await request('/salary-structures', {
      method: 'POST',
      token: payrollMgrToken,
      body: {
        name: 'Empty Structure',
        code: 'TEST_EMPTY_STRUC',
        ruleIds: []
      }
    });
    console.log('  ✓ Empty rules array rejected:', missRulesRes.status, missRulesRes.data.message);
    if (missRulesRes.status !== 422) throw new Error('Empty ruleIds should return 422');

    // Inactive rule validation
    const inactiveRule = await SalaryRule.create({
      name: 'Inactive Rule',
      code: 'TEST_INACTIVE',
      category: 'ALLOWANCE',
      sequence: 25,
      calculationType: 'FIXED',
      value: 500,
      isActive: false
    });

    const inactiveStrucRes = await request('/salary-structures', {
      method: 'POST',
      token: payrollMgrToken,
      body: {
        name: 'Inactive Rule Structure',
        code: 'TEST_INACTIVE_STRUC',
        ruleIds: [createdRules[0]._id, inactiveRule._id]
      }
    });
    console.log('  ✓ Inactive rule in structure rejected:', inactiveStrucRes.status, inactiveStrucRes.data.message);
    if (inactiveStrucRes.status !== 422) throw new Error('Inactive rule should return 422');

    // Out-of-sequence / Circular dependency validation
    // Try passing rules where Net is placed before Gross
    const badSequenceRule = await SalaryRule.create({
      name: 'Premature Net',
      code: 'TEST_EARLY_NET',
      category: 'NET',
      sequence: 5, // Sequence 5 is evaluated BEFORE TEST_BASIC (10)
      calculationType: 'PERCENTAGE',
      baseCode: 'TEST_BASIC',
      value: 90
    });

    const badSeqStrucRes = await request('/salary-structures', {
      method: 'POST',
      token: payrollMgrToken,
      body: {
        name: 'Bad Sequence Structure',
        code: 'TEST_BAD_SEQ_STRUC',
        ruleIds: [createdRules[0]._id, badSequenceRule._id]
      }
    });
    console.log('  ✓ Forward/out-of-sequence dependency rejected:', badSeqStrucRes.status, badSeqStrucRes.data.message);
    if (badSeqStrucRes.status !== 422) throw new Error('Out of sequence dependency should return 422');

    // Clean up temporary test rules
    await SalaryRule.deleteMany({ _id: { $in: [inactiveRule._id, badSequenceRule._id] } });

    // 7. Create Valid Salary Structure
    console.log('\n[6] Creating Valid Salary Structure with All Sequenced Rules...');
    const ruleIds = createdRules.map((r) => r._id);

    const strucRes = await request('/salary-structures', {
      method: 'POST',
      token: payrollMgrToken,
      body: {
        name: 'Executive Salary Structure 2026',
        code: 'TEST_EXEC_STRUC',
        description: 'Standard executive salary structure with allowances, PF, and tax',
        ruleIds: ruleIds
      }
    });
    console.log('  ✓ Salary structure creation response:', strucRes.status, strucRes.data.message);
    if (strucRes.status !== 201) throw new Error('Salary structure creation failed: ' + JSON.stringify(strucRes.data));

    const structure = strucRes.data.data.structure;
    console.log(`  ✓ Structure "${structure.name}" created with ${structure.ruleIds.length} rules.`);

    // Verify rules are returned sorted by sequence ascending
    const seqs = structure.ruleIds.map((r) => r.sequence);
    console.log('  ✓ Returned rules sequence order:', seqs);
    for (let i = 0; i < seqs.length - 1; i++) {
      if (seqs[i] >= seqs[i + 1]) throw new Error(`Rules not in strictly ascending sequence order: ${seqs}`);
    }

    // 8. Reusable Service Test: SalaryRuleService.getRulesSortedBySequence
    console.log('\n[7] Testing Reusable SalaryRuleService.getRulesSortedBySequence...');
    const sortedRules = await SalaryRuleService.getRulesSortedBySequence(ruleIds, true);
    if (sortedRules.length !== createdRules.length) throw new Error('Mismatch in returned rules count');
    console.log('  ✓ Service returned all rules sorted by sequence successfully');

    // 9. End-to-End Execution Test against a sample contract salary
    console.log('\n[8] Executing Full Salary Calculation on Sample Contract (INR 50,000)...');
    const calculationContext = {
      'contract.salary': 50000,
      'contract.wage': 50000,
      wage: 50000,
      salary: 50000,
      worked_days: 30,
      working_days: 30
    };

    for (const rule of sortedRules) {
      const computedValue = SalaryRuleService.evaluateRule(rule, calculationContext);
      calculationContext[rule.code] = computedValue;
      calculationContext[rule.code.toUpperCase()] = computedValue;
      console.log(`    [Seq ${rule.sequence}] ${rule.code.padEnd(12)} = INR ${computedValue.toLocaleString('en-IN')}`);
    }

    // Expected values:
    // BASIC = 50,000
    // HRA = 50,000 * 40% = 20,000
    // TRANSPORT = 2,000
    // GROSS = 50,000 + 20,000 + 2,000 = 72,000
    // PF = 50,000 * 12% = 6,000
    // TAX = (72,000 - 50,000) * 0.1 = 2,200
    // NET = 72,000 - 6,000 - 2,200 = 63,800
    if (calculationContext['TEST_BASIC'] !== 50000) throw new Error(`Expected BASIC 50000, got ${calculationContext['TEST_BASIC']}`);
    if (calculationContext['TEST_HRA'] !== 20000) throw new Error(`Expected HRA 20000, got ${calculationContext['TEST_HRA']}`);
    if (calculationContext['TEST_TRANS'] !== 2000) throw new Error(`Expected TRANSPORT 2000, got ${calculationContext['TEST_TRANS']}`);
    if (calculationContext['TEST_GROSS'] !== 72000) throw new Error(`Expected GROSS 72000, got ${calculationContext['TEST_GROSS']}`);
    if (calculationContext['TEST_PF'] !== 6000) throw new Error(`Expected PF 6000, got ${calculationContext['TEST_PF']}`);
    if (calculationContext['TEST_TAX'] !== 2200) throw new Error(`Expected TAX 2200, got ${calculationContext['TEST_TAX']}`);
    if (calculationContext['TEST_NET'] !== 63800) throw new Error(`Expected NET 63800, got ${calculationContext['TEST_NET']}`);

    console.log('  ✓ All payroll calculated lines match expected values with 100% precision!');

    // 10. Test RBAC permissions
    console.log('\n[9] Testing RBAC Permissions...');
    const empDenyRes = await request('/salary-structures', {
      method: 'POST',
      token: empToken,
      body: { name: 'Unauthorized', code: 'UNAUTH' }
    });
    console.log('  ✓ EMPLOYEE blocked from creating salary structure:', empDenyRes.status, empDenyRes.data.message);
    if (empDenyRes.status !== 403) throw new Error('Employee should receive 403 FORBIDDEN');

    // 11. Cleanup test records
    await SalaryStructure.deleteMany({ code: 'TEST_EXEC_STRUC' });
    await SalaryRule.deleteMany({ code: { $in: testCodes } });

    console.log('\n========================================================');
    console.log(' ALL SALARY STRUCTURE & SALARY RULE TESTS PASSED (100%)');
    console.log('========================================================\n');
  } catch (err) {
    console.error('\nTEST FAILED:', err);
    process.exitCode = 1;
  } finally {
    if (server) {
      await new Promise((r) => server.close(r));
    }
    await mongoose.disconnect();
  }
}

runTests();
