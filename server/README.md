# PeoplePay360 HR & Payroll - Backend Documentation

PeoplePay360 is a production-grade, enterprise Human Resource and Payroll management backend built with **Node.js, Express.js, MongoDB (Mongoose), JWT authentication, Nodemailer, and PDFKit**.

---

## 🏗 System Architecture

The project strictly implements an **MVC + Service** architecture with zero evaluation (`eval`) of payroll formulas:

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js             # MongoDB Mongoose connection
│   │   └── env.js            # Environment variables configuration
│   │
│   ├── constants/            # Role definitions and system constants
│   ├── models/               # 12 Mongoose Schemas with compound indexes
│   ├── controllers/          # HTTP request/response handlers only
│   ├── services/             # Pure business logic and domain processing
│   │   ├── payrollEngine.service.js   # Isolated sequential payroll calculation
│   │   ├── contract.service.js        # Historical contract period resolver
│   │   ├── payrun.service.js          # Two-step payrun state machine
│   │   ├── pdf.service.js             # PDFKit printable payslip renderer
│   │   ├── email.service.js           # Nodemailer individual & bulk dispatcher
│   │   └── dashboard.service.js       # Real-time MongoDB analytics aggregations
│   │
│   ├── routes/               # Express routing mounted under /api/v1
│   ├── middleware/           # auth.middleware.js, role.middleware.js, error.middleware.js
│   ├── validators/           # Express-validator schemas
│   ├── utils/                # safeCalculator.util.js (AST Parser), response.util.js
│   ├── seed/                 # Seed scripts for role fixtures
│   ├── app.js                # Express app setup, CORS, Helmet, Morgan
│   └── server.js             # Server lifecycle & graceful shutdown
│
├── postman_collection.json   # Exportable Postman collection
├── test-all.js               # Complete 11-suite automated test suite
├── package.json
└── README.md
```

---

## 🛢️ Prerequisites & MongoDB Setup

### 1. Requirements
- **Node.js**: v18+ or v20+ LTS
- **MongoDB**: Local Community Server running at `mongodb://127.0.0.1:27017/peoplepay360`

### 2. Starting Local MongoDB (Windows)
```powershell
# Using Windows Service
Start-Service -Name MongoDB

# Or running mongod directly
mongod --dbpath "C:\data\db"
```

---

## ⚙️ Environment Configuration (`.env`)

Create `.env` in the `backend/` directory:

```env
NODE_ENV=development
PORT=5000
API_PREFIX=/api/v1

# MongoDB
MONGODB_URI=mongodb://127.0.0.1:27017/peoplepay360

# JWT Secrets
JWT_SECRET=peoplepay360_super_secret_jwt_key_2026
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=*

# SMTP (Nodemailer)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=payroll@peoplepay360.com
```

---

## 🚀 Installation & NPM Commands

```powershell
cd backend

# Install dependencies
npm install

# Seed roles and sample credentials
npm run seed

# Run entire test suite (11 complete suites)
npm test

# Run in development mode with auto-reload
npm run dev

# Run in production mode
npm start
```

---

## 👥 Role-Based Access Control (RBAC) Matrix

Server-side authorization is enforced across every endpoint via `authenticate` and `authorize(...roles)`.

| Role | Permissions & Access Scope |
|---|---|
| **`EMPLOYEE`** | Self-service access only: own profile, own check-in/out, own leaves, own payslips and PDF downloads. Restricted from viewing peer records (HTTP 403). |
| **`HR_MANAGER`** | Employee directories, working schedules, employment contracts, attendance tracking, leave allocation & approval. |
| **`PAYROLL_USER`** | Operational payroll tasks: payrun preview, payrun creation, compute payroll engine lines, view computed payslips. |
| **`PAYROLL_MANAGER`**| Full payroll administration: salary structures, salary rules, payrun validation, payment disbursement (`PAID`), bulk payslip emailing, HR operations. |
| **`ADMIN`** | Unrestricted system-wide privileges across all endpoints and actions. |

### Development Test Credentials
| Role | Email | Password |
|---|---|---|
| **ADMIN** | `admin@peoplepay360.com` | `Admin@123456` |
| **HR_MANAGER** | `hrmanager@peoplepay360.com` | `HrManager@123456` |
| **PAYROLL_MANAGER** | `payrollmgr@peoplepay360.com` | `PayrollMgr@123456` |
| **PAYROLL_USER** | `payrolluser@peoplepay360.com` | `PayrollUser@123456` |
| **EMPLOYEE** | `employee@peoplepay360.com` | `Employee@123456` |

---

## 🔄 Two-Step Payrun & State Machine Lifecycle

