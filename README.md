# 🚀 PeoplePay360

## HR & Payroll Management System

PeoplePay360 is a full-stack **HR & Payroll Management System** designed to manage the complete employee lifecycle — from employee onboarding and attendance to leave management, salary configuration, payroll processing, payslip generation, reporting, and automated email delivery.

The system provides **role-based access control (RBAC)** for Admin, HR, Payroll, and Employee users and connects the complete HR-to-payroll workflow through a centralized platform.

---

## 👥 Team

| Area | Team Member |
|---|---|
| 🎨 Frontend | **Kunj Prajapati** |
| ⚙️ Backend | **Vijay Prajapati** |
| 🗄️ Database | **Sumit Prajapati** |
| 🤖 Automation | **Diya Mehta** |

### Team Responsibilities

#### 🎨 Frontend — Kunj Prajapati

- React UI development
- Dashboard and module interfaces
- Routing and protected routes
- API integration
- Role-based UI permissions
- Responsive user experience

#### ⚙️ Backend — Vijay Prajapati

- Node.js / Express REST APIs
- Authentication and authorization
- JWT-based security
- Business logic
- Payroll processing
- Salary calculation engine
- Payrun and payslip workflows
- PDF generation
- Email service integration

#### 🗄️ Database — Sumit Prajapati

- MongoDB database design
- Mongoose models
- Data relationships
- Database persistence
- Database seeding
- Data integrity

#### 🤖 Automation — Diya Mehta

- Email automation
- Payslip email workflow
- Leave notifications
- Welcome emails
- SMTP integration
- Automation workflow planning

---

# 📌 Project Overview

PeoplePay360 connects the complete HR and payroll process into one system.

```text
Employee
   ↓
Contract
   ↓
Working Schedule
   ↓
Attendance / Time Off
   ↓
Salary Structure
   ↓
Salary Rules
   ↓
Pay Run
   ↓
Payslip
   ↓
PDF
   ↓
Email
   ↓
Reports
```

Instead of maintaining separate systems for employees, attendance, leave, salary, payroll, payslips, and reporting, PeoplePay360 provides a centralized workflow.

---

# 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Build Tool | Vite |
| Backend | Node.js |
| API Framework | Express.js |
| Database | MongoDB |
| ODM | Mongoose |
| Authentication | JWT |
| Password Security | bcrypt |
| API Communication | Axios |
| Email | Nodemailer + SMTP |
| PDF | PDF Generation Service |
| Development | Nodemon |

---

# 🏗️ System Architecture

```text
                         ┌─────────────────┐
                         │      USER       │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │ React Frontend  │
                         │     :5173       │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │ Axios / Service │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │   Vite Proxy    │
                         │      /api       │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │ Express Backend │
                         │     :5000       │
                         └────────┬────────┘
                                  │
                 ┌────────────────┼────────────────┐
                 │                │                │
                 ▼                ▼                ▼
          ┌────────────┐   ┌─────────────┐  ┌─────────────┐
          │   Routes   │   │ Middleware  │  │    Auth     │
          └─────┬──────┘   └─────────────┘  └─────────────┘
                │
                ▼
          ┌────────────┐
          │Controllers │
          └─────┬──────┘
                │
                ▼
          ┌────────────┐
          │  Services  │
          └─────┬──────┘
                │
                ▼
          ┌────────────┐
          │  Mongoose  │
          └─────┬──────┘
                │
                ▼
          ┌────────────┐
          │  MongoDB   │
          │peoplepay360│
          └────────────┘

                │
                │ Email
                ▼
          ┌────────────┐
          │ Nodemailer │
          └─────┬──────┘
                │
                ▼
          ┌────────────┐
          │ Gmail SMTP │
          └────────────┘
```

---

# 📂 Project Structure

```text
PeoplePay360/
│
├── client/
│   ├── public/
│   │
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── routes/
│   │
│   ├── vite.config.js
│   ├── package.json
│   └── ...
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── seeds/
│   ├── tests/
│   ├── utils/
│   │
│   ├── server.js
│   ├── app.js
│   ├── .env.example
│   └── package.json
│
├── PHASES.md
├── README.md
└── ...
```

