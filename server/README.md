# PeoplePay360 HR & Payroll - Backend Foundation

Node.js + Express.js backend for PeoplePay360 HR & Payroll system with complete Authentication and Role-Based Access Control (RBAC).

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js          # MongoDB Mongoose connection
│   │   └── env.js         # Environment variables configuration
│   │
│   ├── models/            # 12 Mongoose Schemas (User, Employee, Contract, etc.)
│   ├── controllers/       # HTTP request handlers (auth.controller.js, etc.)
│   ├── services/          # Business logic services (auth.service.js, etc.)
│   ├── routes/            # Express routes (/auth, /rbac-demo, /health)
│   ├── middleware/        # auth.middleware.js, role.middleware.js, error.middleware.js
│   ├── validators/        # Express-validator schemas (auth.validator.js)
│   ├── utils/             # response.util.js
│   ├── seed/              # Database seeder (seed.js)
│   ├── app.js             # Express application configuration
│   └── server.js          # HTTP server bootstrap & graceful shutdown
│
├── .env                   # Environment variables
├── .env.example           # Environment template
├── package.json           # Dependencies and scripts
└── README.md              # Project documentation
```

## ⚙️ Technologies

- **express**: Fast, minimalist web framework
- **mongoose**: MongoDB object modeling
- **dotenv**: Environment variable management
- **cors**: Cross-Origin Resource Sharing
- **helmet**: Secure HTTP headers
- **morgan**: HTTP request logger
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT authentication
- **express-validator**: Schema validation
- **nodemailer**: Email delivery
- **pdfkit**: Payslip PDF rendering
- **dayjs**: Date manipulation
- **nodemon** (dev): Auto-reloading during development

## 🛢️ MongoDB Setup

### 1. Default Connection URI
```
mongodb://127.0.0.1:27017/peoplepay360
```

### 2. How to Start MongoDB Locally (Windows)
If running as a Windows Service:
```powershell
# Check service status
Get-Service -Name MongoDB

# Start service if stopped
Start-Service -Name MongoDB
```
Or start manually via mongod CLI:
```powershell
mongod --dbpath "C:\data\db"
```

## 🚀 Running the Backend

Ensure you are inside the `backend` directory:
```powershell
cd backend
```

### Install dependencies:
```bash
npm install
```

### Seed Roles & Users:
```bash
npm run seed
```

### Run Tests:
```bash
npm test
```

### Start in development mode (with hot reload):
```bash
npm run dev
```

### Start in production mode:
```bash
npm start
```

---

## 🔐 Authentication & RBAC APIs (`/api/v1/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public | Register new user account |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user & receive JWT |
| `GET` | `/api/v1/auth/me` | Authenticated | Retrieve current user profile |
| `POST` | `/api/v1/auth/logout` | Authenticated | Invalidate session |
| `PUT` | `/api/v1/auth/change-password`| Authenticated | Update user password |

### JWT Payload Structure
```json
{
  "userId": "6a9bb4bbd76375cd3d28dcca",
  "role": "EMPLOYEE",
  "employeeId": "6a9bb4bbd76375cd3d28dcc5",
  "iat": 1725515400,
  "exp": 1726120200
}
```

### Error Responses
- **401 UNAUTHORIZED**: Missing, invalid, or expired Bearer token, or bad credentials.
- **403 FORBIDDEN**: Role not authorized or account deactivated.
- **409 CONFLICT**: Registration email already exists.
- **422 VALIDATION_ERROR**: Request payload validation failed (short password, invalid email format, etc.).

---

## 👥 Role Permissions Matrix

- **`EMPLOYEE`**: Access own employee info, own attendance, own leave requests, own payslips.
- **`HR_MANAGER`**: Manage employees, contracts, working schedules, attendance, time off.
- **`PAYROLL_USER`**: Manage payroll processing, payruns, payslips.
- **`PAYROLL_MANAGER`**: Full payroll management, salary structures, salary rules, HR operations.
- **`ADMIN`**: Unrestricted full access across all operations and modules.

---

## 🔑 Test Credentials (Local Development Only)

> **IMPORTANT**: The following credentials are provided strictly for local development and testing.

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@peoplepay360.com` | `Admin@123456` | Full system access |
| **HR_MANAGER** | `hrmanager@peoplepay360.com` | `HrManager@123456` | Employees, contracts, schedules, leaves |
| **PAYROLL_MANAGER** | `payrollmgr@peoplepay360.com` | `PayrollMgr@123456` | Structures, rules, payruns, validation |
| **PAYROLL_USER** | `payrolluser@peoplepay360.com` | `PayrollUser@123456` | Payruns, payslips |
| **EMPLOYEE** | `employee@peoplepay360.com` | `Employee@123456` | Self-service profile, attendance, payslips |

---

## 🩺 Health Check Endpoint

- **Method**: `GET`
- **URL**: `http://localhost:5000/api/v1/health`
- **Expected Response (HTTP 200)**:
```json
{
  "success": true,
  "message": "PeoplePay360 API is running"
}
```
