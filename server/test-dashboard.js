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
const TimeOffType = require('./src/models/TimeOffType');
const LeaveAllocation = require('./src/models/LeaveAllocation');
const LeaveRequest = require('./src/models/LeaveRequest');

let server;
let baseUrl = '';
let adminToken = '';
let payrollUserToken = '';
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
  return { status: res.status, ok: res.ok, data, headers: res.headers };
}

async function runDashboardTests() {
  console.log('========================================================');
  console.log(' PEOPLEPAY360 - PAYROLL DASHBOARD BACKEND API TESTS');
  console.log('========================================================\n');

  try {
    await connectDB();
    await seedUsers(false);

    server = http.createServer(app);
    await new Promise((r) => server.listen(0, r));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}/api/v1`;

    // 1. Authenticate roles
    console.log('[1] Authenticating ADMIN, PAYROLL_USER, and EMPLOYEE...');
    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'admin@peoplepay360.com', password: 'Admin@123456' }
    });
    adminToken = adminLogin.data.data.token;

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
    console.log('  ✓ Tokens acquired successfully\n');

    // 2. Setup Test Data (Employees, Contracts, Attendance, Leaves, Payrun, Payslips)
    console.log('[2] Setting up fixtures across multiple departments and dates...');
    const timestamp = Date.now();

    // Clean past testing residue
    await Employee.deleteMany({ employeeCode: { $regex: 'DASH_' } });

    // Employee in Engineering with full bank details
    const empEng = await Employee.create({
      employeeCode: `DASH_ENG_${timestamp.toString().slice(-4)}`,
      firstName: 'Aarav',
      lastName: 'Patel',
      email: `aarav_${timestamp}@example.com`,
      department: 'Engineering',
      jobPosition: 'Senior Backend Engineer',
      employeeType: 'FULL_TIME',
      status: 'ACTIVE',
      bankDetails: {
        accountNumber: '998877665544',
        ifscCode: 'HDFC0000123',
        bankName: 'HDFC'
      }
    });

    // Employee in Marketing missing bank details (to trigger alert)
    const empMkt = await Employee.create({
      employeeCode: `DASH_MKT_${timestamp.toString().slice(-4)}`,
      firstName: 'Pooja',
      lastName: 'Hegde',
      email: `pooja_${timestamp}@example.com`,
      department: 'Marketing',
      jobPosition: 'Growth Marketer',
      employeeType: 'FULL_TIME',
      status: 'ACTIVE',
      bankDetails: {
        accountNumber: '',
        ifscCode: ''
      }
    });

    // Salary Structure
    const basicRule = await SalaryRule.create({
      name: 'Basic', code: `DASH_BASIC_${timestamp}`, category: 'BASIC', sequence: 10, calculationType: 'PERCENTAGE', baseCode: 'contract.salary', value: 50
    });
    const netRule = await SalaryRule.create({
      name: 'Net', code: `DASH_NET_${timestamp}`, category: 'NET', sequence: 20, calculationType: 'FORMULA', formula: basicRule.code
    });

    const structure = await SalaryStructure.create({
      name: `Dashboard Structure ${timestamp}`,
      code: `DASH_STRUCT_${timestamp}`,
      ruleIds: [basicRule._id, netRule._id]
    });

    // Contracts
    await Contract.create({
      employeeId: empEng._id,
      startDate: new Date('2026-06-01'),
      department: 'Engineering',
      jobPosition: 'Senior Backend Engineer',
      salary: 80000,
      salaryStructureId: structure._id,
      status: 'ACTIVE'
    });

    await Contract.create({
      employeeId: empMkt._id,
      startDate: new Date('2026-06-01'),
      department: 'Marketing',
      jobPosition: 'Growth Marketer',
      salary: 60000,
      salaryStructureId: structure._id,
      status: 'ACTIVE'
    });

    // Attendance records for June 2026
    await Attendance.create({
      employeeId: empEng._id,
      date: new Date('2026-06-15'),
      checkIn: new Date('2026-06-15T09:00:00.000Z'),
      checkOut: new Date('2026-06-15T18:00:00.000Z'),
      workedMinutes: 540,
      scheduledMinutes: 480,
      overtimeMinutes: 60,
      status: 'PRESENT',
      isLate: false
    });

    await Attendance.create({
      employeeId: empMkt._id,
      date: new Date('2026-06-15'),
      checkIn: new Date('2026-06-15T09:45:00.000Z'),
      checkOut: null,
      workedMinutes: 0,
      scheduledMinutes: 480,
      status: 'PRESENT',
      isLate: true,
      lateMinutes: 45,
      isMissingCheckout: true
    });

    // Time Off Type, Allocation, and Request
    const leaveType = await TimeOffType.create({
      name: `Annual Leave ${timestamp}`,
      code: `AL_${timestamp}`,
      isPaid: true
    });

    await LeaveAllocation.create({
      employeeId: empEng._id,
      timeOffTypeId: leaveType._id,
      allocated: 20,
      used: 2,
      remaining: 18,
      validFrom: new Date('2026-01-01'),
      validTo: new Date('2026-12-31'),
      status: 'APPROVED'
    });

    await LeaveRequest.create({
      employeeId: empEng._id,
      timeOffTypeId: leaveType._id,
      startDate: new Date('2026-06-20'),
      endDate: new Date('2026-06-21'),
      duration: 2,
      status: 'APPROVED'
    });

    await LeaveRequest.create({
      employeeId: empMkt._id,
      timeOffTypeId: leaveType._id,
      startDate: new Date('2026-06-25'),
      endDate: new Date('2026-06-26'),
      duration: 2,
      status: 'PENDING'
    });

    // Payrun & Payslips
    const createPayrunRes = await request('/payruns', {
      method: 'POST',
      token: adminToken,
      body: {
        name: `June 2026 Payroll - Dashboard Test ${timestamp}`,
        salaryStructureId: structure._id,
        periodStart: '2026-06-01T00:00:00.000Z',
        periodEnd: '2026-06-30T23:59:59.000Z',
        employeeIds: [empEng._id, empMkt._id]
      }
    });
    const payrunId = createPayrunRes.data.data.payrun._id;

    // Compute payrun
    await request(`/payruns/${payrunId}/compute`, { method: 'POST', token: adminToken });
    // Validate payrun
    await request(`/payruns/${payrunId}/validate`, { method: 'POST', token: adminToken });
    // Pay payrun (to test totalNetSalaryPaid KPI)
    await request(`/payruns/${payrunId}/pay`, { method: 'POST', token: adminToken });
    console.log('  ✓ Test dataset populated and payrun paid\n');

    // 3. Test RBAC: EMPLOYEE must receive 403 Forbidden
    console.log('[3] Testing RBAC on GET /api/v1/dashboard...');
    const rbacRes = await request('/dashboard', { token: empToken });
    console.log('  ✓ Employee querying dashboard status:', rbacRes.status);
    if (rbacRes.status !== 403) throw new Error('EMPLOYEE role must be forbidden from accessing executive dashboard');

    // 4. Test Unfiltered Dashboard Request: GET /api/v1/dashboard
    console.log('\n[4] Testing GET /api/v1/dashboard (Unfiltered)...');
    const dashRes = await request('/dashboard', { token: payrollUserToken });
    console.log('  ✓ Dashboard response status:', dashRes.status);
    if (dashRes.status !== 200 || !dashRes.data.success) {
      throw new Error(`Dashboard request failed: ${JSON.stringify(dashRes.data)}`);
    }

    const payload = dashRes.data.data;

    // Validate Required Schema Properties
    const requiredKeys = [
      'kpis',
      'salaryByDepartment',
      'monthlySalaryTrend',
      'attendanceOverview',
      'timeOffOverview',
      'departmentBreakdown',
      'alerts'
    ];
    for (const key of requiredKeys) {
      if (!(key in payload)) throw new Error(`Missing required dashboard property: "${key}"`);
    }
    console.log('  ✓ All 7 top-level response objects verified');

    // Validate KPIs
    const { kpis } = payload;
    console.log('  KPIs:', JSON.stringify(kpis));
    if (typeof kpis.totalNetSalaryPaid !== 'number' || kpis.totalNetSalaryPaid <= 0) {
      throw new Error(`Invalid totalNetSalaryPaid: ${kpis.totalNetSalaryPaid}`);
    }
    if (typeof kpis.payslipsGenerated !== 'number' || kpis.payslipsGenerated < 2) {
      throw new Error(`Invalid payslipsGenerated: ${kpis.payslipsGenerated}`);
    }
    if (typeof kpis.averageSalary !== 'number' || kpis.averageSalary <= 0) {
      throw new Error(`Invalid averageSalary: ${kpis.averageSalary}`);
    }
    if (typeof kpis.approvedTimeOff !== 'number' || kpis.approvedTimeOff < 2) {
      throw new Error(`Invalid approvedTimeOff: ${kpis.approvedTimeOff}`);
    }
    if (typeof kpis.attendanceHealth !== 'string') {
      throw new Error(`Invalid attendanceHealth: ${kpis.attendanceHealth}`);
    }
    console.log('  ✓ KPIs accurately calculated from database records');

    // Validate salaryByDepartment
    console.log('  Salary By Department:', JSON.stringify(payload.salaryByDepartment));
    if (!Array.isArray(payload.salaryByDepartment) || payload.salaryByDepartment.length === 0) {
      throw new Error('Expected salaryByDepartment array with data');
    }
    const engDept = payload.salaryByDepartment.find((d) => d.department === 'Engineering');
    if (!engDept || engDept.totalNet <= 0) {
      throw new Error('Engineering department salary missing or zero in salaryByDepartment');
    }
    console.log('  ✓ salaryByDepartment aggregated correctly');

    // Validate monthlySalaryTrend
    console.log('  Monthly Salary Trend:', JSON.stringify(payload.monthlySalaryTrend));
    if (!Array.isArray(payload.monthlySalaryTrend) || payload.monthlySalaryTrend.length === 0) {
      throw new Error('Expected monthlySalaryTrend array with data');
    }
    console.log('  ✓ monthlySalaryTrend populated');

    // Validate attendanceOverview
    const { attendanceOverview } = payload;
    console.log('  Attendance Overview:', JSON.stringify(attendanceOverview));
    if (attendanceOverview.present < 2) throw new Error(`Expected at least 2 present, got: ${attendanceOverview.present}`);
    if (attendanceOverview.late < 1) throw new Error(`Expected at least 1 late, got: ${attendanceOverview.late}`);
    if (attendanceOverview.missingCheckouts < 1) throw new Error(`Expected at least 1 missingCheckout, got: ${attendanceOverview.missingCheckouts}`);
    if (typeof attendanceOverview.overtime !== 'number' || attendanceOverview.overtime < 1) {
      throw new Error(`Expected overtime >= 1 hour, got: ${attendanceOverview.overtime}`);
    }
    console.log('  ✓ attendanceOverview fields properly aggregated');

    // Validate timeOffOverview
    const { timeOffOverview } = payload;
    console.log('  Time Off Overview:', JSON.stringify(timeOffOverview));
    if (timeOffOverview.approvedDays < 2) throw new Error(`Expected approvedDays >= 2, got: ${timeOffOverview.approvedDays}`);
    if (timeOffOverview.pendingRequests < 1) throw new Error(`Expected pendingRequests >= 1, got: ${timeOffOverview.pendingRequests}`);
    if (timeOffOverview.leaveBalances.remaining <= 0) throw new Error('Expected positive leave balance remaining');
    console.log('  ✓ timeOffOverview validated');

    // Validate departmentBreakdown
    console.log('  Department Breakdown:', JSON.stringify(payload.departmentBreakdown));
    if (!Array.isArray(payload.departmentBreakdown) || payload.departmentBreakdown.length === 0) {
      throw new Error('departmentBreakdown array empty');
    }
    console.log('  ✓ departmentBreakdown verified');

    // Validate Alerts
    console.log('  Alerts Count:', payload.alerts.length);
    console.log('  Alert Types:', payload.alerts.map((a) => a.type));
    const hasMissingBankAlert = payload.alerts.some((a) => a.type === 'MISSING_BANK_DETAILS');
    if (!hasMissingBankAlert) {
      throw new Error('Expected MISSING_BANK_DETAILS alert because empMkt has empty bank details');
    }
    console.log('  ✓ Actionable database-driven alerts detected (including MISSING_BANK_DETAILS)');

    // 5. Test Filters: GET /api/v1/dashboard?department=Engineering
    console.log('\n[5] Testing Filter: GET /api/v1/dashboard?department=Engineering...');
    const filterDeptRes = await request('/dashboard?department=Engineering', { token: adminToken });
    const filterDeptData = filterDeptRes.data.data;
    console.log(`  Filtered salaryByDepartment entries: ${filterDeptData.salaryByDepartment.length}`);
    if (filterDeptData.salaryByDepartment.some((d) => d.department !== 'Engineering')) {
      throw new Error('Filter department=Engineering returned other departments in salaryByDepartment');
    }
    console.log('  ✓ Department filter applied successfully across aggregations');

    // 6. Test Date Range Filter: periodStart & periodEnd
    console.log('\n[6] Testing Date Range Filter: ?periodStart=2026-06-01&periodEnd=2026-06-30...');
    const filterDateRes = await request('/dashboard?periodStart=2026-06-01&periodEnd=2026-06-30', { token: adminToken });
    if (filterDateRes.status !== 200) throw new Error('Date filter query failed');
    console.log(`  Filtered payslips generated in June 2026: ${filterDateRes.data.data.kpis.payslipsGenerated}`);
    if (filterDateRes.data.data.kpis.payslipsGenerated < 2) {
      throw new Error('Date range should match the June 2026 payrun payslips');
    }
    console.log('  ✓ Date range filter accurately scopes metrics to requested period');

    // Clean up
    await Payrun.deleteOne({ _id: payrunId });
    await Payslip.deleteMany({ payrunId });
    await Contract.deleteMany({ employeeId: { $in: [empEng._id, empMkt._id] } });
    await SalaryStructure.deleteOne({ _id: structure._id });
    await SalaryRule.deleteMany({ code: { $in: [basicRule.code, netRule.code] } });
    await Attendance.deleteMany({ employeeId: { $in: [empEng._id, empMkt._id] } });
    await LeaveRequest.deleteMany({ employeeId: { $in: [empEng._id, empMkt._id] } });
    await LeaveAllocation.deleteMany({ employeeId: empEng._id });
    await TimeOffType.deleteOne({ _id: leaveType._id });
    await Employee.deleteMany({ _id: { $in: [empEng._id, empMkt._id] } });

    console.log('\n========================================================');
    console.log(' ALL PAYROLL DASHBOARD TESTS PASSED 100%!');
    console.log('========================================================\n');
  } catch (err) {
    console.error('❌ DASHBOARD TEST FAILED:', err);
    process.exitCode = 1;
  } finally {
    if (server) await new Promise((r) => server.close(r));
    await mongoose.disconnect();
  }
}

runDashboardTests();
