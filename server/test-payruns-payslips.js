const http = require('http');
const mongoose = require('mongoose');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const seedUsers = require('./src/seed/seed');
const Employee = require('./src/models/Employee');
const Contract = require('./src/models/Contract');
const Payrun = require('./src/models/Payrun');
const Payslip = require('./src/models/Payslip');
const SalaryStructure = require('./src/models/SalaryStructure');
const SalaryRule = require('./src/models/SalaryRule');
const Attendance = require('./src/models/Attendance');

let server;
let baseUrl = '';
let adminToken = '';
let payrollMgrToken = '';
let payrollUserToken = '';
let empToken = '';
let testEmp1, testEmp2;

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

async function runPayrunTests() {
  console.log('========================================================');
  console.log(' PEOPLEPAY360 - PAYRUN, PAYSLIP & VALIDATION TESTS');
  console.log('========================================================\n');

  try {
    await connectDB();
    await seedUsers(false);

    server = http.createServer(app);
    await new Promise((r) => server.listen(0, r));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}/api/v1`;

    // 1. Authenticate users
    console.log('[1] Authenticating ADMIN, PAYROLL_MANAGER, PAYROLL_USER, and EMPLOYEE...');
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

    const puLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'payrolluser@peoplepay360.com', password: 'PayrollUser@123456' }
    });
    payrollUserToken = puLogin.data.data.token;

    const empLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'employee@peoplepay360.com', password: 'Employee@123456' }
    });
    empToken = empLogin.data.data.token;
    console.log('  ✓ All 4 user roles logged in successfully\n');

    // 2. Setup Fixtures: Salary Structure & Rules
    await Payslip.syncIndexes().catch(() => {});
    await SalaryRule.deleteMany({ code: { $in: ['RUN_BASIC', 'RUN_HRA', 'RUN_GROSS', 'RUN_PF', 'RUN_NET'] } });
    await SalaryStructure.deleteMany({ code: 'RUN_EXEC_2026' });

    const ruleBasic = await SalaryRule.create({ name: 'Basic', code: 'RUN_BASIC', category: 'BASIC', sequence: 10, calculationType: 'PERCENTAGE', baseCode: 'contract.salary', value: 50 });
    const ruleHra = await SalaryRule.create({ name: 'HRA', code: 'RUN_HRA', category: 'ALLOWANCE', sequence: 20, calculationType: 'PERCENTAGE', baseCode: 'RUN_BASIC', value: 40 });
    const ruleGross = await SalaryRule.create({ name: 'Gross', code: 'RUN_GROSS', category: 'GROSS', sequence: 30, calculationType: 'FORMULA', formula: 'RUN_BASIC + RUN_HRA' });
    const rulePf = await SalaryRule.create({ name: 'PF', code: 'RUN_PF', category: 'DEDUCTION', sequence: 40, calculationType: 'PERCENTAGE', baseCode: 'RUN_BASIC', value: 12 });
    const ruleNet = await SalaryRule.create({ name: 'Net', code: 'RUN_NET', category: 'NET', sequence: 50, calculationType: 'FORMULA', formula: 'RUN_GROSS - RUN_PF' });

    const structure = await SalaryStructure.create({
      name: 'Run Executive Structure 2026',
      code: 'RUN_EXEC_2026',
      ruleIds: [ruleBasic._id, ruleHra._id, ruleGross._id, rulePf._id, ruleNet._id]
    });

    // Employee 1 (linked to seed employee)
    testEmp1 = await Employee.findOne({ email: 'employee@peoplepay360.com' });
    testEmp1.bankDetails = { accountNumber: '123456789012', ifscCode: 'HDFC0001234', bankName: 'HDFC Bank' };
    await testEmp1.save();

    // Employee 2
    testEmp2 = await Employee.findOne({ employeeCode: 'EMP_RUN_02' });
    if (!testEmp2) {
      testEmp2 = await Employee.create({
        employeeCode: 'EMP_RUN_02',
        firstName: 'Sarah',
        lastName: 'Connor',
        email: 'sarah.run@peoplepay360.com',
        phone: '+91 9112233445',
        department: 'Operations',
        jobPosition: 'Operations Lead',
        employeeType: 'FULL_TIME',
        status: 'ACTIVE',
        bankDetails: { accountNumber: '987654321098', ifscCode: 'SBIN0005678', bankName: 'State Bank of India' }
      });
    }

    // Contracts for April 2026
    await Contract.deleteMany({ employeeId: { $in: [testEmp1._id, testEmp2._id] } });
    await Contract.create({
      employeeId: testEmp1._id,
      startDate: new Date('2026-01-01'),
      endDate: null,
      department: 'Engineering',
      jobPosition: 'Software Engineer',
      salary: 50000,
      salaryStructureId: structure._id,
      status: 'ACTIVE'
    });

    await Contract.create({
      employeeId: testEmp2._id,
      startDate: new Date('2026-01-01'),
      endDate: null,
      department: 'Operations',
      jobPosition: 'Operations Lead',
      salary: 70000,
      salaryStructureId: structure._id,
      status: 'ACTIVE'
    });

    // Clean up past payruns/payslips for April 2026
    await Payslip.deleteMany({ employeeId: { $in: [testEmp1._id, testEmp2._id] } });
    await Payrun.deleteMany({ name: { $regex: 'April 2026' } });

    console.log('  ✓ Salary structure and 2 active contracts prepared\n');

    // 3. Two-Step Payrun Creation: Step 1 (Preview)
    console.log('[3] Testing Step 1: POST /api/v1/payruns/preview...');
    const previewRes = await request('/payruns/preview', {
      method: 'POST',
      token: payrollUserToken,
      body: {
        salaryStructureId: structure._id,
        periodStart: '2026-04-01T00:00:00.000Z',
        periodEnd: '2026-04-30T23:59:59.000Z'
      }
    });

    console.log('  ✓ Preview response status:', previewRes.status);
    if (previewRes.status !== 200) throw new Error('Preview failed: ' + JSON.stringify(previewRes.data));
    const previewData = previewRes.data.data;
    console.log(`  ✓ Eligible employees discovered: ${previewData.totalEligible}`);
    if (previewData.totalEligible < 2) throw new Error(`Expected at least 2 eligible employees, got ${previewData.totalEligible}`);

    // Verify preview did NOT create any payruns
    const payrunCount = await Payrun.countDocuments({ name: { $regex: 'April 2026' } });
    if (payrunCount !== 0) throw new Error('Preview must NOT create a payrun in the database!');
    console.log('  ✓ Verified: Zero payruns created in DB during preview');

    // 4. Two-Step Payrun Creation: Step 2 (Create DRAFT with selected employees)
    console.log('\n[4] Testing Step 2: POST /api/v1/payruns (Creation with selected employees)...');
    const createRes = await request('/payruns', {
      method: 'POST',
      token: payrollUserToken,
      body: {
        name: 'April 2026 Executive Payrun',
        salaryStructureId: structure._id,
        periodStart: '2026-04-01T00:00:00.000Z',
        periodEnd: '2026-04-30T23:59:59.000Z',
        employeeIds: [testEmp1._id, testEmp2._id]
      }
    });

    console.log('  ✓ Create response status:', createRes.status);
    if (createRes.status !== 201) throw new Error('Create payrun failed: ' + JSON.stringify(createRes.data));
    const createdPayrun = createRes.data.data.payrun;
    console.log(`  ✓ Payrun created: "${createdPayrun.name}" | Status: ${createdPayrun.status} | Employees: ${createdPayrun.totals.employeeCount}`);
    if (createdPayrun.status !== 'DRAFT') throw new Error('New payrun should be in DRAFT state');

    // 5. State Machine: Preventing Invalid State Transitions
    console.log('\n[5] Testing State Machine: Enforcing Transition Sequence...');
    // Attempting to pay DRAFT directly -> Should Fail (400)
    const badPayRes = await request(`/payruns/${createdPayrun._id}/pay`, {
      method: 'POST',
      token: payrollMgrToken
    });
    console.log('  ✓ Blocked DRAFT -> PAID transition:', badPayRes.status, badPayRes.data.message);
    if (badPayRes.status !== 400) throw new Error('Should block paying DRAFT payrun');

    // Attempting to validate DRAFT directly -> Should Fail (400)
    const badValRes = await request(`/payruns/${createdPayrun._id}/validate`, {
      method: 'POST',
      token: payrollMgrToken
    });
    console.log('  ✓ Blocked DRAFT -> VALIDATED transition:', badValRes.status, badValRes.data.message);
    if (badValRes.status !== 400) throw new Error('Should block validating DRAFT payrun before computation');

    // 6. Compute Payrun: DRAFT -> COMPUTED
    console.log('\n[6] Testing Compute: POST /api/v1/payruns/:id/compute (DRAFT -> COMPUTED)...');
    const computeRes = await request(`/payruns/${createdPayrun._id}/compute`, {
      method: 'POST',
      token: payrollUserToken
    });

    console.log('  ✓ Compute response status:', computeRes.status);
    if (computeRes.status !== 200) throw new Error('Compute failed: ' + JSON.stringify(computeRes.data));
    const computedPayrun = computeRes.data.data.payrun;
    console.log('  ✓ Payrun state after compute:', computedPayrun.status);
    console.log('  ✓ Computed Totals:');
    console.log(`    Total Basic:       INR ${computedPayrun.totals.totalBasic.toLocaleString('en-IN')}`);
    console.log(`    Total Gross:       INR ${computedPayrun.totals.totalGross.toLocaleString('en-IN')}`);
    console.log(`    Total Deductions:  INR ${computedPayrun.totals.totalDeductions.toLocaleString('en-IN')}`);
    console.log(`    Total Net Pay:     INR ${computedPayrun.totals.totalNet.toLocaleString('en-IN')}`);
    if (computedPayrun.warnings && computedPayrun.warnings.length > 0) {
      console.log('    Warnings:', computedPayrun.warnings);
    }

    // Calculation checks:
    // Emp1 (salary 50000): Basic=25000, HRA=10000, Gross=35000, PF=3000, Net=32000
    // Emp2 (salary 70000): Basic=35000, HRA=14000, Gross=49000, PF=4200, Net=44800
    // Total Basic: 60,000 | Gross: 84,000 | Deductions: 7,200 | Net: 76,800
    if (computedPayrun.totals.totalBasic !== 60000) throw new Error(`Expected totalBasic 60000, got ${computedPayrun.totals.totalBasic}`);
    if (computedPayrun.totals.totalGross !== 84000) throw new Error(`Expected totalGross 84000, got ${computedPayrun.totals.totalGross}`);
    if (computedPayrun.totals.totalDeductions !== 7200) throw new Error(`Expected totalDeductions 7200, got ${computedPayrun.totals.totalDeductions}`);
    if (computedPayrun.totals.totalNet !== 76800) throw new Error(`Expected totalNet 76800, got ${computedPayrun.totals.totalNet}`);

    // Verify payslips created
    const payslips = await Payslip.find({ payrunId: createdPayrun._id });
    console.log(`  ✓ Created ${payslips.length} payslips in database with status: ${payslips[0].status}`);
    if (payslips.length !== 2) throw new Error('Expected 2 payslips');

    // 7. Validate Payrun: COMPUTED -> VALIDATED
    console.log('\n[7] Testing Validate: POST /api/v1/payruns/:id/validate (COMPUTED -> VALIDATED)...');
    const valRes = await request(`/payruns/${createdPayrun._id}/validate`, {
      method: 'POST',
      token: payrollMgrToken
    });

    console.log('  ✓ Validate response status:', valRes.status, valRes.data.message);
    if (valRes.status !== 200) throw new Error('Validation failed: ' + JSON.stringify(valRes.data));
    const validatedPayrun = valRes.data.data.payrun;
    console.log('  ✓ Payrun state after validation:', validatedPayrun.status);
    if (validatedPayrun.status !== 'VALIDATED') throw new Error('Payrun should be in VALIDATED state');

    // Verify all payslips moved to VALIDATED
    const validatedPayslips = await Payslip.find({ payrunId: createdPayrun._id });
    if (!validatedPayslips.every((p) => p.status === 'VALIDATED')) {
      throw new Error('All payslips should be in VALIDATED state');
    }
    console.log('  ✓ All 2 payslips successfully marked as VALIDATED');

    // 8. Mark Paid: VALIDATED -> PAID
    console.log('\n[8] Testing Mark Paid: POST /api/v1/payruns/:id/pay (VALIDATED -> PAID)...');
    const payRes = await request(`/payruns/${createdPayrun._id}/pay`, {
      method: 'POST',
      token: payrollMgrToken
    });

    console.log('  ✓ Pay response status:', payRes.status, payRes.data.message);
    if (payRes.status !== 200) throw new Error('Payment finalization failed: ' + JSON.stringify(payRes.data));
    const paidPayrun = payRes.data.data.payrun;
    console.log('  ✓ Payrun state after pay:', paidPayrun.status);
    if (paidPayrun.status !== 'PAID') throw new Error('Payrun should be in PAID state');

    // Immutability test: Cannot recalculate PAID payrun
    const immutRes = await request(`/payruns/${createdPayrun._id}/compute`, {
      method: 'POST',
      token: payrollUserToken
    });
    console.log('  ✓ Blocked re-computation on PAID payrun:', immutRes.status, immutRes.data.message);
    if (immutRes.status !== 400) throw new Error('Must block re-compute on PAID payrun to preserve historical data');

    // 9. Payslip APIs & RBAC Guard
    console.log('\n[9] Testing Payslip APIs & RBAC Ownership Guard...');

    // A. Employee accessing own payslips
    const empPayslipsRes = await request('/payslips', {
      method: 'GET',
      token: empToken
    });
    console.log('  ✓ Employee querying /payslips returned:', empPayslipsRes.status, `Count: ${empPayslipsRes.data.data.payslips.length}`);
    if (empPayslipsRes.status !== 200) throw new Error('Employee should be able to view own payslips');
    for (const p of empPayslipsRes.data.data.payslips) {
      if (p.employeeId._id.toString() !== testEmp1._id.toString()) {
        throw new Error('Employee received payslips belonging to another employee!');
      }
    }
    console.log('  ✓ RBAC Verified: Employee strictly limited to own payslips');

    // B. Single payslip lookup
    const emp1Payslip = payslips.find((p) => p.employeeId.toString() === testEmp1._id.toString());
    const emp2Payslip = payslips.find((p) => p.employeeId.toString() === testEmp2._id.toString());

    // Own payslip -> 200 OK
    const ownSlipRes = await request(`/payslips/${emp1Payslip._id}`, {
      method: 'GET',
      token: empToken
    });
    console.log('  ✓ Employee accessing own payslip by ID:', ownSlipRes.status);
    if (ownSlipRes.status !== 200) throw new Error('Employee should access own payslip');

    // Other employee payslip -> 403 FORBIDDEN
    const otherSlipRes = await request(`/payslips/${emp2Payslip._id}`, {
      method: 'GET',
      token: empToken
    });
    console.log('  ✓ Employee blocked from other employee payslip:', otherSlipRes.status, otherSlipRes.data.message);
    if (otherSlipRes.status !== 403) throw new Error('Employee should receive 403 when requesting other employee payslip');

    // Payroll Manager accessing any payslip -> 200 OK
    const pmSlipRes = await request(`/payslips/${emp2Payslip._id}`, {
      method: 'GET',
      token: payrollMgrToken
    });
    console.log('  ✓ Payroll Manager accessing employee payslip:', pmSlipRes.status);
    if (pmSlipRes.status !== 200) throw new Error('Payroll Manager should access any payslip');

    // 10. Duplicate Payslip Prevention Across Payruns
    console.log('\n[10] Testing Duplicate Payslip Prevention Across Payruns...');
    const dupPayrun = await Payrun.create({
      name: 'Duplicate April Run',
      periodStart: new Date('2026-04-01T00:00:00.000Z'),
      periodEnd: new Date('2026-04-30T23:59:59.000Z'),
      salaryStructureId: structure._id,
      employeeIds: [testEmp1._id]
    });

    const dupComputeRes = await request(`/payruns/${dupPayrun._id}/compute`, {
      method: 'POST',
      token: payrollUserToken
    });
    console.log('  ✓ Duplicate payrun compute returned warnings:', dupComputeRes.data.data.payrun.warnings.length);
    const hasDupWarning = dupComputeRes.data.data.payrun.warnings.some((w) => w.code === 'DUPLICATE_PAYSLIP');
    if (!hasDupWarning) throw new Error('Expected DUPLICATE_PAYSLIP warning/error');
    console.log('  ✓ DUPLICATE_PAYSLIP properly caught across payrun periods');

    // Clean up test documents
    await Payrun.deleteMany({ _id: { $in: [createdPayrun._id, dupPayrun._id] } });
    await Payslip.deleteMany({ payrunId: { $in: [createdPayrun._id, dupPayrun._id] } });
    await Contract.deleteMany({ employeeId: { $in: [testEmp1._id, testEmp2._id] } });
    await SalaryStructure.deleteOne({ _id: structure._id });
    await SalaryRule.deleteMany({ code: { $in: ['RUN_BASIC', 'RUN_HRA', 'RUN_GROSS', 'RUN_PF', 'RUN_NET'] } });
    await Employee.deleteOne({ _id: testEmp2._id });

    console.log('\n========================================================');
    console.log(' ALL PAYRUN, PAYSLIP & VALIDATION TESTS PASSED! (100%)');
    console.log('========================================================\n');
  } catch (err) {
    console.error('\n❌ PAYRUN & PAYSLIP TEST FAILED:', err);
    process.exitCode = 1;
  } finally {
    if (server) {
      await new Promise((r) => server.close(r));
    }
    await mongoose.disconnect();
  }
}

runPayrunTests();
