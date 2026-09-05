# PeoplePay360 — HR & Payroll Management System

A full-stack HR and Payroll Management System built with React, Node.js, Express, and **local MongoDB**.

## Quick Start

### Prerequisites
- Node.js >= 18
- MongoDB Community Server (local) — **not Atlas**
- MongoDB Compass (optional)

### Installation

```bash
cd client && npm install
cd ../server && npm install
```

On Windows PowerShell, if `npm` is blocked by execution policy, use `npm.cmd` instead.

### Configure

```bash
cd server
copy .env.example .env
```

Default connection:

```
MONGO_URI=mongodb://127.0.0.1:27017/peoplepay360
```

### Seed demo data

```bash
cd server
npm run seed
```

### Run

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

- Frontend: http://localhost:5173  
- API: http://localhost:5000  
- Compass: `mongodb://127.0.0.1:27017/peoplepay360`

### Host on your Wi‑Fi (phones / other PCs)

Both apps listen on all network interfaces. On the same Wi‑Fi, open:

```
http://YOUR_PC_LAN_IP:5173
```

Example: `http://192.168.105.142:5173`

Find your IP in Windows: `ipconfig` → **Wireless LAN adapter Wi‑Fi** → IPv4 Address.

Allow ports in Windows Firewall if devices cannot connect (one-time, Admin PowerShell):

```powershell
netsh advfirewall firewall add rule name="PeoplePay360 UI" dir=in action=allow protocol=TCP localport=5173
netsh advfirewall firewall add rule name="PeoplePay360 API" dir=in action=allow protocol=TCP localport=5000
```

Keep both `server` and `client` running on this PC while others use the LAN URL.

### Demo logins

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@peoplepay360.com | Admin@123 |
| HR Manager | hr@peoplepay360.com | Hr@123456 |
| Payroll User | payroll.user@peoplepay360.com | PayUser@123 |
| Payroll Manager | payroll@peoplepay360.com | Pay@12345 |
| Employee | alice.nguyen@peoplepay360.com | Employee@123 |

### Verify payroll engine

```bash
cd server && npm run test:engine
```

### Hackathon demo smoke test

```bash
cd server && npm run test:e2e
```

## Project structure

- `client/` — React + Vite frontend
- `server/` — Node.js + Express + Mongoose backend

### Payrun workflow

`draft` → `computed` → `validated` → `paid` (+ `cancelled`)

### Key API areas

- Auth: `/api/auth/register`, `/login`, `/me`
- Employees, departments, contracts, schedules, attendance
- Time-off types / allocations / requests (approve deducts balance)
- Salary structures & rules
- Payruns (compute / validate / mark-paid / send-payslips)
- Payslips + PDF (`GET /api/payslips/:id/pdf`)
- Dashboard: `GET /api/dashboard/summary`
