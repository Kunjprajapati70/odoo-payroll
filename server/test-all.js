const { execSync } = require('child_process');

console.log('========================================================');
console.log(' RUNNING COMPLETE PEOPLEPAY360 BACKEND TEST SUITE');
console.log('========================================================\n');

const testScripts = [
  { name: '1. Health Check Endpoint', file: 'test-health.js' },
  { name: '2. Mongoose Models & Schemas', file: 'test-models.js' },
  { name: '3. Authentication & RBAC', file: 'test-auth.js' },
  { name: '4. Employee, Contract & Schedule Modules', file: 'test-hr-modules.js' },
  { name: '5. Attendance & Time Off Modules', file: 'test-attendance-timeoff.js' }
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
console.log(' ALL 5 TEST SUITES COMPLETED AND PASSED WITH 100%!');
console.log('========================================================\n');
