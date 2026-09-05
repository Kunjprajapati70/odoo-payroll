const mongoose = require('mongoose');
const env = require('../config/env');
const { ROLES } = require('../constants/roles');
const User = require('../models/User');
const Employee = require('../models/Employee');

const seedUsers = async (shouldDisconnect = true) => {
  console.log('========================================================');
  console.log(' PEOPLEPAY360 - SEEDING ROLES & USERS');
  console.log('========================================================\n');

  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✓ Connected to MongoDB:', env.MONGODB_URI);

    // Clean up users and test employees for fresh idempotent seeding
    await User.deleteMany({});
    console.log('✓ Cleared existing users collection');

    // Create a sample employee record for EMPLOYEE role
    let employeeDoc = await Employee.findOne({ employeeCode: 'EMP001' });
    if (!employeeDoc) {
      employeeDoc = await Employee.create({
        employeeCode: 'EMP001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'employee@peoplepay360.com',
        phone: '+91 9876543210',
        department: 'Engineering',
        jobPosition: 'Software Engineer',
        employeeType: 'FULL_TIME',
        status: 'ACTIVE'
      });
      console.log('✓ Created sample employee EMP001 (John Doe)');
    }

    const seedUsersData = [
      {
        email: 'admin@peoplepay360.com',
        password: 'Admin@123456',
        role: ROLES.ADMIN,
        employeeId: null
      },
      {
        email: 'hrmanager@peoplepay360.com',
        password: 'HrManager@123456',
        role: ROLES.HR_MANAGER,
        employeeId: null
      },
      {
        email: 'payrollmgr@peoplepay360.com',
        password: 'PayrollMgr@123456',
        role: ROLES.PAYROLL_MANAGER,
        employeeId: null
      },
      {
        email: 'payrolluser@peoplepay360.com',
        password: 'PayrollUser@123456',
        role: ROLES.PAYROLL_USER,
        employeeId: null
      },
      {
        email: 'employee@peoplepay360.com',
        password: 'Employee@123456',
        role: ROLES.EMPLOYEE,
        employeeId: employeeDoc._id
      }
    ];

    for (const userData of seedUsersData) {
      const user = await User.create(userData);
      console.log(`  ✓ Seeded User: ${user.email} | Role: ${user.role}`);
    }

    console.log('\n========================================================');
    console.log(' SEEDING COMPLETED SUCCESSFULLY!');
    console.log('========================================================');
    console.log(' Credentials for local development:');
    console.log(' 1. ADMIN:           admin@peoplepay360.com / Admin@123456');
    console.log(' 2. HR_MANAGER:      hrmanager@peoplepay360.com / HrManager@123456');
    console.log(' 3. PAYROLL_MANAGER: payrollmgr@peoplepay360.com / PayrollMgr@123456');
    console.log(' 4. PAYROLL_USER:    payrolluser@peoplepay360.com / PayrollUser@123456');
    console.log(' 5. EMPLOYEE:        employee@peoplepay360.com / Employee@123456');
    console.log('========================================================\n');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    throw err;
  } finally {
    if (shouldDisconnect) {
      await mongoose.disconnect();
    }
  }
};

if (require.main === module) {
  seedUsers().catch(() => process.exit(1));
}

module.exports = seedUsers;
