const http = require('http');
const mongoose = require('mongoose');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const seedUsers = require('./src/seed/seed');
const SalaryStructure = require('./src/models/SalaryStructure');
const SalaryRule = require('./src/models/SalaryRule');
const Contract = require('./src/models/Contract');
const ContractService = require('./src/services/contract.service');

let server;
let baseUrl;

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const body = await response.json().catch(() => ({}));
  return {
    status: response.status,
    body
  };
}

async function runHRTests() {
  console.log('========================================================');
  console.log(' PEOPLEPAY360 - EMPLOYEE, CONTRACT & SCHEDULE TESTS');
  console.log('========================================================\n');

  try {
    await connectDB();
    await seedUsers(false);

    server = http.createServer(app);
    await new Promise((r) => server.listen(0, r));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}/api/v1`;

    let adminToken = '';
    let hrToken = '';
    let employeeToken = '';
    let employeeSelfId = '';

    // Login users
    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@peoplepay360.com', password: 'Admin@123456' })
    });
    adminToken = adminLogin.body.data.token;

    const hrLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'hrmanager@peoplepay360.com', password: 'HrManager@123456' })
    });
    hrToken = hrLogin.body.data.token;

    const empLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'employee@peoplepay360.com', password: 'Employee@123456' })
    });
    employeeToken = empLogin.body.data.token;
    employeeSelfId = empLogin.body.data.user.employeeId._id;

    // Create a dummy salary structure for contracts
    let structure = await SalaryStructure.findOne({ code: 'TEST_STRUCT' });
    if (!structure) {
      structure = await SalaryStructure.create({
        name: 'Test Salary Structure',
        code: 'TEST_STRUCT',
        description: 'For testing contracts'
      });
    }

    // -------------------------------------------------------------
    // 1. WORKING SCHEDULE TESTS
    // -------------------------------------------------------------
    console.log('[Test 1] Testing Schedule API - Auto WeeklyHours Calculation...');
    const scheduleRes = await request('/schedules', {
      method: 'POST',
      headers: { Authorization: `Bearer ${hrToken}` },
      body: JSON.stringify({
        name: `Engineering 40h Schedule - ${Date.now()}`,
        // Mon-Fri: 9:00 to 18:00 (9 hours) minus 60m break = 8h/day * 5 days = 40h
        lines: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
          { dayOfWeek: 2, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
          { dayOfWeek: 3, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
          { dayOfWeek: 4, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
          { dayOfWeek: 5, startTime: '09:00', endTime: '18:00', breakMinutes: 60 }
        ]
      })
    });

    if (scheduleRes.status !== 201) {
      throw new Error(`Create schedule failed: ${JSON.stringify(scheduleRes.body)}`);
    }

    const createdSchedule = scheduleRes.body.data.schedule;
    console.log(`  ✓ Schedule created: "${createdSchedule.name}"`);
    console.log(`  ✓ Calculated weeklyHours: ${createdSchedule.weeklyHours} hours (Verified: 40.00)`);
    if (createdSchedule.weeklyHours !== 40) {
      throw new Error(`Expected weeklyHours to be 40, got ${createdSchedule.weeklyHours}`);
    }

    // -------------------------------------------------------------
    // 2. EMPLOYEE TESTS
    // -------------------------------------------------------------
    console.log('\n[Test 2] Testing Employee Creation & Uniqueness...');
    const newEmpCode = `EMP_${Date.now().toString().slice(-4)}`;
    const empRes = await request('/employees', {
      method: 'POST',
      headers: { Authorization: `Bearer ${hrToken}` },
      body: JSON.stringify({
        employeeCode: newEmpCode,
        firstName: 'Alice',
        lastName: 'Walker',
        email: `alice_${Date.now()}@peoplepay360.com`,
        phone: '+91 9988776655',
        department: 'Engineering',
        jobPosition: 'Staff Frontend Engineer',
        employeeType: 'FULL_TIME',
        workingScheduleId: createdSchedule._id,
        dateOfJoining: '2025-01-15'
      })
    });

    if (empRes.status !== 201) {
      throw new Error(`Create employee failed: ${JSON.stringify(empRes.body)}`);
    }

    const createdEmp = empRes.body.data.employee;
    console.log(`  ✓ Created Employee: ${createdEmp.firstName} ${createdEmp.lastName} (${createdEmp.employeeCode})`);

    // Duplicate check: 409 CONFLICT
    const dupEmpRes = await request('/employees', {
      method: 'POST',
      headers: { Authorization: `Bearer ${hrToken}` },
      body: JSON.stringify({
        employeeCode: newEmpCode,
        firstName: 'Alice Duplicate',
        lastName: 'Walker',
        email: `different_email@peoplepay360.com`,
        department: 'Engineering',
        jobPosition: 'Staff Frontend Engineer'
      })
    });

    if (dupEmpRes.status === 409 && dupEmpRes.body.error.code === 'CONFLICT') {
      console.log('  ✓ Duplicate employeeCode rejected with 409 CONFLICT');
    } else {
      throw new Error(`Expected 409 CONFLICT, got: ${dupEmpRes.status}`);
    }

    // Filters check
    console.log('  Testing employee filters: search & department...');
    const filterRes = await request(`/employees?search=Alice&department=Engineering`, {
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    if (filterRes.status === 200 && filterRes.body.data.employees.length >= 1) {
      console.log(`  ✓ Filters returned ${filterRes.body.data.employees.length} matching employee(s)`);
    } else {
      throw new Error(`Filter test failed: ${JSON.stringify(filterRes.body)}`);
    }

    // Status PATCH
    console.log('  Testing PATCH /employees/:id/status...');
    const statusRes = await request(`/employees/${createdEmp._id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${hrToken}` },
      body: JSON.stringify({ status: 'ON_LEAVE' })
    });
    if (statusRes.status === 200 && statusRes.body.data.employee.status === 'ON_LEAVE') {
      console.log('  ✓ Employee status successfully updated to ON_LEAVE');
    } else {
      throw new Error(`Status update failed: ${JSON.stringify(statusRes.body)}`);
    }

    // Self-Service check: Employee can view own details
    console.log('  Testing Employee Self-Service permission on /employees/:id...');
    const selfRes = await request(`/employees/${employeeSelfId}`, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    if (selfRes.status === 200) {
      console.log('  ✓ Employee permitted to view own profile');
    } else {
      throw new Error(`Expected 200 for self employee, got: ${selfRes.status}`);
    }

    // Employee cannot view someone else's employee record
    const forbiddenRes = await request(`/employees/${createdEmp._id}`, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    if (forbiddenRes.status === 403) {
      console.log('  ✓ Employee blocked from viewing another employee (403 FORBIDDEN)');
    } else {
      throw new Error(`Expected 403, got: ${forbiddenRes.status}`);
    }

    // -------------------------------------------------------------
    // 3. CONTRACT TESTS
    // -------------------------------------------------------------
    console.log('\n[Test 3] Testing Contract APIs & Date Validation...');

    // A. Invalid date range (endDate < startDate)
    const invalidDateContract = await request('/contracts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${hrToken}` },
      body: JSON.stringify({
        employeeId: createdEmp._id,
        startDate: '2026-06-01',
        endDate: '2026-01-01', // Invalid!
        salary: 75000,
        salaryStructureId: structure._id,
        status: 'ACTIVE'
      })
    });

    if (invalidDateContract.status === 422 && invalidDateContract.body.error.code === 'VALIDATION_ERROR') {
      console.log('  ✓ Invalid date range rejected with 422 VALIDATION_ERROR');
    } else {
      throw new Error(`Expected 422, got: ${invalidDateContract.status} ${JSON.stringify(invalidDateContract.body)}`);
    }

    // B. Create primary active contract
    const contract1Res = await request('/contracts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${hrToken}` },
      body: JSON.stringify({
        employeeId: createdEmp._id,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        department: 'Engineering',
        jobPosition: 'Staff Frontend Engineer',
        salary: 75000,
        salaryStructureId: structure._id,
        status: 'ACTIVE'
      })
    });

    if (contract1Res.status !== 201) {
      throw new Error(`Create contract failed: ${JSON.stringify(contract1Res.body)}`);
    }
    const contract1 = contract1Res.body.data.contract;
    console.log(`  ✓ Active contract created (Salary: INR ${contract1.salary})`);

    // C. Overlapping active contract detection
    console.log('  Testing Overlapping Active Contract Detection...');
    const overlapRes = await request('/contracts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${hrToken}` },
      body: JSON.stringify({
        employeeId: createdEmp._id,
        startDate: '2026-06-01', // Overlaps with 2026-01-01 to 2026-12-31!
        endDate: '2027-05-31',
        department: 'Engineering',
        jobPosition: 'Staff Frontend Engineer',
        salary: 85000,
        salaryStructureId: structure._id,
        status: 'ACTIVE'
      })
    });

    if (overlapRes.status === 409 && overlapRes.body.error.code === 'CONTRACT_OVERLAP') {
      console.log('  ✓ Overlapping ACTIVE contract detected and rejected with 409 CONTRACT_OVERLAP');
    } else {
      throw new Error(`Expected 409 CONTRACT_OVERLAP, got: ${overlapRes.status} ${JSON.stringify(overlapRes.body)}`);
    }

    // D. Contract History endpoint
    console.log('  Testing GET /api/v1/employees/:employeeId/contracts...');
    const historyRes = await request(`/employees/${createdEmp._id}/contracts`, {
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    if (historyRes.status === 200 && historyRes.body.data.history.length >= 1) {
      console.log(`  ✓ Contract history retrieved. Active contract salary: INR ${historyRes.body.data.activeContract.salary}`);
    } else {
      throw new Error(`Contract history failed: ${JSON.stringify(historyRes.body)}`);
    }

    // -------------------------------------------------------------
    // 4. APPLICABLE CONTRACT FINDER & CONFLICT DETECTION
    // -------------------------------------------------------------
    console.log('\n[Test 4] Testing findApplicableContract Service...');

    // A. Single matching active contract
    const matchContract = await ContractService.findApplicableContract(
      createdEmp._id,
      '2026-03-01',
      '2026-03-31'
    );
    if (matchContract && matchContract._id.toString() === contract1._id.toString()) {
      console.log('  ✓ Applicable contract successfully located for payroll period (March 2026)');
    } else {
      throw new Error('Failed to find matching contract');
    }

    // B. No matching contract (e.g. year 2020)
    const noContract = await ContractService.findApplicableContract(
      createdEmp._id,
      '2020-01-01',
      '2020-01-31'
    );
    if (noContract === null) {
      console.log('  ✓ Non-overlapping period correctly returned null');
    } else {
      throw new Error('Expected null for non-overlapping period');
    }

    // C. Multiple applicable contracts -> CONTRACT_CONFLICT!
    console.log('  Testing Multiple Applicable Contracts -> CONTRACT_CONFLICT error...');
    // Create a second overlapping historical EXPIRED contract for testing conflict detection
    await Contract.create({
      employeeId: createdEmp._id,
      startDate: new Date('2026-03-15'),
      endDate: new Date('2026-04-15'),
      department: 'Engineering',
      jobPosition: 'Staff Frontend Engineer',
      salary: 80000,
      salaryStructureId: structure._id,
      status: 'EXPIRED'
    });

    try {
      await ContractService.findApplicableContract(
        createdEmp._id,
        '2026-03-01',
        '2026-03-31'
      );
      throw new Error('Expected CONTRACT_CONFLICT error, but none was thrown!');
    } catch (conflictErr) {
      if (conflictErr.code === 'CONTRACT_CONFLICT' && conflictErr.statusCode === 409) {
        console.log(`  ✓ CONTRACT_CONFLICT properly thrown: "${conflictErr.message}"`);
        console.log(`    Conflict Details: Found ${conflictErr.details.applicableCount} conflicting contracts in period.`);
      } else {
        throw conflictErr;
      }
    }

    console.log('\n========================================================');
    console.log(' ALL EMPLOYEE, CONTRACT & SCHEDULE TESTS PASSED! (100%)');
    console.log('========================================================\n');
  } catch (err) {
    console.error('\n❌ Test Suite Failed:', err);
    process.exitCode = 1;
  } finally {
    if (server) {
      await new Promise((r) => server.close(r));
    }
    await mongoose.disconnect();
  }
}

runHRTests();
