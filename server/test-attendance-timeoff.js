const http = require('http');
const mongoose = require('mongoose');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const seedUsers = require('./src/seed/seed');
const env = require('./src/config/env');
const User = require('./src/models/User');
const Employee = require('./src/models/Employee');
const WorkingSchedule = require('./src/models/WorkingSchedule');
const Attendance = require('./src/models/Attendance');
const TimeOffType = require('./src/models/TimeOffType');
const LeaveAllocation = require('./src/models/LeaveAllocation');
const LeaveRequest = require('./src/models/LeaveRequest');

let server;
let baseUrl = '';
let adminToken = '';
let employeeToken = '';
let testEmployee = null;

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
  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('--- STARTING ATTENDANCE & TIME OFF TESTS ---');

  try {
    await connectDB();
    await seedUsers(false);

    // Start HTTP server on dynamic port
    server = http.createServer(app);
    await new Promise((r) => server.listen(0, r));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}/api/v1`;
    // 1. Authenticate Admin and Employee
    console.log('\n[1] Authenticating Admin and Employee...');
    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'admin@peoplepay360.com', password: 'Admin@123456' }
    });
    if (!adminLogin.ok) throw new Error('Admin login failed: ' + JSON.stringify(adminLogin.data));
    adminToken = adminLogin.data.data.token;
    console.log('   Admin logged in successfully');

    const empLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'employee@peoplepay360.com', password: 'Employee@123456' }
    });
    if (!empLogin.ok) throw new Error('Employee login failed: ' + JSON.stringify(empLogin.data));
    employeeToken = empLogin.data.data.token;
    console.log('   Employee logged in successfully');

    // Retrieve test employee
    testEmployee = await Employee.findOne({ email: 'employee@peoplepay360.com' });
    if (!testEmployee) throw new Error('Test employee not found');
    console.log(`   Found test employee ID: ${testEmployee._id}`);

    // Ensure employee has a working schedule
    let schedule = await WorkingSchedule.findOne({ isActive: true });
    if (!schedule) {
      schedule = await WorkingSchedule.create({
        name: 'Standard 40h',
        weeklyHours: 40,
        workingDays: [1, 2, 3, 4, 5],
        lines: [
          { dayOfWeek: 1, dayName: 'Monday', workFrom: '09:00', workTo: '17:00' },
          { dayOfWeek: 2, dayName: 'Tuesday', workFrom: '09:00', workTo: '17:00' },
          { dayOfWeek: 3, dayName: 'Wednesday', workFrom: '09:00', workTo: '17:00' },
          { dayOfWeek: 4, dayName: 'Thursday', workFrom: '09:00', workTo: '17:00' },
          { dayOfWeek: 5, dayName: 'Friday', workFrom: '09:00', workTo: '17:00' }
        ]
      });
    }
    testEmployee.workingScheduleId = schedule._id;
    await testEmployee.save();

    // Clean up test attendance and time off records for this employee
    await Attendance.deleteMany({ employeeId: testEmployee._id });
    await LeaveRequest.deleteMany({ employeeId: testEmployee._id });
    await LeaveAllocation.deleteMany({ employeeId: testEmployee._id });
    await TimeOffType.deleteMany({
      $or: [
        { code: { $in: ['TEST_ANNUAL', 'TEST_SICK'] } },
        { name: { $in: ['Test Annual Leave', 'Test Sick Leave'] } }
      ]
    });

    // ==========================================
    // 2. ATTENDANCE TESTS
    // ==========================================
    console.log('\n[2] Testing Attendance Check-In & Check-Out...');

    // Today's dates: check-in at 09:10 (on time, within 15 min grace period)
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const checkInTime = new Date(`${todayStr}T09:10:00.000Z`);
    const checkOutTime = new Date(`${todayStr}T17:30:00.000Z`);

    const checkInRes = await request('/attendance/check-in', {
      method: 'POST',
      token: employeeToken,
      body: { checkInTime: checkInTime.toISOString() }
    });
    console.log('   Check-in response:', checkInRes.status, checkInRes.data.message);
    if (checkInRes.status !== 200) throw new Error('Check-in failed');
    const attendanceRecord = checkInRes.data.data.attendance;
    console.log(`   isLate: ${attendanceRecord.isLate}, lateMinutes: ${attendanceRecord.lateMinutes}`);

    // Duplicate check-in should fail
    const dupCheckIn = await request('/attendance/check-in', {
      method: 'POST',
      token: employeeToken,
      body: { checkInTime: checkInTime.toISOString() }
    });
    console.log('   Duplicate check-in response status:', dupCheckIn.status, dupCheckIn.data.message);
    if (dupCheckIn.status !== 409) throw new Error('Duplicate check-in should fail with 409');

    // Check-out
    const checkOutRes = await request('/attendance/check-out', {
      method: 'POST',
      token: employeeToken,
      body: { checkOutTime: checkOutTime.toISOString() }
    });
    console.log('   Check-out response:', checkOutRes.status, checkOutRes.data.message);
    if (checkOutRes.status !== 200) throw new Error('Check-out failed');
    const completedAttendance = checkOutRes.data.data.attendance;
    console.log(`   workedMinutes: ${completedAttendance.workedMinutes}, scheduledMinutes: ${completedAttendance.scheduledMinutes}, overtimeMinutes: ${completedAttendance.overtimeMinutes}, status: ${completedAttendance.status}`);

    if (completedAttendance.workedMinutes !== 500) { // 9:10 to 17:30 = 8h 20m = 500m
      throw new Error(`Expected workedMinutes 500, got ${completedAttendance.workedMinutes}`);
    }

    // Manual Attendance update with correctionReason
    console.log('\n[3] Testing Manual Attendance Correction (Audit Log)...');
    const updateRes = await request(`/attendance/${completedAttendance._id}`, {
      method: 'PUT',
      token: adminToken,
      body: {
        status: 'PRESENT',
        correctionReason: 'Adjusted worked minutes due to approved system glitch'
      }
    });
    console.log('   Manual update status:', updateRes.status, updateRes.data.message);
    if (updateRes.status !== 200) throw new Error('Manual update failed');
    const updatedRecord = updateRes.data.data.attendance;
    if (!updatedRecord.correctedBy || updatedRecord.correctionReason !== 'Adjusted worked minutes due to approved system glitch') {
      throw new Error('Audit fields not properly populated');
    }
    console.log('   Audit logged successfully:', {
      correctedBy: updatedRecord.correctedBy,
      correctionReason: updatedRecord.correctionReason
    });

    // Employee history access
    const empAttRes = await request(`/employees/${testEmployee._id}/attendance`, {
      method: 'GET',
      token: employeeToken
    });
    console.log('   Employee self attendance records:', empAttRes.status, empAttRes.data.data.attendance.length);
    if (empAttRes.status !== 200 || empAttRes.data.data.attendance.length === 0) {
      throw new Error('Employee should be able to view their own attendance');
    }

    // ==========================================
    // 4. TIME OFF TYPES & ALLOCATIONS
    // ==========================================
    console.log('\n[4] Testing Time Off Types & Leave Allocation...');
    const typeRes = await request('/time-off/types', {
      method: 'POST',
      token: adminToken,
      body: {
        name: 'Test Annual Leave',
        code: 'TEST_ANNUAL',
        isPaid: true,
        requiresApproval: true
      }
    });
    console.log('   Create TimeOffType:', typeRes.status, typeRes.data.message);
    if (typeRes.status !== 201) throw new Error('TimeOffType creation failed');
    const timeOffType = typeRes.data.data.type;

    // Create Leave Allocation of 10 days
    const allocRes = await request('/leave-allocations', {
      method: 'POST',
      token: adminToken,
      body: {
        employeeId: testEmployee._id,
        timeOffTypeId: timeOffType._id,
        allocated: 10,
        effectiveFrom: '2026-01-01',
        effectiveTo: '2026-12-31'
      }
    });
    console.log('   Create LeaveAllocation:', allocRes.status, allocRes.data.message);
    if (allocRes.status !== 201) throw new Error('LeaveAllocation creation failed');
    const allocation = allocRes.data.data.allocation;
    console.log(`   Initial status: ${allocation.status}, allocated: ${allocation.allocated}, remaining: ${allocation.remaining}`);

    // Approve Leave Allocation
    const approveAllocRes = await request(`/leave-allocations/${allocation._id}/approve`, {
      method: 'POST',
      token: adminToken
    });
    console.log('   Approve LeaveAllocation:', approveAllocRes.status, approveAllocRes.data.message);
    if (approveAllocRes.status !== 200) throw new Error('Approve allocation failed');
    if (approveAllocRes.data.data.allocation.status !== 'APPROVED') throw new Error('Allocation not APPROVED');

    // ==========================================
    // 5. LEAVE REQUESTS & ATOMIC BALANCE DEDUCTION
    // ==========================================
    console.log('\n[5] Testing Leave Requests & Atomic Balance Deduction...');

    // Request 3 days leave: 2026-10-05 to 2026-10-07
    const leaveReq1 = await request('/leave-requests', {
      method: 'POST',
      token: employeeToken,
      body: {
        timeOffTypeId: timeOffType._id,
        startDate: '2026-10-05T00:00:00.000Z',
        endDate: '2026-10-07T23:59:59.000Z',
        duration: 3,
        notes: 'Annual vacation trip'
      }
    });
    console.log('   Submit LeaveRequest (3 days):', leaveReq1.status, leaveReq1.data.message);
    if (leaveReq1.status !== 201) throw new Error('Leave request 1 submission failed');
    const req1 = leaveReq1.data.data.request;

    // Overlapping Leave Request test (should fail with 409)
    console.log('\n[6] Testing Overlap Prevention...');
    const overlapReq = await request('/leave-requests', {
      method: 'POST',
      token: employeeToken,
      body: {
        timeOffTypeId: timeOffType._id,
        startDate: '2026-10-06T00:00:00.000Z', // Overlaps Oct 5 - Oct 7
        endDate: '2026-10-08T23:59:59.000Z',
        duration: 3
      }
    });
    console.log('   Overlap request response status:', overlapReq.status, overlapReq.data.message);
    if (overlapReq.status !== 409) throw new Error('Overlapping leave request should return 409');

    // Insufficient balance check (Try requesting 15 days when only 10 allocated)
    console.log('\n[7] Testing Insufficient Balance...');
    const excessReq = await request('/leave-requests', {
      method: 'POST',
      token: employeeToken,
      body: {
        timeOffTypeId: timeOffType._id,
        startDate: '2026-11-01T00:00:00.000Z',
        endDate: '2026-11-20T23:59:59.000Z',
        duration: 15
      }
    });
    console.log('   Excess balance response status:', excessReq.status, excessReq.data.message);
    if (excessReq.status !== 422) throw new Error('Excess leave duration should return 422');

    // Approve first leave request (3 days)
    console.log('\n[8] Approving Leave Request & Checking Atomic Balance Deduction...');
    const approveReq1 = await request(`/leave-requests/${req1._id}/approve`, {
      method: 'POST',
      token: adminToken
    });
    console.log('   Approve LeaveRequest:', approveReq1.status, approveReq1.data.message);
    if (approveReq1.status !== 200) throw new Error('Approve leave request failed');
    if (approveReq1.data.data.request.status !== 'APPROVED') throw new Error('Request status should be APPROVED');

    // Verify allocation updated atomically: used should be 3, remaining should be 7
    const checkAlloc = await LeaveAllocation.findById(allocation._id);
    console.log(`   Allocation after approval: allocated=${checkAlloc.allocated}, used=${checkAlloc.used}, remaining=${checkAlloc.remaining}`);
    if (checkAlloc.used !== 3 || checkAlloc.remaining !== 7) {
      throw new Error(`Expected used=3, remaining=7; got used=${checkAlloc.used}, remaining=${checkAlloc.remaining}`);
    }

    // Cancel approved leave request -> balance must be restored
    console.log('\n[9] Cancelling Leave Request & Checking Balance Restoration...');
    const cancelReq1 = await request(`/leave-requests/${req1._id}/cancel`, {
      method: 'POST',
      token: employeeToken
    });
    console.log('   Cancel response:', cancelReq1.status, cancelReq1.data.message);
    if (cancelReq1.status !== 200) throw new Error('Cancel leave request failed');

    const checkAllocAfterCancel = await LeaveAllocation.findById(allocation._id);
    console.log(`   Allocation after cancel: allocated=${checkAllocAfterCancel.allocated}, used=${checkAllocAfterCancel.used}, remaining=${checkAllocAfterCancel.remaining}`);
    if (checkAllocAfterCancel.used !== 0 || checkAllocAfterCancel.remaining !== 10) {
      throw new Error(`Expected balance restored to used=0, remaining=10; got used=${checkAllocAfterCancel.used}, remaining=${checkAllocAfterCancel.remaining}`);
    }

    console.log('\nALL ATTENDANCE & TIME OFF TESTS PASSED SUCCESSFULLY!');
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