> ⚠️ **Important:** Do not run `server/src/`. It is unused legacy/parallel API code. The current live application uses `server/server.js → server/app.js → /api`.

---

# 🌐 Application URLs

| Component | Location | URL |
|---|---|---|
| Frontend | `client/` | `http://localhost:5173` |
| Backend | `server/` | `http://localhost:5000` |
| Database | MongoDB | `peoplepay360` |

### API Health Check

```text
http://localhost:5000/api/health
```

---

# ⚡ Installation & Setup

## Requirements

Make sure the following are installed:

- Node.js 18+
- npm
- MongoDB
- Git

---

## 1. Clone the Repository

```bash
git clone <repository-url>
cd PeoplePay360
```

---

## 2. Install Frontend Dependencies

```bash
cd client
npm install
```

---

## 3. Install Backend Dependencies

```bash
cd ../server
npm install
```

---

## 4. Configure Environment Variables

Copy the example environment file.

### Windows

```bash
copy .env.example .env
```

### macOS / Linux

```bash
cp .env.example .env
```

Edit:

```text
server/.env
```

and configure the required values.

---

# 🗄️ Database Setup

PeoplePay360 uses MongoDB.

Default database:

```text
peoplepay360
```

Make sure MongoDB is running before starting the backend.

---

# 🌱 Seed Demo Data

The project includes demo data for development and testing.

> ⚠️ **Warning:** Seeding wipes the existing database and reloads the demo data.

Run:

```bash
cd server
npm run seed
```

---

# ▶️ Running the Application

## Start Backend

Open Terminal 1:

```bash
cd server
npm run dev
```

Backend will run on:

```text
http://localhost:5000
```

---

## Start Frontend

Open Terminal 2:

```bash
cd client
npm run dev
```

Frontend will run on:

```text
http://localhost:5173
```

---

# 🔑 Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@peoplepay360.com` | `Admin@123` |
| HR Manager | `hr@peoplepay360.com` | `Hr@123456` |
| Payroll User | `payroll.user@peoplepay360.com` | `PayUser@123` |
| Payroll Manager | `payroll@peoplepay360.com` | `Pay@12345` |
| Employee | `alice.nguyen@peoplepay360.com` | `Employee@123` |

> ⚠️ These credentials are for local/demo environments only.

---

# 🧩 Application Modules

| Module | Description |
|---|---|
| 🏠 Dashboard | KPIs, charts and alerts |
| 👥 Employees | Employee management |
| 🏢 Departments | Organizational structure |
| 📄 Contracts | Employee contracts and salary information |
| 🕒 Schedules | Working days and working hours |
| ⏱️ Attendance | Check-in and check-out management |
| 🌴 Time Off | Leave types, allocations and requests |
| 💰 Salary Structures | Salary calculation structures |
| 🧮 Salary Rules | Salary calculation rules |
| 💵 Pay Runs | Payroll processing |
| 📑 Payslips | Payslip management and PDF generation |
| 📊 Reports | HR/payroll analytics and CSV export |
| 👤 Users | User management |
| ⚙️ Settings | Profile, password and notification settings |

---

# 🔐 Role-Based Access Control

PeoplePay360 implements **Role-Based Access Control (RBAC)**.

The main roles are:

```text
ADMIN
HR_MANAGER
PAYROLL_USER
PAYROLL_MANAGER
EMPLOYEE
```

---

# 👑 Admin

The Admin has complete system access.

```text
Admin
│
├── Dashboard
├── Users
├── Employees
├── Departments
├── Contracts
├── Schedules
├── Attendance
├── Time Off
├── Salary Structures
├── Salary Rules
├── Pay Runs
├── Payslips
├── Reports
└── Settings
```

---

# 👨‍💼 HR Manager

HR Manager handles HR-related operations.