```
[ Step 1: POST /payruns/preview ]
        │  (Calculates eligible employees; creates ZERO database records)
        ▼
[ Step 2: POST /payruns ]
        │  (Creates Payrun in DRAFT state with selected employees)
        ▼
   ┌─────────┐
   │  DRAFT  │
   └────┬────┘
        │ POST /payruns/:id/compute (Executes Payroll Engine for each employee)
        ▼
   ┌───────────┐
   │ COMPUTED  │
   └────┬──────┘
        │ POST /payruns/:id/validate (Manager review and compliance lock)
        ▼
   ┌───────────┐
   │ VALIDATED │
   └────┬──────┘
        │ POST /payruns/:id/pay (Disbursement & permanent immutability lock)
        ▼
   ┌───────────┐
   │   PAID    │ ──► POST /payruns/:id/send-payslips (Bulk PDF email dispatch)
   └───────────┘
```

---

## 📋 Complete REST API Endpoint Directory

All endpoints are strictly mounted under `/api/v1`.

### 1. Authentication (`/api/v1/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public | Register new user |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user & obtain JWT |
| `GET` | `/api/v1/auth/me` | Authenticated | Retrieve current user profile |
| `POST` | `/api/v1/auth/logout` | Authenticated | Terminate session |
| `PUT` | `/api/v1/auth/change-password` | Authenticated | Update user password |

### 2. Employees (`/api/v1/employees`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/employees` | HR / Payroll / Admin | List employees with filters & pagination |
| `POST` | `/api/v1/employees` | HR / Admin | Create new employee profile |
| `GET` | `/api/v1/employees/:id` | Owner / HR / Admin | Get employee details by ID |
| `PUT` | `/api/v1/employees/:id` | HR / Admin | Update employee profile |
| `DELETE` | `/api/v1/employees/:id` | HR / Admin | Soft-delete / remove employee |
| `PATCH` | `/api/v1/employees/:id/status` | HR / Admin | Update employment status |
| `GET` | `/api/v1/employees/:id/contracts` | Owner / HR / Admin | List contract history for employee |
| `GET` | `/api/v1/employees/:id/attendance`| Owner / HR / Admin | List attendance history for employee |

### 3. Contracts (`/api/v1/contracts`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/contracts` | HR / Payroll / Admin | List all contracts with filters |
| `POST` | `/api/v1/contracts` | HR / Admin | Create contract (with overlap validation) |
| `GET` | `/api/v1/contracts/applicable` | HR / Payroll / Admin | Find applicable contract for period |
| `GET` | `/api/v1/contracts/:id` | HR / Payroll / Admin | Get contract by ID |
| `PUT` | `/api/v1/contracts/:id` | HR / Admin | Update contract terms |
| `DELETE` | `/api/v1/contracts/:id` | HR / Admin | Delete contract |

### 4. Working Schedules (`/api/v1/schedules`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/schedules` | HR / Payroll / Admin | List working schedules |
| `POST` | `/api/v1/schedules` | HR / Admin | Create working schedule |
| `GET` | `/api/v1/schedules/:id` | HR / Payroll / Admin | Get schedule by ID |
| `PUT` | `/api/v1/schedules/:id` | HR / Admin | Update working schedule |
| `DELETE` | `/api/v1/schedules/:id` | HR / Admin | Delete working schedule |

### 5. Attendance (`/api/v1/attendance`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/attendance/check-in` | Authenticated | Employee daily check-in (grace period audit) |
| `POST` | `/api/v1/attendance/check-out`| Authenticated | Employee daily check-out (overtime audit) |
| `GET` | `/api/v1/attendance` | HR / Payroll / Admin | List attendance records |
| `GET` | `/api/v1/attendance/:id` | HR / Payroll / Admin | Get attendance record by ID |
| `POST` | `/api/v1/attendance` | HR / Admin | Manual attendance entry |
| `PUT` | `/api/v1/attendance/:id` | HR / Admin | Manual attendance correction with reason |

### 6. Time Off & Leaves
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/time-off/types` | Authenticated | List active time off types |
| `POST` | `/api/v1/time-off/types` | HR / Admin | Create time off type |
| `GET` | `/api/v1/leave-allocations` | Owner / HR / Admin | List employee leave balances |
| `POST` | `/api/v1/leave-allocations` | HR / Admin | Grant leave allocation |
| `POST` | `/api/v1/leave-allocations/:id/approve` | HR / Admin | Approve leave allocation |
| `GET` | `/api/v1/leave-requests` | Owner / HR / Admin | List leave requests |
| `POST` | `/api/v1/leave-requests` | Authenticated | Apply for leave (conflict checked) |
| `POST` | `/api/v1/leave-requests/:id/approve` | HR / Admin | Approve leave (atomic balance deduction) |
| `POST` | `/api/v1/leave-requests/:id/refuse` | HR / Admin | Reject leave request |
| `POST` | `/api/v1/leave-requests/:id/cancel` | Owner / HR / Admin | Cancel leave (atomic balance restoration) |

### 7. Salary Rules & Structures
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/salary-rules` | HR / Payroll / Admin | List salary rules |
| `POST` | `/api/v1/salary-rules` | Payroll Mgr / Admin | Create salary rule (AST validation) |
| `GET` | `/api/v1/salary-structures` | HR / Payroll / Admin | List salary structures |
| `POST` | `/api/v1/salary-structures` | Payroll Mgr / Admin | Create structure with sequenced rules |

