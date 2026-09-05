const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('./src/app');
const env = require('./src/config/env');
const connectDB = require('./src/config/db');
const { authorize, authorizeSelfOrRoles } = require('./src/middleware/role.middleware');
const { authenticate } = require('./src/middleware/auth.middleware');

const seedUsers = require('./src/seed/seed');

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

async function runAuthTests() {
  console.log('========================================================');
  console.log(' PEOPLEPAY360 - AUTHENTICATION & RBAC VERIFICATION');
  console.log('========================================================\n');

  try {
    await connectDB();
    await seedUsers(false);
    server = http.createServer(app);
    await new Promise((r) => server.listen(0, r));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}/api/v1`;

    let employeeToken = '';
    let adminToken = '';
    let hrToken = '';

    // Test 1: Register User
    console.log('[Test 1] Testing POST /api/v1/auth/register...');
    const regEmail = `newuser_${Date.now()}@peoplepay360.com`;
    const regRes = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: regEmail,
        password: 'Password@123',
        role: 'EMPLOYEE'
      })
    });

    if (regRes.status === 201 && regRes.body.success && regRes.body.data.token) {
      console.log('  ✓ User registered successfully (HTTP 201)');
      if (regRes.body.data.user.password !== undefined) {
        throw new Error('Password was exposed in register response!');
      }
      console.log('  ✓ Password safely excluded from response');
    } else {
      throw new Error(`Register failed: ${JSON.stringify(regRes.body)}`);
    }

    // Test 2: Conflict 409 on Duplicate Registration
    console.log('\n[Test 2] Testing 409 CONFLICT on Duplicate Registration...');
    const dupRes = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: regEmail,
        password: 'Password@123'
      })
    });

    if (dupRes.status === 409 && dupRes.body.error.code === 'CONFLICT') {
      console.log(`  ✓ 409 CONFLICT properly returned: "${dupRes.body.message}"`);
    } else {
      throw new Error(`Expected 409 CONFLICT, got: ${dupRes.status} ${JSON.stringify(dupRes.body)}`);
    }

    // Test 3: Validation Error 422 on Invalid Input
    console.log('\n[Test 3] Testing 422 VALIDATION_ERROR on Invalid Input...');
    const valRes = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invalid-email-format',
        password: '123' // too short
      })
    });

    if (valRes.status === 422 && valRes.body.error.code === 'VALIDATION_ERROR') {
      console.log(`  ✓ 422 VALIDATION_ERROR properly returned (${valRes.body.error.details.errors.length} validation errors)`);
    } else {
      throw new Error(`Expected 422 VALIDATION_ERROR, got: ${valRes.status} ${JSON.stringify(valRes.body)}`);
    }

    // Test 4: Login with seeded users & verify JWT payload
    console.log('\n[Test 4] Testing POST /api/v1/auth/login and JWT payload inspection...');
    const empLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'employee@peoplepay360.com',
        password: 'Employee@123456'
      })
    });

    if (empLogin.status === 200 && empLogin.body.data.token) {
      employeeToken = empLogin.body.data.token;
      console.log('  ✓ Employee logged in successfully (HTTP 200)');
      if (empLogin.body.data.user.password !== undefined) {
        throw new Error('Password was exposed in login response!');
      }

      // Verify JWT payload contains userId, role, employeeId
      const decoded = jwt.verify(employeeToken, env.JWT_SECRET);
      console.log('  ✓ Decoded JWT Payload:', {
        userId: decoded.userId,
        role: decoded.role,
        employeeId: decoded.employeeId
      });

      if (!decoded.userId || !decoded.role || !decoded.employeeId) {
        throw new Error('JWT payload missing required fields: userId, role, or employeeId');
      }
      console.log('  ✓ JWT payload correctly includes userId, role, and employeeId');
    } else {
      throw new Error(`Employee login failed: ${JSON.stringify(empLogin.body)}`);
    }

    // Test 5: Login with Wrong Password (401 UNAUTHORIZED)
    console.log('\n[Test 5] Testing 401 UNAUTHORIZED on Invalid Credentials...');
    const badLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'employee@peoplepay360.com',
        password: 'WrongPassword'
      })
    });

    if (badLogin.status === 401 && badLogin.body.error.code === 'UNAUTHORIZED') {
      console.log('  ✓ 401 UNAUTHORIZED returned on bad credentials');
    } else {
      throw new Error(`Expected 401, got: ${badLogin.status}`);
    }

    // Test 6: GET /api/v1/auth/me
    console.log('\n[Test 6] Testing GET /api/v1/auth/me...');
    const meRes = await request('/auth/me', {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });

    if (meRes.status === 200 && meRes.body.data.user.email === 'employee@peoplepay360.com') {
      console.log('  ✓ Profile retrieved successfully:', meRes.body.data.user.email);
      console.log('  ✓ Populated Employee Data:', meRes.body.data.user.employeeId.employeeCode);
      if (meRes.body.data.user.password !== undefined) {
        throw new Error('Password was exposed in /me response!');
      }
    } else {
      throw new Error(`GET /me failed: ${JSON.stringify(meRes.body)}`);
    }

    // Test 7: GET /api/v1/auth/me without Token (401 UNAUTHORIZED)
    const noTokenRes = await request('/auth/me');
    if (noTokenRes.status === 401 && noTokenRes.body.error.code === 'UNAUTHORIZED') {
      console.log('  ✓ 401 UNAUTHORIZED returned when token is missing');
    } else {
      throw new Error(`Expected 401 for missing token, got: ${noTokenRes.status}`);
    }

    // Test 8: PUT /api/v1/auth/change-password
    console.log('\n[Test 8] Testing PUT /api/v1/auth/change-password...');
    const changePassRes = await request('/auth/change-password', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${employeeToken}` },
      body: JSON.stringify({
        currentPassword: 'Employee@123456',
        newPassword: 'NewPassword@2026'
      })
    });

    if (changePassRes.status === 200 && changePassRes.body.success) {
      console.log('  ✓ Password changed successfully');
    } else {
      throw new Error(`Change password failed: ${JSON.stringify(changePassRes.body)}`);
    }

    // Test 9: POST /api/v1/auth/logout
    console.log('\n[Test 9] Testing POST /api/v1/auth/logout...');
    const logoutRes = await request('/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${employeeToken}` }
    });

    if (logoutRes.status === 200 && logoutRes.body.success) {
      console.log('  ✓ Logout successful:', logoutRes.body.message);
    } else {
      throw new Error(`Logout failed: ${JSON.stringify(logoutRes.body)}`);
    }

    // Test 10: RBAC Authorization Middleware Checks
    console.log('\n[Test 10] Testing RBAC Authorization Middleware...');
    // Login Admin
    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@peoplepay360.com',
        password: 'Admin@123456'
      })
    });
    adminToken = adminLogin.body.data.token;

    // Login HR Manager
    const hrLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'hrmanager@peoplepay360.com',
        password: 'HrManager@123456'
      })
    });
    hrToken = hrLogin.body.data.token;

    // A. Employee tries admin route -> should be 403 FORBIDDEN
    const empAdminCheck = await request('/rbac-demo/admin', {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    if (empAdminCheck.status === 403 && empAdminCheck.body.error.code === 'FORBIDDEN') {
      console.log('  ✓ RBAC Guard: Employee correctly blocked from Admin endpoint (HTTP 403 FORBIDDEN)');
    } else {
      throw new Error(`Expected 403, got: ${empAdminCheck.status} ${JSON.stringify(empAdminCheck.body)}`);
    }

    // B. HR Manager tries admin route -> should be 403 FORBIDDEN
    const hrAdminCheck = await request('/rbac-demo/admin', {
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    if (hrAdminCheck.status === 403) {
      console.log('  ✓ RBAC Guard: HR Manager blocked from Admin endpoint (HTTP 403 FORBIDDEN)');
    } else {
      throw new Error(`Expected 403, got: ${hrAdminCheck.status}`);
    }

    // C. HR Manager accesses HR route -> 200 OK
    const hrCheck = await request('/rbac-demo/hr', {
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    if (hrCheck.status === 200) {
      console.log('  ✓ RBAC Guard: HR Manager granted access to HR route (HTTP 200 OK)');
    } else {
      throw new Error(`Expected 200, got: ${hrCheck.status}`);
    }

    // D. Admin accesses HR route -> 200 OK (Admin bypasses restrictions)
    const adminHrCheck = await request('/rbac-demo/hr', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (adminHrCheck.status === 200) {
      console.log('  ✓ RBAC Guard: Admin automatically permitted on HR route (HTTP 200 OK)');
    } else {
      throw new Error(`Expected 200, got: ${adminHrCheck.status}`);
    }

    console.log('\n========================================================');
    console.log(' ALL AUTH & RBAC VERIFICATION TESTS PASSED! (100%)');
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

runAuthTests();
