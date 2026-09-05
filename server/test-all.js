const { execSync } = require('child_process');

console.log('========================================================');
console.log(' RUNNING COMPLETE PEOPLEPAY360 BACKEND TEST SUITE');
console.log('========================================================\n');

const testScripts = [
  { name: '1. Health Check Endpoint', file: 'test-health.js' },
  { name: '2. Mongoose Models & Schemas', file: 'test-models.js' },
  { name: '3. Authentication & RBAC', file: 'test-auth.js' },
  { name: '4. Employee, Contract & Schedule Modules', file: 'test-hr-modules.js' },
  { name: '5. Attendance & Time Off Modules', file: 'test-attendance-timeoff.js' },
  { name: '6. Salary Structures & Salary Rules Modules', file: 'test-salary-modules.js' },
  { name: '7. Core Payroll Engine Service', file: 'test-payroll-engine.js' },
  { name: '8. Payrun, Payslip & Validation Modules', file: 'test-payruns-payslips.js' },
  { name: '9. Payslip PDF Generation & Email Delivery', file: 'test-pdf-email.js' },
  { name: '10. Payroll Dashboard APIs', file: 'test-dashboard.js' },
  { name: '11. 20-Step End-to-End Lifecycle Scenario', file: 'test-e2e-scenario.js' }
];

for (const test of testScripts) {
  console.log(`\n>>> Running: ${test.name} (${test.file})...`);
  try {
    execSync(`node ${test.file}`, { stdio: 'inherit', cwd: __dirname });
    console.log(`✓ ${test.name} Passed!`);
  } catch (err) {
    console.error(`\n❌ ${test.name} Failed!`);
    process.exit(1);
  }
}

console.log('\n========================================================');
console.log(' ALL 11 TEST SUITES COMPLETED AND PASSED WITH 100%!');
console.log('========================================================\n');
