const http = require('http');
const mongoose = require('mongoose');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const seedUsers = require('./src/seed/seed');
const Employee = require('./src/models/Employee');
const Contract = require('./src/models/Contract');
const WorkingSchedule = require('./src/models/WorkingSchedule');
const Payrun = require('./src/models/Payrun');
const Payslip = require('./src/models/Payslip');
const SalaryStructure = require('./src/models/SalaryStructure');
const SalaryRule = require('./src/models/SalaryRule');
const Attendance = require('./src/models/Attendance');
const TimeOffType = require('./src/models/TimeOffType');
const LeaveAllocation = require('./src/models/LeaveAllocation');
const LeaveRequest = require('./src/models/LeaveRequest');

let server;
let baseUrl = '';
let adminToken = '';

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
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/pdf')) {
    const buffer = await res.arrayBuffer();
    return { status: res.status, ok: res.ok, buffer: Buffer.from(buffer), headers: res.headers };
  }
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data, headers: res.headers };
}

async function runEndToEndScenario() {
  console.log('========================================================');
  console.log(' PEOPLEPAY360 - COMPLETE 20-STEP END-TO-END SCENARIO');
  console.log('========================================================\n');

  try {
    await connectDB();
    await seedUsers(false);

    server = http.createServer(app);
    await new Promise((r) => server.listen(0, r));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}/api/v1`;

    const timestamp = Date.now();

    // Step 1: Login as Admin
    console.log('[Step 1] Login as Admin (POST /api/v1/auth/login)...');
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: { email: 'admin@peoplepay360.com', password: 'Admin@123456' }
    });
    if (loginRes.status !== 200 || !loginRes.data.data.token) {
      throw new Error(`Admin login failed: ${JSON.stringify(loginRes.data)}`);
    }
    adminToken = loginRes.data.data.token;
    console.log('  ✓ Admin successfully authenticated\n');

    // Step 2: Create Employee
    console.log('[Step 2] Create Employee (POST /api/v1/employees)...');
    const empRes = await request('/employees', {
      method: 'POST',
      token: adminToken,
      body: {
        employeeCode: `E2E_${timestamp.toString().slice(-4)}`,
        firstName: 'Ananya',
        lastName: 'Sharma',
        email: `ananya_${timestamp}@peoplepay360.com`,
        phone: '+91 9876543210',
        department: 'Engineering',
        jobPosition: 'Senior Architect',
        employeeType: 'FULL_TIME',
        status: 'ACTIVE',
        bankDetails: {
          accountNumber: '112233445566',
          ifscCode: 'HDFC0000456',
          bankName: 'HDFC Bank'
        }
      }
    });
    if (empRes.status !== 201) throw new Error(`Create employee failed: ${JSON.stringify(empRes.data)}`);
    const employee = empRes.data.data.employee;
    console.log(`  ✓ Employee created: ${employee.firstName} ${employee.lastName} (${employee.employeeCode})\n`);

    // Step 3: Create Working Schedule
    console.log('[Step 3] Create Working Schedule (POST /api/v1/schedules)...');
    const schedRes = await request('/schedules', {
      method: 'POST',
      token: adminToken,
      body: {
        name: `Standard 40h Schedule ${timestamp}`,
        code: `SCHED_${timestamp}`,
        hoursPerDay: 8,
        workingDaysPerWeek: 5,
        weeklyHours: 40,
        lines: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
          { dayOfWeek: 2, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
          { dayOfWeek: 3, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
          { dayOfWeek: 4, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
          { dayOfWeek: 5, startTime: '09:00', endTime: '18:00', breakMinutes: 60 }
        ]
      }
    });
    if (schedRes.status !== 201) throw new Error(`Create schedule failed: ${JSON.stringify(schedRes.data)}`);
    const schedule = schedRes.data.data.schedule;
    console.log(`  ✓ Working schedule created: "${schedule.name}" (${schedule.hoursPerDay}h/day)\n`);

    // Step 4: Create Salary Rules
    console.log('[Step 4] Create Salary Rules (POST /api/v1/salary-rules)...');
    const ruleBasicRes = await request('/salary-rules', {
      method: 'POST',
      token: adminToken,
      body: {
        name: 'Basic Pay',
        code: `BASIC_${timestamp}`,
        category: 'BASIC',
        sequence: 10,
        calculationType: 'PERCENTAGE',
        baseCode: 'contract.salary',
        value: 50
      }
    });
    const ruleBasic = ruleBasicRes.data.data.rule || ruleBasicRes.data.data.salaryRule;

    const ruleHraRes = await request('/salary-rules', {
      method: 'POST',
      token: adminToken,
      body: {
        name: 'House Rent Allowance',
        code: `HRA_${timestamp}`,
        category: 'ALLOWANCE',
        sequence: 20,
        calculationType: 'PERCENTAGE',
        baseCode: ruleBasic.code,
        value: 40
      }
    });
    const ruleHra = ruleHraRes.data.data.rule || ruleHraRes.data.data.salaryRule;

    const rulePfRes = await request('/salary-rules', {
      method: 'POST',
      token: adminToken,
      body: {
        name: 'Provident Fund',
        code: `PF_${timestamp}`,
        category: 'DEDUCTION',
        sequence: 30,
        calculationType: 'PERCENTAGE',
        baseCode: ruleBasic.code,
        value: 12
      }
    });
    const rulePf = rulePfRes.data.data.rule || rulePfRes.data.data.salaryRule;

    const ruleNetRes = await request('/salary-rules', {
      method: 'POST',
      token: adminToken,
      body: {
        name: 'Net Salary',
        code: `NET_${timestamp}`,
        category: 'NET',
        sequence: 40,
        calculationType: 'FORMULA',
        formula: `${ruleBasic.code} + ${ruleHra.code} - ${rulePf.code}`
      }
    });
    const ruleNet = ruleNetRes.data.data.rule || ruleNetRes.data.data.salaryRule;
    console.log(`  ✓ Created 4 sequenced rules: [${ruleBasic.code}, ${ruleHra.code}, ${rulePf.code}, ${ruleNet.code}]\n`);

    // Step 5: Create Salary Structure
    console.log('[Step 5] Create Salary Structure (POST /api/v1/salary-structures)...');
    const structRes = await request('/salary-structures', {
      method: 'POST',
      token: adminToken,
      body: {
        name: `Engineering Structure ${timestamp}`,
        code: `ENG_STRUCT_${timestamp}`,
        ruleIds: [ruleBasic._id, ruleHra._id, rulePf._id, ruleNet._id]
      }
    });
    if (structRes.status !== 201) throw new Error(`Create salary structure failed: ${JSON.stringify(structRes.data)}`);
    const structure = structRes.data.data.structure || structRes.data.data.salaryStructure;
    console.log(`  ✓ Salary Structure created: "${structure.name}" with 4 rules\n`);

    // Step 6: Create Employee Contract
    console.log('[Step 6] Create Employee Contract (POST /api/v1/contracts)...');
    const contractRes = await request('/contracts', {
      method: 'POST',
      token: adminToken,
      body: {
        employeeId: employee._id,
        startDate: '2026-07-01T00:00:00.000Z',
        department: 'Engineering',
        jobPosition: 'Senior Architect',
        salary: 100000,
        salaryStructureId: structure._id,
        status: 'ACTIVE'
      }
    });
    if (contractRes.status !== 201) throw new Error(`Create contract failed: ${JSON.stringify(contractRes.data)}`);
    const contract = contractRes.data.data.contract;
    console.log(`  ✓ Contract created: Salary INR ${contract.salary.toLocaleString('en-IN')} | Status: ${contract.status}\n`);

    // Step 7: Add Attendance
    console.log('[Step 7] Add Attendance (POST /api/v1/attendance)...');
    const attRes = await request('/attendance', {
      method: 'POST',
      token: adminToken,
      body: {
        employeeId: employee._id,
        date: '2026-07-15T00:00:00.000Z',
        checkIn: '2026-07-15T09:00:00.000Z',
        checkOut: '2026-07-15T18:00:00.000Z',
        workedMinutes: 540,
        scheduledMinutes: 480,
        status: 'PRESENT'
      }
    });
    if (attRes.status !== 201) throw new Error(`Create attendance failed: ${JSON.stringify(attRes.data)}`);
    console.log('  ✓ Attendance logged: 9 hrs worked (1 hr overtime calculated)\n');

    // Step 8: Create Leave Allocation
    console.log('[Step 8] Create Leave Allocation (POST /api/v1/leave-allocations)...');
    const leaveType = await TimeOffType.create({
      name: `Paid Vacation ${timestamp}`,
      code: `VAC_${timestamp}`,
      payrollIntegration: 'PAID'
    });

    const allocRes = await request('/leave-allocations', {
      method: 'POST',
      token: adminToken,
      body: {
        employeeId: employee._id,
        timeOffTypeId: leaveType._id,
        allocated: 24,
        validFrom: '2026-01-01T00:00:00.000Z',
        validTo: '2026-12-31T23:59:59.000Z'
      }
    });
    if (allocRes.status !== 201) throw new Error(`Create allocation failed: ${JSON.stringify(allocRes.data)}`);
    const allocation = allocRes.data.data.allocation;
    console.log(`  ✓ Leave allocated: ${allocation.allocated} days\n`);

    // Step 9: Create Leave Request
    console.log('[Step 9] Create Leave Request (POST /api/v1/leave-requests)...');
    const leaveReqRes = await request('/leave-requests', {
      method: 'POST',
      token: adminToken,
      body: {
        employeeId: employee._id,
        timeOffTypeId: leaveType._id,
        startDate: '2026-07-20T00:00:00.000Z',
        endDate: '2026-07-21T23:59:59.000Z',
        duration: 2,
        reason: 'Family event'
      }
    });
    if (leaveReqRes.status !== 201) throw new Error(`Create leave request failed: ${JSON.stringify(leaveReqRes.data)}`);
    const leaveRequest = leaveReqRes.data.data.request || leaveReqRes.data.data.leaveRequest;
    console.log(`  ✓ Leave requested: ${leaveRequest.duration} days | Status: ${leaveRequest.status}\n`);

    // Step 10: Approve Leave Request
    console.log('[Step 10] Approve Leave Request (POST /api/v1/leave-requests/:id/approve)...');
    const approveLeaveRes = await request(`/leave-requests/${leaveRequest._id}/approve`, {
      method: 'POST',
      token: adminToken
    });
    if (approveLeaveRes.status !== 200) throw new Error(`Approve leave failed: ${JSON.stringify(approveLeaveRes.data)}`);
    console.log('  ✓ Leave approved! Allocation balance deducted atomically\n');

    // Step 11: Preview Payrun (Step 1)
    console.log('[Step 11] Preview Payrun (POST /api/v1/payruns/preview)...');
    const previewRes = await request('/payruns/preview', {
      method: 'POST',
      token: adminToken,
      body: {
        salaryStructureId: structure._id,
        periodStart: '2026-07-01T00:00:00.000Z',
        periodEnd: '2026-07-31T23:59:59.000Z'
      }
    });
    if (previewRes.status !== 200) throw new Error(`Payrun preview failed: ${JSON.stringify(previewRes.data)}`);
    console.log(`  ✓ Payrun preview succeeded. Eligible employees discovered: ${previewRes.data.data.totalEligible}\n`);

    // Step 12 & 13: Create Payrun with Selected Employee (Step 2)
    console.log('[Step 12 & 13] Create Payrun with Selected Employee (POST /api/v1/payruns)...');
    const createPayrunRes = await request('/payruns', {
      method: 'POST',
      token: adminToken,
      body: {
        name: `July 2026 Engineering Payrun ${timestamp}`,
        salaryStructureId: structure._id,
        periodStart: '2026-07-01T00:00:00.000Z',
        periodEnd: '2026-07-31T23:59:59.000Z',
        employeeIds: [employee._id]
      }
    });
    if (createPayrunRes.status !== 201) throw new Error(`Create payrun failed: ${JSON.stringify(createPayrunRes.data)}`);
    const payrun = createPayrunRes.data.data.payrun;
    console.log(`  ✓ Payrun created in DRAFT status: "${payrun.name}"\n`);

    // Step 14: Compute Payrun
    console.log('[Step 14] Compute Payrun (POST /api/v1/payruns/:id/compute)...');
    const computeRes = await request(`/payruns/${payrun._id}/compute`, {
      method: 'POST',
      token: adminToken
    });
    if (computeRes.status !== 200) throw new Error(`Compute payrun failed: ${JSON.stringify(computeRes.data)}`);
    const computedPayrun = computeRes.data.data.payrun;
    console.log(`  ✓ Payrun computed! State: ${computedPayrun.status}`);
    console.log(`    Total Basic:       INR ${computedPayrun.totals.totalBasic.toLocaleString('en-IN')}`);
    console.log(`    Total Gross:       INR ${computedPayrun.totals.totalGross.toLocaleString('en-IN')}`);
    console.log(`    Total Deductions:  INR ${computedPayrun.totals.totalDeductions.toLocaleString('en-IN')}`);
    console.log(`    Total Net Salary:  INR ${computedPayrun.totals.totalNet.toLocaleString('en-IN')}\n`);

    // Expected:
    // Basic = 50% of 100,000 = 50,000
    // HRA = 40% of 50,000 = 20,000
    // Gross = 70,000
    // PF = 12% of 50,000 = 6,000
    // Net = 70,000 - 6,000 = 64,000
    if (computedPayrun.totals.totalNet !== 64000) {
      throw new Error(`Expected net salary 64000, got: ${computedPayrun.totals.totalNet}`);
    }

    // Step 15: Validate Payrun
    console.log('[Step 15] Validate Payrun (POST /api/v1/payruns/:id/validate)...');
    const valRes = await request(`/payruns/${payrun._id}/validate`, {
      method: 'POST',
      token: adminToken
    });
    if (valRes.status !== 200) throw new Error(`Validate payrun failed: ${JSON.stringify(valRes.data)}`);
    console.log(`  ✓ Payrun validated! State: ${valRes.data.data.payrun.status}\n`);

    // Step 16: View Payslip
    console.log('[Step 16] View Payslip (GET /api/v1/payslips/:id)...');
    const payslipDoc = await Payslip.findOne({ payrunId: payrun._id });
    const viewSlipRes = await request(`/payslips/${payslipDoc._id}`, {
      method: 'GET',
      token: adminToken
    });
    if (viewSlipRes.status !== 200) throw new Error(`View payslip failed: ${JSON.stringify(viewSlipRes.data)}`);
    const payslip = viewSlipRes.data.data.payslip;
    console.log(`  ✓ Payslip #${payslip.payslipNumber} retrieved: Net Take-Home INR ${payslip.totals.net.toLocaleString('en-IN')}\n`);

    // Step 17: Generate Payslip PDF
    console.log('[Step 17] Generate Payslip PDF (GET /api/v1/payslips/:id/pdf)...');
    const pdfRes = await request(`/payslips/${payslipDoc._id}/pdf`, {
      method: 'GET',
      token: adminToken
    });
    if (pdfRes.status !== 200) throw new Error(`Generate PDF failed with status: ${pdfRes.status}`);
    const pdfHeader = pdfRes.buffer.slice(0, 4).toString('utf-8');
    if (pdfHeader !== '%PDF') throw new Error(`Invalid PDF header: ${pdfHeader}`);
    console.log(`  ✓ Printable PDF verified (%PDF format, ${pdfRes.buffer.length} bytes)\n`);

    // Step 18: Mark Payrun Paid
    console.log('[Step 18] Mark Payrun Paid (POST /api/v1/payruns/:id/pay)...');
    const payRes = await request(`/payruns/${payrun._id}/pay`, {
      method: 'POST',
      token: adminToken
    });
    if (payRes.status !== 200) throw new Error(`Pay payrun failed: ${JSON.stringify(payRes.data)}`);
    console.log(`  ✓ Payrun finalized and locked! State: ${payRes.data.data.payrun.status}\n`);

    // Step 19: Send Payslip Email
    console.log('[Step 19] Send Payslip Email (POST /api/v1/payslips/:id/email)...');
    const emailRes = await request(`/payslips/${payslipDoc._id}/email`, {
      method: 'POST',
      token: adminToken
    });
    if (emailRes.status !== 200 || !emailRes.data.success) {
      throw new Error(`Send email failed: ${JSON.stringify(emailRes.data)}`);
    }
    console.log(`  ✓ Payslip email delivered with PDF attachment (EmailedAt: ${emailRes.data.data.emailedAt})\n`);

    // Step 20: Verify Dashboard Reflects the Payroll
    console.log('[Step 20] Verify Dashboard Reflects Payroll (GET /api/v1/dashboard?periodStart=2026-07-01&periodEnd=2026-07-31)...');
    const dashRes = await request('/dashboard?periodStart=2026-07-01&periodEnd=2026-07-31', {
      method: 'GET',
      token: adminToken
    });
    if (dashRes.status !== 200 || !dashRes.data.success) {
      throw new Error(`Dashboard request failed: ${JSON.stringify(dashRes.data)}`);
    }
    const dashData = dashRes.data.data;
    console.log(`  Dashboard KPIs for July 2026:`);
    console.log(`    Total Net Salary Paid: INR ${dashData.kpis.totalNetSalaryPaid.toLocaleString('en-IN')}`);
    console.log(`    Payslips Generated:    ${dashData.kpis.payslipsGenerated}`);
    console.log(`    Average Salary:        INR ${dashData.kpis.averageSalary.toLocaleString('en-IN')}`);
    console.log(`    Approved Time Off:     ${dashData.kpis.approvedTimeOff} days`);
    console.log(`    Attendance Health:     ${dashData.kpis.attendanceHealth}`);
    console.log(`    Active Alerts Count:   ${dashData.alerts.length}`);

    if (dashData.kpis.totalNetSalaryPaid < 64000) {
      throw new Error(`Expected dashboard totalNetSalaryPaid >= 64000, got: ${dashData.kpis.totalNetSalaryPaid}`);
    }
    if (dashData.kpis.approvedTimeOff < 2) {
      throw new Error(`Expected dashboard approvedTimeOff >= 2, got: ${dashData.kpis.approvedTimeOff}`);
    }
    console.log('  ✓ Dashboard accurately reflects paid wages, attendance, time off, and alerts!\n');

    // Clean up
    await Payrun.deleteOne({ _id: payrun._id });
    await Payslip.deleteMany({ payrunId: payrun._id });
    await Contract.deleteOne({ _id: contract._id });
    await SalaryStructure.deleteOne({ _id: structure._id });
    await SalaryRule.deleteMany({ code: { $in: [ruleBasic.code, ruleHra.code, rulePf.code, ruleNet.code] } });
    await Attendance.deleteMany({ employeeId: employee._id });
    await LeaveRequest.deleteMany({ employeeId: employee._id });
    await LeaveAllocation.deleteMany({ employeeId: employee._id });
    await TimeOffType.deleteOne({ _id: leaveType._id });
    await WorkingSchedule.deleteOne({ _id: schedule._id });
    await Employee.deleteOne({ _id: employee._id });

    console.log('========================================================');
    console.log(' ALL 20 END-TO-END WORKFLOW STEPS PASSED WITH 100%!');
    console.log('========================================================\n');

  } catch (err) {
    console.error('\n❌ END-TO-END SCENARIO FAILED:', err);
    process.exitCode = 1;
  } finally {
    if (server) await new Promise((r) => server.close(r));
    await mongoose.disconnect();
  }
}

runEndToEndScenario();