```text
HR Manager
│
├── Dashboard
├── Employees
├── Departments
├── Contracts
├── Schedules
├── Attendance
└── Time Off
```

HR Manager does not have access to payroll money-processing operations.

---

# 💵 Payroll User

Payroll User handles operational payroll activities.

```text
Payroll User
│
├── HR Information
├── Create Pay Runs
├── Compute Pay Runs
├── View Salary Rules
└── Send Payslips
```

Salary configuration is read-only for this role.

---

# 🧑‍💼 Payroll Manager

Payroll Manager handles final payroll operations.

```text
Payroll Manager
│
├── Payroll User Permissions
├── Validate Pay Runs
├── Mark Pay Runs Paid
├── Cancel Pay Runs
└── Edit Salary Configuration
```

---

# 👤 Employee

Employees have self-service access.

```text
Employee
│
├── Own Profile
├── Check In
├── Check Out
├── Request Leave
├── View Leave
└── View Own Payslips
```

Employees cannot access other employees' payroll or personal information.

---

# 🔒 RBAC Architecture

Permissions are handled on both frontend and backend.

### Frontend Permissions

```text
client/src/utils/permissions.js
```

Responsible for:

- Navigation visibility
- Page access
- UI actions
- Role-based interface controls

### Backend Permissions

```text
server/utils/roles.js
```

Responsible for:

- API authorization
- Protected operations
- Role validation
- Access control

> Frontend permissions control the user experience, while backend authorization provides the actual security boundary.

---

# 🔄 Complete Business Workflow

```text
                    EMPLOYEE
                       │
                       ▼
                    CONTRACT
                       │
                       ▼
                WORKING SCHEDULE
                       │
              ┌────────┴────────┐
              ▼                 ▼
         ATTENDANCE          TIME OFF
              │                 │
              └────────┬────────┘
                       ▼
               SALARY STRUCTURE
                       │
                       ▼
                  SALARY RULES
                       │
                       ▼
                 PAYROLL ENGINE
                       │
                       ▼
                     PAYRUN
                       │
                       ▼
                    PAYSLIP
                  ┌────┴────┐
                  ▼         ▼
                 PDF      EMAIL
                             │
                             ▼
                       EMPLOYEE INBOX
```

---

# 💰 Payroll Workflow

A payrun follows the lifecycle:

```text
DRAFT
  ↓
COMPUTED
  ↓
VALIDATED
  ↓
PAID
```

A payrun can also be cancelled before payment:

```text
DRAFT
  ↓
CANCELLED
```

---

## Step 1 — Create Pay Run

A payroll user/manager creates a payrun using:

- Payroll period
- Salary structure
- Eligible employees

---

## Step 2 — Compute

The payroll engine processes:

```text
Employee
   ↓
Contract
   ↓
Salary Structure
   ↓
Salary Rules
   ↓
Attendance / Leave
   ↓
Salary Calculation
   ↓
Payslip
```

The system can generate warnings for configuration issues such as missing contracts or employee information.

---

## Step 3 — Validate

The payroll manager validates the computed payrun.

Validation is blocked while blocking `ERROR` warnings remain.

---

## Step 4 — Mark as Paid

After validation:

```text
Payrun
   ↓
Mark Paid
   ↓
status = paid
   ↓
Auto Email
```

If automatic email is enabled:

```env
AUTO_EMAIL_ON_PAID=true
```

the system can automatically send payslip PDFs to employees.

---

## Step 5 — Cancel

Before payment, a payrun can be cancelled.

The associated payslips are removed according to the current implementation so the payroll period can be reused.

---

# 🧮 Salary Calculation Engine

Salary calculation is handled by the backend payroll services.

Main files:

```text
server/services/salaryRuleEngine.js
server/services/payrollService.js
```

The general calculation flow is:

```text
BASIC
  ↓
ALLOWANCES
  ↓
GROSS
  ↓
DEDUCTIONS
  ↓
NET
```

Salary rules can use configured formulas and execution sequences.