### 8. Payrun & Payslips
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/payruns/preview` | Payroll / Admin | Step 1: Preview eligible employees |
| `POST` | `/api/v1/payruns` | Payroll / Admin | Step 2: Create DRAFT payrun |
| `GET` | `/api/v1/payruns` | Payroll / Admin | List payruns with totals & status |
| `POST` | `/api/v1/payruns/:id/compute` | Payroll / Admin | Execute sequential payroll calculation |
| `POST` | `/api/v1/payruns/:id/validate` | Payroll Mgr / Admin | Validate payrun (COMPUTED -> VALIDATED) |
| `POST` | `/api/v1/payruns/:id/pay` | Payroll Mgr / Admin | Finalize payment (VALIDATED -> PAID) |
| `POST` | `/api/v1/payruns/:id/send-payslips` | Payroll Mgr / Admin | Bulk email payslips with PDFs attached |
| `GET` | `/api/v1/payslips` | Authenticated | List payslips (Employee sees own only) |
| `GET` | `/api/v1/payslips/:id` | Owner / Payroll / Admin | Get payslip breakdown by ID |
| `GET` | `/api/v1/payslips/:id/pdf` | Owner / Payroll / Admin | Stream printable PDF payslip |
| `POST` | `/api/v1/payslips/:id/email` | Owner / Payroll / Admin | Email individual payslip PDF |

### 9. Payroll Dashboard (`/api/v1/dashboard`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/dashboard` | HR / Payroll / Admin | Executive KPIs, trends, attendance, and alerts |

---

## 💡 Sample Requests & Responses

### 1. Payrun Preview (`POST /api/v1/payruns/preview`)
**Request**:
```json
{
  "salaryStructureId": "6a9bda80b52f231aae3640eb",
  "periodStart": "2026-07-01T00:00:00.000Z",
  "periodEnd": "2026-07-31T23:59:59.000Z"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Payrun preview calculated successfully",
  "data": {
    "salaryStructure": { "name": "Engineering Structure 2026" },
    "periodStart": "2026-07-01T00:00:00.000Z",
    "periodEnd": "2026-07-31T23:59:59.000Z",
    "totalEligible": 1,
    "eligibleEmployees": [
      {
        "employeeId": "6a9bda80b52f231aae3640e7",
        "employeeCode": "E2E_2547",
        "name": "Ananya Sharma",
        "department": "Engineering",
        "salary": 100000
      }
    ]
  }
}
```

### 2. Consolidated Dashboard (`GET /api/v1/dashboard`)
**Response**:
```json
{
  "success": true,
  "message": "Dashboard metrics retrieved successfully",
  "data": {
    "kpis": {
      "totalNetSalaryPaid": 64000,
      "payslipsGenerated": 1,
      "averageSalary": 64000,
      "approvedTimeOff": 2,
      "attendanceHealth": "100%"
    },
    "salaryByDepartment": [
      {
        "department": "Engineering",
        "totalNet": 64000,
        "totalGross": 70000,
        "totalBasic": 50000,
        "totalDeductions": 6000,
        "payslipCount": 1,
        "avgSalary": 64000
      }
    ],
    "monthlySalaryTrend": [
      {
        "year": 2026,
        "month": 7,
        "period": "2026-07",
        "totalNet": 64000,
        "totalGross": 70000,
        "totalDeductions": 6000,
        "payslipsCount": 1
      }
    ],
    "attendanceOverview": {
      "present": 1,
      "late": 0,
      "absent": 0,
      "overtime": 1,
      "missingCheckouts": 0,
      "manualEdits": 0,
      "attendanceCoverage": "100%"
    },
    "timeOffOverview": {
      "approvedDays": 2,
      "pendingRequests": 0,
      "leaveBalances": {
        "allocated": 24,
        "used": 2,
        "remaining": 22
      }
    },
    "departmentBreakdown": [
      {
        "department": "Engineering",
        "employeeCount": 1,
        "activeContractCount": 1,
        "totalBaseWages": 100000
      }
    ],
    "alerts": []
  }
}
```

---

## 🧪 Postman Collection Import

Import [`postman_collection.json`](file:///e:/my%20projects/Odoo%20Final%20Offline/backend/postman_collection.json) directly into Postman. It includes pre-configured environment variables (`{{baseUrl}}`, `{{adminToken}}`, `{{employeeId}}`, etc.) and ready-to-use requests for all 10 core modules.
