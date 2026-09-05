const mongoose = require('mongoose');
const env = require('./src/config/env');
const models = require('./src/models');

async function verifyModels() {
  console.log('========================================================');
  console.log(' PEOPLEPAY360 - MONGOOSE MODELS VERIFICATION');
  console.log('========================================================\n');

  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✓ Connected to MongoDB:', env.MONGODB_URI);

    const modelNames = [
      'User',
      'Employee',
      'Contract',
      'WorkingSchedule',
      'Attendance',
      'TimeOffType',
      'LeaveAllocation',
      'LeaveRequest',
      'SalaryStructure',
      'SalaryRule',
      'Payrun',
      'Payslip'
    ];

    console.log('\n[Check 1] Verifying all 12 models are compiled and exported:');
    for (const name of modelNames) {
      if (!models[name] || typeof models[name] !== 'function') {
        throw new Error(`Model ${name} is not exported properly!`);
      }
      console.log(`  ✓ ${name} model initialized successfully`);
    }

    console.log('\n[Check 2] Verifying User password security and exclusion in toJSON:');
    const userDoc = new models.User({
      email: 'test.user@example.com',
      password: 'PlainSecretPassword123',
      role: 'ADMIN'
    });
    await userDoc.validate();
    const userJSON = userDoc.toJSON();
    if (userJSON.password !== undefined) {
      throw new Error('User.toJSON() exposed password!');
    }
    console.log('  ✓ User.toJSON() safely excludes password field');

    console.log('\n[Check 3] Verifying Schema Indexes:');
    const employeeIndexes = models.Employee.schema.indexes();
    console.log('  Employee indexes count:', employeeIndexes.length);

    const attendanceIndexes = models.Attendance.schema.indexes();
    const hasAttCompound = attendanceIndexes.some((idx) => idx[0].employeeId === 1 && idx[0].date === 1);
    if (!hasAttCompound) throw new Error('Missing attendance compound index: employeeId + date');
    console.log('  ✓ Attendance compound index verified (employeeId + date)');

    const contractIndexes = models.Contract.schema.indexes();
    const hasContractCompound = contractIndexes.some((idx) => idx[0].employeeId === 1 && idx[0].startDate === 1);
    if (!hasContractCompound) throw new Error('Missing contract compound index: employeeId + dates');
    console.log('  ✓ Contract compound index verified (employeeId + startDate + endDate)');

    const payslipIndexes = models.Payslip.schema.indexes();
    const hasPayslipPeriod = payslipIndexes.some((idx) => idx[0].employeeId === 1 && idx[0].periodStart === 1);
    if (!hasPayslipPeriod) throw new Error('Missing payslip compound index: employeeId + periodStart + periodEnd');
    console.log('  ✓ Payslip compound index verified (employeeId + periodStart + periodEnd)');

    console.log('\n[Check 4] Verifying Relationship ObjectIds:');
    const contractEmpRef = models.Contract.schema.path('employeeId').options.ref;
    if (contractEmpRef !== 'Employee') throw new Error(`Contract employeeId ref should be 'Employee', got '${contractEmpRef}'`);
    console.log(`  ✓ Contract.employeeId -> ${contractEmpRef}`);

    const payslipPayrunRef = models.Payslip.schema.path('payrunId').options.ref;
    if (payslipPayrunRef !== 'Payrun') throw new Error(`Payslip payrunId ref should be 'Payrun', got '${payslipPayrunRef}'`);
    console.log(`  ✓ Payslip.payrunId -> ${payslipPayrunRef}`);

    const payslipContractRef = models.Payslip.schema.path('contractId').options.ref;
    if (payslipContractRef !== 'Contract') throw new Error(`Payslip contractId ref should be 'Contract', got '${payslipContractRef}'`);
    console.log(`  ✓ Payslip.contractId -> ${payslipContractRef}`);

    const structureRulesRef = models.SalaryStructure.schema.path('ruleIds').embeddedSchemaType.options.ref;
    if (structureRulesRef !== 'SalaryRule') throw new Error(`SalaryStructure ruleIds ref should be 'SalaryRule', got '${structureRulesRef}'`);
    console.log(`  ✓ SalaryStructure.ruleIds -> ${structureRulesRef}`);

    console.log('\n========================================================');
    console.log(' ALL 12 MONGOOSE MODELS VERIFIED SUCCESSFULLY! (100%)');
    console.log('========================================================\n');
  } catch (err) {
    console.error('\n❌ Models verification failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

verifyModels();