Supported payroll context values include:

```text
BASIC
GROSS
ALLOWANCES
DEDUCTIONS
NET
```

Unpaid absence or unpaid leave can contribute to:

```text
UNPAID_TIME
```

deductions where applicable.

---

# ⏱️ Attendance Workflow

Employees can manage their attendance through:

```text
Check In
   ↓
Attendance Record
   ↓
Working
   ↓
Check Out
   ↓
Working Hours
```

Authorized HR users can manage attendance records according to their permissions.

---

# 🌴 Time Off Workflow

The leave workflow is:

```text
Time Off Type
      ↓
Allocation
      ↓
Employee
      ↓
Leave Request
      ↓
HR Review
      ↓
Approve / Reject
```

Approval and rejection notifications can be delivered through email.

---

# 📑 Payslip Workflow

Payslips are generated from processed payroll data.

```text
Pay Run
   ↓
Payroll Calculation
   ↓
Payslip
   ↓
Payslip Lines
   ↓
PDF
   ↓
Download / Email
```

Payslip information can include:

- Employee details
- Payroll period
- Basic salary
- Allowances
- Deductions
- Gross salary
- Net salary

---

# 📧 Email Automation

PeoplePay360 uses **Nodemailer with SMTP** for transactional email delivery.

## Supported Email Events

| Event | Email Action |
|---|---|
| Mark Payrun Paid | Payslip PDF |
| Manual Send Payslip | Payslip PDF |
| Leave Approved | Employee notification |
| Leave Rejected | Employee notification |
| Create Employee | Welcome email |
| Create User | Welcome email |

---

# 🤔 Why Nodemailer Instead of n8n?

Nodemailer was selected because email delivery is a direct backend requirement of PeoplePay360.

The backend already runs on Node.js and Express, so Nodemailer allows direct integration:

```text
Payroll Event
     ↓
Generate Payslip PDF
     ↓
Nodemailer
     ↓
SMTP
     ↓
Employee
```

This avoids introducing another server or workflow platform for basic transactional email operations.

### n8n Alternative

With n8n, the architecture could become:

```text
Backend
   ↓
Webhook / API
   ↓
n8n Workflow
   ↓
Email Service
   ↓
Employee
```

n8n is excellent for complex workflow automation, but for the current PeoplePay360 requirement, Nodemailer provides a simpler and more tightly integrated solution.

### Future n8n Usage

n8n can be introduced in future versions for:

- Weekly payroll digest
- Scheduled HR reminders
- Slack notifications
- Multi-service integrations
- Scheduled reports
- Complex approval workflows

---

# 📮 Gmail SMTP Configuration

PeoplePay360 supports Gmail SMTP for real email delivery.

Example configuration:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false

SMTP_USER=your-email@gmail.com
SMTP_PASS=your-google-app-password

SMTP_FROM=your-email@gmail.com

AUTO_EMAIL_ON_PAID=true

CLIENT_URL=http://localhost:5173
```

> ⚠️ **Important:** Do not use your normal Gmail password. Use a Google App Password with 2-Step Verification enabled.

---

# 🧪 SMTP Testing

SMTP connectivity can be tested from:

```text
Settings
   ↓
Company
   ↓
Test SMTP Connection
```

or through the API:

```text
GET /api/health/email
```

---

# 📴 Development Email Mocking

When SMTP credentials are not configured, development email operations can use a mocked response.

```text
SMTP Not Configured
       ↓
Mock Email Response
       ↓
Application Continues
```

This ensures that email configuration problems do not break the core payroll workflow during development.

When real SMTP credentials are configured, actual emails can be delivered.

---

# 📊 Dashboard

The dashboard provides live HR and payroll information.

It includes areas such as:

- Employee KPIs
- Attendance statistics
- Leave information
- Payroll statistics
- Salary information
- Department-level information
- Alerts
- Charts

Core HR/payroll charts are connected to backend APIs and MongoDB-backed data rather than relying on fake chart data.

---

# 📈 Reports

The Reports module provides:

- HR analytics
- Payroll analytics
- Salary information
- Attendance information
- Department-level data
- Charts
- CSV export

---

# 🔌 API Architecture

The current live API is:

```text
/api
```

The request flow is:

```text
React
  ↓
