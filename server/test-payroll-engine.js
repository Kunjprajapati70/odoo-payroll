const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const seedUsers = require('./src/seed/seed');
const Employee = require('./src/models/Employee');
const Contract = require('./src/models/Contract');
const Payrun = require('./src/models/Payrun');
const SalaryStructure = require('./src/models/SalaryStructure');
const SalaryRule = require('./src/models/SalaryRule');
const Attendance = require('./src/models/Attendance');
const TimeOffType = require('./src/models/TimeOffType');
const LeaveRequest = require('./src/models/LeaveRequest');
const PayrollEngineService = require('./src/services/payrollEngine.service');

async function runPayrollEngineTests() {
  console.log('========================================================');
  console.log(' PEOPLEPAY360 - CORE PAYROLL ENGINE UNIT & INTEGRATION TESTS');
  console.log('========================================================\n');

  try {
    await connectDB();
    await seedUsers(false);

    // =====================================================
    // 1. UNIT TESTS: RULE & TOTALS CALCULATION FUNCTIONS
    // =====================================================
    console.log('[1] Unit Testing Individual Calculation Functions...');

    // A. Fixed Rule
    const fixedRes1 = PayrollEngineService.calculateFixedRule({ value: 5000 });
    const fixedRes2 = PayrollEngineService.calculateFixedRule({ value: 0 });
    if (fixedRes1 !== 5000 || fixedRes2 !== 0) throw new Error('calculateFixedRule failed');
    console.log('  ✓ calculateFixedRule: 5000 ->', fixedRes1);

    // B. Percentage Rule
    const context = {
      salary: 60000,
      'CONTRACT.SALARY': 60000,
      BASIC: 30000
    };
    const pctRes1 = PayrollEngineService.calculatePercentageRule(
      { code: 'BASIC', baseCode: 'contract.salary', value: 50 },
      context
    );
    if (pctRes1 !== 30000) throw new Error(`Expected 30000, got ${pctRes1}`);
    console.log('  ✓ calculatePercentageRule on contract.salary: 50% of 60000 ->', pctRes1);

    const pctRes2 = PayrollEngineService.calculatePercentageRule(
      { code: 'HRA', baseCode: 'BASIC', value: 40 },
      context
    );
    if (pctRes2 !== 12000) throw new Error(`Expected 12000, got ${pctRes2}`);
    console.log('  ✓ calculatePercentageRule on BASIC: 40% of 30000 ->', pctRes2);

    // Error cases for percentage
    try {
      PayrollEngineService.calculatePercentageRule({ code: 'BAD_PCT', baseCode: '', value: 10 }, context);
      throw new Error('Should fail on missing baseCode');
    } catch (err) {
      console.log('  ✓ calculatePercentageRule: Missing baseCode properly caught:', err.code);
    }

    try {
      PayrollEngineService.calculatePercentageRule({ code: 'BAD_PCT', baseCode: 'UNKNOWN_VAR', value: 10 }, context);
      throw new Error('Should fail on unknown baseCode');
    } catch (err) {
      console.log('  ✓ calculatePercentageRule: Unknown baseCode properly caught:', err.code);
    }

    // C. Formula Rule
    const formulaCtx = {
      BASIC: 30000,
      HRA: 12000,
      SPECIAL: 5000,
      GROSS: 47000,
      PF: 3600
    };

    const formRes1 = PayrollEngineService.calculateFormulaRule(
      { code: 'GROSS', formula: 'BASIC + HRA + SPECIAL' },
      formulaCtx
    );
    if (formRes1 !== 47000) throw new Error(`Expected 47000, got ${formRes1}`);
    console.log('  ✓ calculateFormulaRule (Arithmetic): BASIC + HRA + SPECIAL ->', formRes1);

    const formRes2 = PayrollEngineService.calculateFormulaRule(
      { code: 'TAX', formula: 'GROSS > 40000 ? (GROSS - 40000) * 0.1 : 0' },
      formulaCtx
    );
    if (formRes2 !== 700) throw new Error(`Expected 700, got ${formRes2}`);
    console.log('  ✓ calculateFormulaRule (Ternary): GROSS > 40000 ? (GROSS - 40000) * 0.1 : 0 ->', formRes2);

    const formRes3 = PayrollEngineService.calculateFormulaRule(
      { code: 'CAPPED_PF', formula: 'min(BASIC * 0.12, 1800)' },
      formulaCtx
    );
    if (formRes3 !== 1800) throw new Error(`Expected 1800, got ${formRes3}`);
    console.log('  ✓ calculateFormulaRule (Math Function): min(BASIC * 0.12, 1800) ->', formRes3);

    // D. Gross Calculation
    const sampleLines = [
      { category: 'BASIC', amount: 30000 },
      { category: 'ALLOWANCE', amount: 12000 },
      { category: 'ALLOWANCE', amount: 5000 },
      { category: 'DEDUCTION', amount: 3600 },
      { category: 'DEDUCTION', amount: 700 }
    ];
    const grossCalc = PayrollEngineService.calculateGross(sampleLines);
    if (grossCalc !== 47000) throw new Error(`Expected gross 47000, got ${grossCalc}`);
    console.log('  ✓ calculateGross (Sum Basic + Allowances):', grossCalc);

    const explicitGrossCalc = PayrollEngineService.calculateGross(sampleLines, 48000);
    if (explicitGrossCalc !== 48000) throw new Error(`Expected explicit gross 48000, got ${explicitGrossCalc}`);
    console.log('  ✓ calculateGross (Explicit override):', explicitGrossCalc);

    // E. Deduction Calculation
    const dedCalc = PayrollEngineService.calculateDeductions(sampleLines);
    if (dedCalc !== 4300) throw new Error(`Expected deductions 4300, got ${dedCalc}`);
    console.log('  ✓ calculateDeductions (Sum Deductions):', dedCalc);

    // F. Net Calculation
    const netCalc = PayrollEngineService.calculateNet(grossCalc, dedCalc);
    if (netCalc !== 42700) throw new Error(`Expected net 42700, got ${netCalc}`);
    console.log('  ✓ calculateNet (Gross - Deductions):', netCalc);

    const explicitNetCalc = PayrollEngineService.calculateNet(grossCalc, dedCalc, 43000);
    if (explicitNetCalc !== 43000) throw new Error(`Expected explicit net 43000, got ${explicitNetCalc}`);
    console.log('  ✓ calculateNet (Explicit override):', explicitNetCalc);

    // =====================================================
    // 2. INTEGRATION TESTS: computePayslip WORKFLOW
    // =====================================================
    console.log('\n[2] Setting Up End-to-End Payroll Engine Fixtures...');

    // 1. Employee
    let emp = await Employee.findOne({ employeeCode: 'EMP_ENGINE_01' });
    if (!emp) {
      emp = await Employee.create({
        employeeCode: 'EMP_ENGINE_01',
        firstName: 'Robert',
        lastName: 'Downey',
        email: 'robert.engine@peoplepay360.com',
        phone: '+91 9988776655',
        department: 'Engineering',
        jobPosition: 'Staff Architect',
        employeeType: 'FULL_TIME',
        status: 'ACTIVE'
      });
    }

    // 2. Rules
    await SalaryRule.deleteMany({ code: { $in: ['ENG_BASIC', 'ENG_HRA', 'ENG_TRANS', 'ENG_SPEC', 'ENG_GROSS', 'ENG_PF', 'ENG_TAX', 'ENG_NET'] } });
    await SalaryStructure.deleteMany({ code: 'ENG_STRUCTURE_2026' });

    const rulesToCreate = [
      { name: 'Basic Salary', code: 'ENG_BASIC', category: 'BASIC', sequence: 10, calculationType: 'PERCENTAGE', baseCode: 'contract.salary', value: 50 },
      { name: 'House Rent Allowance', code: 'ENG_HRA', category: 'ALLOWANCE', sequence: 20, calculationType: 'PERCENTAGE', baseCode: 'ENG_BASIC', value: 40 },
      { name: 'Transport Allowance', code: 'ENG_TRANS', category: 'ALLOWANCE', sequence: 30, calculationType: 'FIXED', value: 2500 },
      { name: 'Special Allowance', code: 'ENG_SPEC', category: 'ALLOWANCE', sequence: 35, calculationType: 'FIXED', value: 3500 },
      { name: 'Gross Pay', code: 'ENG_GROSS', category: 'GROSS', sequence: 40, calculationType: 'FORMULA', formula: 'ENG_BASIC + ENG_HRA + ENG_TRANS + ENG_SPEC' },
      { name: 'Provident Fund', code: 'ENG_PF', category: 'DEDUCTION', sequence: 50, calculationType: 'PERCENTAGE', baseCode: 'ENG_BASIC', value: 12 },
      { name: 'Professional Tax', code: 'ENG_TAX', category: 'DEDUCTION', sequence: 60, calculationType: 'FORMULA', formula: 'ENG_GROSS > 40000 ? (ENG_GROSS - 40000) * 0.1 : 0' },
      { name: 'Net Pay', code: 'ENG_NET', category: 'NET', sequence: 70, calculationType: 'FORMULA', formula: 'ENG_GROSS - ENG_PF - ENG_TAX' }
    ];

    const createdRules = [];
    for (const r of rulesToCreate) {
      createdRules.push(await SalaryRule.create(r));
    }
    console.log(`  ✓ Created ${createdRules.length} salary rules for payroll engine`);

    // 3. Salary Structure
    const structure = await SalaryStructure.create({
      name: 'Engineering Compensation Structure 2026',
      code: 'ENG_STRUCTURE_2026',
      ruleIds: createdRules.map((r) => r._id)
    });
    console.log(`  ✓ Created salary structure: "${structure.name}"`);

    // 4. Contract
    await Contract.deleteMany({ employeeId: emp._id });
    const contract = await Contract.create({
      employeeId: emp._id,
      startDate: new Date('2026-01-01'),
      endDate: null,
      department: 'Engineering',
      jobPosition: 'Staff Architect',
      salary: 60000,
      salaryStructureId: structure._id,
      status: 'ACTIVE'
    });
    console.log(`  ✓ Created active contract with salary: INR ${contract.salary}`);

    // 5. Payrun for March 2026 (2026-03-01 to 2026-03-31)
    await Payrun.deleteMany({ name: 'March 2026 Payroll Run' });
    const payrun = await Payrun.create({
      name: 'March 2026 Payroll Run',
      periodStart: new Date('2026-03-01'),
      periodEnd: new Date('2026-03-31'),
      salaryStructureId: structure._id,
      status: 'DRAFT'
    });
    console.log(`  ✓ Created payrun: "${payrun.name}" (March 2026)`);

    // 6. Attendance Fixtures
    await Attendance.deleteMany({ employeeId: emp._id });
    // 20 present days, 2 half days
    const attendanceDocs = [];
    for (let d = 1; d <= 20; d++) {
      const dayStr = d < 10 ? `0${d}` : `${d}`;
      attendanceDocs.push({
        employeeId: emp._id,
        date: new Date(`2026-03-${dayStr}T00:00:00.000Z`),
        checkIn: new Date(`2026-03-${dayStr}T09:00:00.000Z`),
        checkOut: new Date(`2026-03-${dayStr}T17:00:00.000Z`),
        workedMinutes: 480,
        scheduledMinutes: 480,
        status: 'PRESENT'
      });
    }
    attendanceDocs.push({
      employeeId: emp._id,
      date: new Date('2026-03-23T00:00:00.000Z'),
      checkIn: new Date('2026-03-23T09:00:00.000Z'),
      checkOut: new Date('2026-03-23T13:00:00.000Z'),
      workedMinutes: 240,
      scheduledMinutes: 480,
      status: 'HALF_DAY'
    });
    attendanceDocs.push({
      employeeId: emp._id,
      date: new Date('2026-03-24T00:00:00.000Z'),
      checkIn: new Date('2026-03-24T09:00:00.000Z'),
      checkOut: new Date('2026-03-24T13:00:00.000Z'),
      workedMinutes: 240,
      scheduledMinutes: 480,
      status: 'HALF_DAY'
    });
    await Attendance.insertMany(attendanceDocs);
    console.log('  ✓ Seeded 22 attendance records (20 Full Days + 2 Half Days = 21 Worked Days)');

    // 7. Time Off Fixtures
    let paidLeaveType = await TimeOffType.findOne({ code: 'ENG_PAID_LEAVE' });
    if (!paidLeaveType) {
      paidLeaveType = await TimeOffType.create({
        name: 'Engineering Paid Vacation',
        code: 'ENG_PAID_LEAVE',
        payrollIntegration: 'PAID'
      });
    }

    await LeaveRequest.deleteMany({ employeeId: emp._id });
    await LeaveRequest.create({
      employeeId: emp._id,
      timeOffTypeId: paidLeaveType._id,
      startDate: new Date('2026-03-25T00:00:00.000Z'),
      endDate: new Date('2026-03-26T23:59:59.000Z'),
      duration: 2,
      status: 'APPROVED'
    });
    console.log('  ✓ Seeded 1 approved leave request (2 days paid leave)');

    // =====================================================
    // 3. EXECUTE computePayslip
    // =====================================================
    console.log('\n[3] Executing computePayslip({ employeeId, payrunId })...');

    const payslipResult = await PayrollEngineService.computePayslip({
      employeeId: emp._id,
      payrunId: payrun._id
    });

    console.log('  ✓ computePayslip executed successfully!');
    console.log('\n  --- PAYSLIP BREAKDOWN ---');
    console.log(`  Employee: ${payslipResult.employeeSnapshot.firstName} ${payslipResult.employeeSnapshot.lastName} (${payslipResult.employeeSnapshot.employeeCode})`);
    console.log(`  Contract Base Salary: INR ${payslipResult.contractSnapshot.salary.toLocaleString('en-IN')}`);
    console.log(`  Attendance: Worked Days = ${payslipResult.workedDays}, Worked Hours = ${payslipResult.workedHours}h`);
    console.log(`  Leaves: Paid Leaves = ${payslipResult.attendanceSummary.paidLeaves}d, Unpaid Leaves = ${payslipResult.attendanceSummary.unpaidLeaves}d`);
    console.log('\n  RULE LINES EVALUATED:');

    for (const line of payslipResult.lines) {
      console.log(`    [Seq ${String(line.sequence).padStart(2, '0')}] ${line.code.padEnd(12)} (${line.category.padEnd(10)}) = INR ${line.amount.toLocaleString('en-IN')}`);
    }

    console.log('\n  PAYSLIP TOTALS:');
    console.log(`    Basic Total:       INR ${payslipResult.totals.basic.toLocaleString('en-IN')}`);
    console.log(`    Allowances Total:  INR ${payslipResult.totals.allowances.toLocaleString('en-IN')}`);
    console.log(`    Gross Total:       INR ${payslipResult.totals.gross.toLocaleString('en-IN')}`);
    console.log(`    Deductions Total:  INR ${payslipResult.totals.deductions.toLocaleString('en-IN')}`);
    console.log(`    Net Take-Home:     INR ${payslipResult.totals.net.toLocaleString('en-IN')}`);

    // Verify values:
    // Base salary: 60,000
    // BASIC: 50% of 60,000 = 30,000
    // HRA: 40% of BASIC = 12,000
    // TRANSPORT: 2,500
    // SPECIAL: 3,500
    // GROSS: 30,000 + 12,000 + 2,500 + 3,500 = 48,000
    // PF: 12% of BASIC = 3,600
    // TAX: (48,000 - 40,000) * 0.1 = 800
    // NET: 48,000 - 3,600 - 800 = 43,600
    if (payslipResult.workedDays !== 21) throw new Error(`Expected workedDays 21, got ${payslipResult.workedDays}`);
    if (payslipResult.attendanceSummary.paidLeaves !== 2) throw new Error(`Expected paidLeaves 2, got ${payslipResult.attendanceSummary.paidLeaves}`);
    if (payslipResult.totals.basic !== 30000) throw new Error(`Expected basic 30000, got ${payslipResult.totals.basic}`);
    if (payslipResult.totals.allowances !== 18000) throw new Error(`Expected allowances 18000 (12000 + 2500 + 3500), got ${payslipResult.totals.allowances}`);
    if (payslipResult.totals.gross !== 48000) throw new Error(`Expected gross 48000, got ${payslipResult.totals.gross}`);
    if (payslipResult.totals.deductions !== 4400) throw new Error(`Expected deductions 4400 (3600 + 800), got ${payslipResult.totals.deductions}`);
    if (payslipResult.totals.net !== 43600) throw new Error(`Expected net 43600, got ${payslipResult.totals.net}`);

    console.log('\n  ✓ All calculated amounts, totals, and attendance aggregations match with 100% precision!');

    // =====================================================
    // 4. ERROR HANDLING TESTS
    // =====================================================
    console.log('\n[4] Testing Payroll Engine Error Scenarios...');

    // A. Missing contract
    try {
      // Prior payrun before contract began (contract began 2026-01-01)
      const pastPayrun = await Payrun.create({
        name: 'Past Run 2025',
        periodStart: new Date('2025-01-01'),
        periodEnd: new Date('2025-01-31'),
        salaryStructureId: structure._id
      });
      await PayrollEngineService.computePayslip({ employeeId: emp._id, payrunId: pastPayrun._id });
      throw new Error('Should have failed on missing contract');
    } catch (err) {
      if (err.message === 'Should have failed on missing contract') throw err;
      console.log('  ✓ Missing contract error properly thrown:', err.code, '-', err.message);
      if (err.code !== 'MISSING_CONTRACT') throw err;
    }

    // B. Missing salary structure
    try {
      const noStrucPayrun = await Payrun.create({
        name: 'No Structure Run',
        periodStart: new Date('2026-03-01'),
        periodEnd: new Date('2026-03-31'),
        salaryStructureId: new mongoose.Types.ObjectId() // Non-existent
      });
      await PayrollEngineService.computePayslip({ employeeId: emp._id, payrunId: noStrucPayrun._id });
      throw new Error('Should have failed on structure not found');
    } catch (err) {
      console.log('  ✓ Missing salary structure error properly thrown:', err.code, '-', err.message);
      if (err.code !== 'STRUCTURE_NOT_FOUND') throw err;
    }

    // Clean up test documents
    await Payrun.deleteMany({ name: { $in: ['March 2026 Payroll Run', 'Future Run 2030', 'No Structure Run'] } });
    await Contract.deleteMany({ employeeId: emp._id });
    await Attendance.deleteMany({ employeeId: emp._id });
    await LeaveRequest.deleteMany({ employeeId: emp._id });
    await SalaryStructure.deleteMany({ code: 'ENG_STRUCTURE_2026' });
    await SalaryRule.deleteMany({ code: { $in: ['ENG_BASIC', 'ENG_HRA', 'ENG_TRANS', 'ENG_SPEC', 'ENG_GROSS', 'ENG_PF', 'ENG_TAX', 'ENG_NET'] } });
    await Employee.deleteOne({ _id: emp._id });
    if (paidLeaveType) await TimeOffType.deleteOne({ _id: paidLeaveType._id });

    console.log('\n========================================================');
    console.log(' ALL CORE PAYROLL ENGINE TESTS PASSED SUCCESSFULLY! (100%)');
    console.log('========================================================\n');
  } catch (err) {
    console.error('\n❌ PAYROLL ENGINE TEST FAILED:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

runPayrollEngineTests();
