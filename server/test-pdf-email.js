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

let server;
let baseUrl = '';
let adminToken = '';
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
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/pdf')) {
    const buffer = await res.arrayBuffer();
    return { status: res.status, ok: res.ok, buffer: Buffer.from(buffer), headers: res.headers };
  }
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data, headers: res.headers };
}

async function runPdfEmailTests() {
  console.log('========================================================');
  console.log(' PEOPLEPAY360 - PAYSLIP PDF AND EMAIL DELIVERY TESTS');
  console.log('========================================================\n');

  try {
    await connectDB();
    await seedUsers(false);

    server = http.createServer(app);
    await new Promise((r) => server.listen(0, r));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}/api/v1`;

    // 1. Authenticate
    console.log('[1] Authenticating ADMIN and EMPLOYEE...');
    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'admin@peoplepay360.com', password: 'Admin@123456' }
    });
    adminToken = adminLogin.data.data.token;

    const empLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'employee@peoplepay360.com', password: 'Employee@123456' }
    });
    empToken = empLogin.data.data.token;
    console.log('  ✓ Logged in successfully\n');

    // 2. Setup Fixtures
    console.log('[2] Setting up Salary Rules, Structure, Employees and Contracts...');
    const timestamp = Date.now();
    const basicRule = await SalaryRule.create({
      name: 'Basic Salary', code: `PDF_BASIC_${timestamp}`, category: 'BASIC', sequence: 10, calculationType: 'PERCENTAGE', baseCode: 'contract.salary', value: 60
    });
    const hraRule = await SalaryRule.create({
      name: 'HRA', code: `PDF_HRA_${timestamp}`, category: 'ALLOWANCE', sequence: 20, calculationType: 'PERCENTAGE', baseCode: basicRule.code, value: 40
    });
    const pfRule = await SalaryRule.create({
      name: 'PF Deduction', code: `PDF_PF_${timestamp}`, category: 'DEDUCTION', sequence: 30, calculationType: 'PERCENTAGE', baseCode: basicRule.code, value: 12
    });
    const netRule = await SalaryRule.create({
      name: 'Net Pay', code: `PDF_NET_${timestamp}`, category: 'NET', sequence: 40, calculationType: 'FORMULA', formula: `${basicRule.code} + ${hraRule.code} - ${pfRule.code}`
    });

    const structure = await SalaryStructure.create({
      name: `PDF Email Structure ${timestamp}`,
      code: `PDF_STRUCT_${timestamp}`,
      ruleIds: [basicRule._id, hraRule._id, pfRule._id, netRule._id]
    });

    testEmp1 = await Employee.findOne({ email: 'employee@peoplepay360.com' });
    testEmp2 = await Employee.create({
      employeeCode: `EMP_PDF_02_${timestamp.toString().slice(-4)}`,
      firstName: 'Vikram',
      lastName: 'Nair',
      email: `vikram_pdf_${timestamp}@example.com`,
      department: 'Marketing',
      jobPosition: 'Content Strategist',
      status: 'ACTIVE'
    });

    // Ensure no overlapping or conflict contracts exist for testEmp1 and testEmp2
    await Contract.deleteMany({ employeeId: { $in: [testEmp1._id, testEmp2._id] } });

    await Contract.create({
      employeeId: testEmp1._id,
      startDate: new Date('2026-05-01'),
      department: 'Engineering',
      jobPosition: 'Software Engineer',
      salary: 50000,
      salaryStructureId: structure._id,
      status: 'ACTIVE'
    });

    await Contract.create({
      employeeId: testEmp2._id,
      startDate: new Date('2026-05-01'),
      department: 'Marketing',
      jobPosition: 'Content Strategist',
      salary: 40000,
      salaryStructureId: structure._id,
      status: 'ACTIVE'
    });

    // Clean up any past payslips for testEmp1
    await Payslip.deleteMany({ employeeId: testEmp1._id });

    // Create & Compute Payrun for distinct period
    const createPayrunRes = await request('/payruns', {
      method: 'POST',
      token: adminToken,
      body: {
        name: `Nov 2026 Payrun - PDF Email Test ${timestamp}`,
        salaryStructureId: structure._id,
        periodStart: '2026-11-01T00:00:00.000Z',
        periodEnd: '2026-11-30T23:59:59.000Z',
        employeeIds: [testEmp1._id, testEmp2._id]
      }
    });
    const payrunId = createPayrunRes.data.data.payrun._id;

    const computeRes = await request(`/payruns/${payrunId}/compute`, {
      method: 'POST',
      token: adminToken
    });
    if (computeRes.status !== 200) throw new Error('Payrun computation failed');
    console.log('  ✓ Payrun created and computed successfully\n');

    const payslips = await Payslip.find({ payrunId });
    const emp1Payslip = payslips.find(p => p.employeeId.toString() === testEmp1._id.toString());
    const emp2Payslip = payslips.find(p => p.employeeId.toString() === testEmp2._id.toString());

    // 3. Test PDF API: GET /api/v1/payslips/:id/pdf
    console.log('[3] Testing PDF Download API: GET /api/v1/payslips/:id/pdf...');
    const pdfRes = await request(`/payslips/${emp1Payslip._id}/pdf`, {
      method: 'GET',
      token: empToken
    });

    console.log('  ✓ PDF response status:', pdfRes.status);
    if (pdfRes.status !== 200) throw new Error(`PDF download failed with status: ${pdfRes.status}`);
    if (!pdfRes.buffer || pdfRes.buffer.length < 1000) throw new Error('Invalid or empty PDF buffer returned');

    const pdfHeader = pdfRes.buffer.slice(0, 4).toString('utf-8');
    if (pdfHeader !== '%PDF') throw new Error(`Response is not a valid PDF! Header: ${pdfHeader}`);
    console.log(`  ✓ Verified valid PDF stream received (Size: ${pdfRes.buffer.length} bytes, Header: ${pdfHeader})\n`);

    // 4. Test RBAC on PDF Download
    console.log('[4] Testing RBAC on PDF Download...');
    const rbacPdfRes = await request(`/payslips/${emp2Payslip._id}/pdf`, {
      method: 'GET',
      token: empToken
    });
    console.log('  ✓ Employee blocked from downloading other employee PDF:', rbacPdfRes.status);
    if (rbacPdfRes.status !== 403) throw new Error('Employee must be blocked (403) from downloading others payslip PDF');

    // 5. Test Individual Email Dispatch: POST /api/v1/payslips/:id/email
    console.log('\n[5] Testing Individual Payslip Email: POST /api/v1/payslips/:id/email...');
    const emailRes = await request(`/payslips/${emp1Payslip._id}/email`, {
      method: 'POST',
      token: empToken
    });

    console.log('  ✓ Email API response:', emailRes.status, emailRes.data.message);
    if (emailRes.status !== 200 || !emailRes.data.success) throw new Error('Email send failed');
    if (!emailRes.data.data.emailedAt) throw new Error('Response missing emailedAt');

    const updatedSlip = await Payslip.findById(emp1Payslip._id);
    if (!updatedSlip.emailedAt) throw new Error('Payslip in database does not have emailedAt timestamp');
    console.log('  ✓ Payslip emailedAt persisted successfully in database:', updatedSlip.emailedAt.toISOString());

    // 6. Test Bulk Email Dispatch: POST /api/v1/payruns/:id/send-payslips
    console.log('\n[6] Testing Bulk Email Dispatch: POST /api/v1/payruns/:id/send-payslips...');
    // Payrun state machine check: payrun must be VALIDATED or PAID before sending payslips
    await request(`/payruns/${payrunId}/validate`, {
      method: 'POST',
      token: adminToken
    });

    // Intentionally remove testEmp2 email via $unset to verify bulk delivery fault-tolerance
    await Employee.updateOne({ _id: testEmp2._id }, { $unset: { email: 1 } });

    const bulkRes = await request(`/payruns/${payrunId}/send-payslips`, {
      method: 'POST',
      token: adminToken
    });

    console.log('  ✓ Bulk email status:', bulkRes.status, bulkRes.data.message);
    if (bulkRes.status !== 200) throw new Error(`Bulk send failed: ${JSON.stringify(bulkRes.data)}`);
    const bulkData = bulkRes.data.data;
    console.log('  ✓ Bulk Result:', JSON.stringify({ sent: bulkData.sent, failed: bulkData.failed }));

    if (bulkData.sent !== 1 || bulkData.failed !== 1) {
      throw new Error(`Expected sent=1, failed=1, got sent=${bulkData.sent}, failed=${bulkData.failed}`);
    }
    console.log('  ✓ Verified bulk delivery handles missing email without crashing or halting\n');

    // Clean up
    await Payrun.deleteOne({ _id: payrunId });
    await Payslip.deleteMany({ payrunId });
    await Contract.deleteMany({ employeeId: { $in: [testEmp1._id, testEmp2._id] } });
    await SalaryStructure.deleteOne({ _id: structure._id });
    await SalaryRule.deleteMany({ code: { $in: [basicRule.code, hraRule.code, pfRule.code, netRule.code] } });
    await Employee.deleteOne({ _id: testEmp2._id });

    console.log('========================================================');
    console.log(' ALL PAYSLIP PDF AND EMAIL TESTS PASSED 100%!');
    console.log('========================================================\n');
  } catch (err) {
    console.error('❌ PDF AND EMAIL TEST FAILED:', err);
    process.exitCode = 1;
  } finally {
    if (server) await new Promise((r) => server.close(r));
    await mongoose.disconnect();
  }
}

runPdfEmailTests();