Axios
  ↓
Vite Proxy
  ↓
Express
  ↓
Route
  ↓
JWT Middleware
  ↓
Role Middleware
  ↓
Controller
  ↓
Service
  ↓
Mongoose
  ↓
MongoDB
```

---

# 🗂️ Main API Areas

```text
/api/auth
/api/users
/api/employees
/api/departments
/api/contracts
/api/schedules
/api/attendance
/api/time-off
/api/salary-structures
/api/salary-rules
/api/payruns
/api/payslips
/api/dashboard
/api/health
```

---

# 🔑 Important Code Locations

| Requirement | File / Folder |
|---|---|
| Website routes | `client/src/routes/AppRoutes.jsx` |
| Authentication | `client/src/context/AuthContext.jsx` |
| API calls | `client/src/services/` |
| Permissions | `client/src/utils/permissions.js` |
| API entry | `server/server.js` |
| Express app | `server/app.js` |
| Authentication controller | `server/controllers/authController.js` |
| Role definitions | `server/utils/roles.js` |
| Payroll | `server/services/payrunService.js` |
| Salary engine | `server/services/salaryRuleEngine.js` |
| Payroll service | `server/services/payrollService.js` |
| Email | `server/services/emailService.js` |
| PDF | `server/services/pdfService.js` |
| Database models | `server/models/` |

---

# 🗄️ Database Design

PeoplePay360 uses MongoDB with Mongoose.

Database:

```text
peoplepay360
```

Major entities include:

```text
User
Employee
Department
Contract
WorkingSchedule
Attendance
TimeOffType
TimeOffAllocation
TimeOffRequest
SalaryStructure
SalaryRule
Payrun
Payslip
PayslipLine
```

---

# 🧪 Testing

## Salary Engine Tests

Run:

```bash
cd server
npm run test:engine
```

This tests salary rule calculations without requiring the complete server.

---

## End-to-End Tests

Run:

```bash
cd server
npm run test:e2e
```

Requirements:

- MongoDB running
- Demo data seeded
- Backend running on port `5000`

---

# 🔐 Security

PeoplePay360 implements several security practices:

- JWT authentication
- Password hashing with bcrypt
- Protected API routes
- Role-based authorization
- Environment variables for secrets
- Backend permission enforcement
- Centralized error handling

---

# 🔒 Environment Security

Never commit sensitive information.

Do not commit:

```text
.env
```

Never expose:

```text
JWT_SECRET
MONGO_URI
SMTP_USER
SMTP_PASS
Gmail App Password
```

Use:

```text
.env.example
```

for sharing configuration structure without exposing secrets.

---

# ⚠️ Current Limitations

The current system is functional, but some advanced features are planned for future versions.

## Attendance

- Schedule-based late calculation is incomplete
- Missing days are not automatically marked absent
- Full attendance-to-payroll automation can be extended

## Time Off

- Leave cancellation API is not implemented
- Advanced overlap validation is incomplete
- `requiresApproval` is not fully utilized

## Automation

- Weekly digest is not implemented
- No background cron/job queue currently exists

## Reports

- Current reports provide charts and CSV export
- Advanced report generation is not implemented

## Settings

Some notification/company preferences are browser/local-storage based rather than fully persisted server-side.

---

# 🚀 Future Improvements

## HR

- Employee document management
- Advanced employee analytics
- Contract validation
- Employee onboarding workflow

## Attendance

- Automatic absent detection
- Schedule-based late detection
- Overtime management
- Attendance-based payroll calculations

## Leave

- Leave cancellation
- Advanced overlap validation
- Automatic leave balance calculation
- Advanced approval workflows

## Payroll

- Overtime calculations
- Attendance-based deductions
- Advanced payroll rules
- Scheduled payroll processing
- More detailed payroll warnings

## Automation

- Weekly payroll digest
- Background job queue
- Scheduled notifications
- n8n integration
- External service integrations

## Reports

- Excel export
- PDF reports
- Custom report builder
- Advanced analytics

---

# 📋 Project Status

| Feature | Status |
|---|---|
| Authentication | ✅ Complete |
| JWT Authorization | ✅ Complete |
| RBAC | ✅ Complete |
| Employees | ✅ Complete |
| Departments | ✅ Complete |
| Contracts | ✅ Complete |
| Schedules | ✅ Complete |
| Attendance | ✅ Complete |
| Time Off | ✅ Complete |
| Salary Structures | ✅ Complete |
| Salary Rules | ✅ Complete |
| Payroll | ✅ Complete |
| Pay Runs | ✅ Complete |
| Payslips | ✅ Complete |
| PDF Generation | ✅ Complete |
| Email Automation | ✅ Complete |
| Gmail SMTP | ✅ Supported |
| SMTP Testing | ✅ Complete |
| Dashboard | ✅ Complete |
| Reports | ✅ Complete |
| CSV Export | ✅ Complete |
| Weekly Digest | 🔄 Future |
| Advanced Attendance Payroll | 🔄 Future |
| Leave Cancellation | 🔄 Future |
| Advanced Report Builder | 🔄 Future |
| n8n Integration | 🔄 Future |

---

# 🎯 Project Objective

The primary objective of PeoplePay360 is to create a centralized HR and payroll platform that reduces manual HR operations and connects employee information directly with payroll processing.

The system integrates:

```text
Employees
     ↓
