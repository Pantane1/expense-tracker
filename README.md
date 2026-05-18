# Expense Tracker

Full-stack personal finance tracker — Next.js frontend + Node.js/Express backend + MySQL.

## Project Structure

```
expense-tracker/
├── backend/     # Express REST API (port 5000)
└── frontend/    # Next.js app (port 3000)
```

## Quick Start

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env    # fill in DB_HOST, DB_PASSWORD, JWT_SECRET
npm run dev
```

### 2. Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000

## Pages
| Route | Description |
|-------|-------------|
| `/` | Redirects to login or dashboard |
| `/login` | Sign in |
| `/register` | Create account |
| `/dashboard` | Overview, charts, recent transactions |
| `/transactions` | Full transaction list with CRUD |
| `/budgets` | Monthly budget tracker |
| `/analytics` | Spending trends and category charts |
| `/reports` | Monthly report with CSV export |

## Tech Stack
- **Frontend**: Next.js 16, Tailwind CSS v4, Recharts, Zustand, Axios
- **Backend**: Node.js, Express, JWT, bcryptjs, mysql2
- **Database**: MySQL / TiDB Serverless
- **Deploy**: Vercel (frontend) + Render (backend) + TiDB Serverless (DB)

<p align="center">
  <a href="#"><img src="https://github.com/Pantane1/nf/blob/main/public/ph.png" alt="ph-logo">
</p>

<p align="center">
  <a href="#"><img src="http://readme-typing-svg.herokuapp.com?color=ACAF50&center=true&vCenter=true&multiline=false&lines=LONG+LIVE+THE+NJAGI'S" alt="">
</p>
