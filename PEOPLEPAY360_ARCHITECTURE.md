# PeoplePay360 — Architecture & Developer Guide

## Project Overview
PeoplePay360 is a modern HR & Payroll Management System for managing employees, contracts, attendance, time-off, and payroll processing.

---

## Technology Stack

### Frontend
| Tool | Purpose |
|------|---------|
| React 18 | UI framework |
| Vite | Build tool & dev server |
| Tailwind CSS | Utility-first styling |
| React Router v6 | Client-side routing |
| Axios | HTTP client |
| Recharts | Data visualization |
| Lucide React | Icon library |

### Backend
| Tool | Purpose |
|------|---------|
| Node.js | Runtime |
| Express.js | Web framework |
| Mongoose | MongoDB ODM |
| JWT | Authentication tokens |
| bcrypt | Password hashing |
| dotenv | Environment config |

### Database
- MongoDB Community Server (local)
- Connection: `mongodb://127.0.0.1:27017/peoplepay360`
- **Do NOT use MongoDB Atlas**

---

## Folder Structure

```
peoplepay360/
├── client/         # React frontend
├── server/         # Node.js backend
├── README.md
├── .gitignore
└── PEOPLEPAY360_ARCHITECTURE.md
```

---

## Frontend Responsibility (Developer 1)

Working directory: `client/`

- Build all React pages under `src/pages/`
- Build reusable components under `src/components/`
- Wire up API calls via `src/services/`
- Manage auth state via `src/context/AuthContext.jsx`
- Define routes in `src/routes/AppRoutes.jsx`
- Style using Tailwind CSS

---

## Backend Responsibility (Developer 2)

Working directory: `server/`

- Define Mongoose models in `models/`
- Implement business logic in `services/`
- Expose REST endpoints via `routes/` + `controllers/`
- Handle auth with JWT in `middleware/authMiddleware.js`
- Configure DB in `config/db.js`
- Seed demo data via `seeds/seed.js`

---

## API Modules

| Endpoint | Description |
|----------|-------------|
| `/api/auth` | Login, logout, refresh token |
| `/api/users` | User management |
| `/api/employees` | Employee CRUD |
| `/api/departments` | Department management |
| `/api/contracts` | Employment contracts |
| `/api/schedules` | Work schedules |
| `/api/attendance` | Attendance records |
| `/api/time-off` | Leave requests & allocations |
| `/api/salary-structures` | Salary structure templates |
| `/api/salary-rules` | Salary computation rules |
| `/api/payruns` | Payrun processing |
| `/api/payslips` | Payslip generation & retrieval |
| `/api/dashboard` | Dashboard KPIs & charts |

---

## Database Models

| Model | Description |
|-------|-------------|
| User | System user with roles |
| Employee | Employee profile & personal info |
| Department | Organizational departments |
| Contract | Employment contract per employee |
| WorkingSchedule | Work hours & shift definitions |
| Attendance | Daily attendance records |
| TimeOffType | Types of leave (annual, sick, etc.) |
| TimeOffAllocation | Leave balance per employee |
| TimeOffRequest | Leave request & approval workflow |
| SalaryStructure | Salary template (basic, allowances, etc.) |
| SalaryRule | Individual computation rules |
| Payrun | Monthly payrun batch |
| Payslip | Individual employee payslip |
| PayslipLine | Line items per payslip |

---

## User Roles

| Role | Access |
|------|--------|
| `admin` | Full system access |
| `hr_manager` | HR operations, no payroll approval |
| `payroll_manager` | Payroll processing & approval |
| `employee` | View own profile, payslips, leave |

---

## Payroll Workflow

1. HR creates salary structures & rules
2. HR assigns salary structure to employee contract
3. Payroll manager initiates a Payrun (select period + employees)
4. System computes payslips using salary rules engine
5. Payroll manager reviews & approves payrun
6. Payslips are locked & available to employees
7. PDF payslips can be generated & emailed

---

## MongoDB Local Setup

1. Install [MongoDB Community Server](https://www.mongodb.com/try/download/community)
2. Start MongoDB service
3. Connect via Compass: `mongodb://127.0.0.1:27017/peoplepay360`
4. Database is auto-created on first write

---

## Development Rules

- Use JavaScript only (no TypeScript)
- All API responses use the standard `response.js` utility
- Validate inputs using `middleware/validationMiddleware.js`
- Never commit `.env` files
- Use `npm run dev` with nodemon for backend hot reload
- Use `npm run dev` with Vite for frontend hot reload
- Keep business logic in `services/`, not in controllers
- Controllers should only handle HTTP request/response