Contracts
     ↓
Attendance
     ↓
Leave
     ↓
Salary
     ↓
Payroll
     ↓
Payslips
     ↓
Email
     ↓
Reports
```

This creates a single connected workflow for HR teams, payroll managers, and employees.

---

# 🏆 Key Highlights

PeoplePay360 demonstrates:

- ✅ Full-stack web application
- ✅ React + Vite frontend
- ✅ Node.js + Express backend
- ✅ MongoDB database
- ✅ JWT authentication
- ✅ Role-based access control
- ✅ Employee management
- ✅ Attendance management
- ✅ Leave management
- ✅ Contract management
- ✅ Salary structures
- ✅ Configurable salary rules
- ✅ Payroll calculation engine
- ✅ Payrun lifecycle
- ✅ Payslip generation
- ✅ PDF generation
- ✅ Gmail/SMTP integration
- ✅ Automated transactional emails
- ✅ Dashboard analytics
- ✅ Reports and CSV export
- ✅ Protected APIs
- ✅ Modular backend architecture

---

# 🧭 Recommended Product Flow

For understanding the complete application, follow this order:

```text
1. Login
      ↓
2. Dashboard
      ↓
3. Employees
      ↓
4. Contracts
      ↓
5. Schedules
      ↓
6. Attendance
      ↓
7. Time Off
      ↓
8. Salary Structures
      ↓
9. Salary Rules
      ↓
10. Pay Runs
      ↓
11. Compute
      ↓
12. Validate
      ↓
13. Mark Paid
      ↓
14. Payslip
      ↓
15. PDF / Email
      ↓
16. Reports
```

---

# 📚 Documentation

Additional project documentation:

- [`PHASES.md`](./PHASES.md) — Feature implementation checklist
- [`server/README.md`](./server/README.md) — Backend-specific documentation

---

# 👨‍💻 Team PeoplePay360

## Built with ❤️ by

| Team Member | Role |
|---|---|
| **Kunj Prajapati** | Frontend Developer |
| **Vijay Prajapati** | Backend Developer |
| **Sumit Prajapati** | Database Developer |
| **Diya Mehta** | Automation Developer |

---

# ⭐ PeoplePay360

### One Platform. One Workflow. Complete HR & Payroll Management.

```text
People → Attendance → Leave → Salary → Payroll → Payslip → Email → Reports
```
