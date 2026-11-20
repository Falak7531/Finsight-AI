# FinSight-AI — Complete Codebase & Architecture Report      

> **Purpose:** This document provides a complete, accurate reference of the **FinSight-AI** repository — covering the full folder structure, Backend (Express + Prisma + PostgreSQL + Groq/OpenAI), Frontend (React + Vite + Tailwind + Recharts), Database/DBMS assets, Data Models, API Contracts, and Frontend↔Backend Integration Checklist. It is structured so it can be shared directly with ChatGPT or any engineer to understand every module and file in the project.

---

## 1. Project Overview

**FinSight-AI** is an AI-powered financial intelligence web platform that ingests bank statements (PDF/CSV/XLSX), parses transactions, computes financial KPIs and category breakdowns, flags unusual spending patterns, and generates structured AI financial insights.

### High-Level Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19.3, Vite 8.3, Tailwind CSS v4 (`@tailwindcss/vite`), React Router DOM v7, Recharts, Framer Motion, Lucide React |
| **Backend** | Node.js (ESM), Express 5.3, Prisma 7.10 (`@prisma/adapter-pg`), PostgreSQL (`pg`), JWT (`jsonwebtoken`), `bcryptjs` / `bcrypt`, `cookie-parser`, `cors`, Multer 2.5, `pdf-parse` 2.4 |
| **AI Service** | OpenAI Node SDK (`openai` 7.62) configured against **Groq API** (`https://api.groq.com/openai/v1`, model `openai/gpt-oss-20b`, structured JSON output) |
| **Database / DBMS** | PostgreSQL 18.6, Prisma ORM (app DB), plus a 9-table normalized UPI benchmark schema & PostgreSQL execution plan suite in `dbms/` |

---

## 2. Complete Repository Folder Structure

```text
Finsight-AI/
├── README.md                              # Project title & short description
├── PROJECT_ARCHITECTURE_REPORT.md         # This complete codebase report
│
├── backend/                               # Node.js + Express + Prisma + AI Backend
│   ├── package.json                       # Backend dependencies & npm scripts (start/dev)
│   ├── prisma7.config.ts                  # Prisma 7 CLI configuration
│   ├── .env                               # Local environment secrets (not committed)
│   ├── prisma/
│   │   ├── schema.prisma                  # Active Prisma data models (User, Analytics)
│   │   └── migrations/
│   │       ├── migration_lock.toml
│   │       └── 20261119143910_m1/         # Initial Prisma migration
│   ├── generated/prisma/                  # Generated Prisma 7 TypeScript client
│   ├── uploads/                           # Local Multer disk storage for uploaded PDFs
│   ├── src/
│   │   ├── index.js                       # Server entrypoint (loads dotenv, starts Express)
│   │   ├── app.js                         # Express app setup, middleware, routes, error handler
│   │   ├── config/
│   │   │   └── prisma.js                  # PrismaPg adapter + PrismaClient singleton
│   │   ├── routes/
│   │   │   ├── auth.route.js              # Active auth routes (/login, /register)
│   │   │   ├── analytic.route.js          # Active analytics routes (/upload, /, /:id)
│   │   │   └── auth.routes.js             # Legacy unused route file (can be removed)
│   │   ├── controllers/
│   │   │   ├── auth.controller.js         # Sign-up & sign-in HTTP handlers (sets httpOnly JWT cookie)
│   │   │   └── analytic.controller.js     # PDF upload & analytics retrieval handlers
│   │   ├── services/
│   │   │   ├── auth.service.js            # User lookup, bcrypt hashing, JWT generation
│   │   │   └── analytic.service.js        # PDF extraction -> Groq AI call -> Prisma persistence
│   │   └── middlewares/
│   │       ├── auth.middleware.js         # Reads & verifies JWT from req.cookies.token
│   │       └── upload.js                  # Multer disk storage (PDF only, 5 MB limit)
│   └── utils/
│       ├── AI.js                          # Groq OpenAI-compatible structured JSON analysis client
│       ├── pdfParser.js                   # Extracts raw text from uploaded PDF using pdf-parse
│       └── tokens.js                      # JWT sign (7d) & verify helpers
│
├── frontend/                              # React + Vite + Tailwind CSS v4 Frontend
│   ├── package.json                       # Frontend dependencies & scripts (dev/build/lint/preview)
│   ├── vite.config.js                     # Vite + React + Tailwind v4 plugin config
│   ├── eslint.config.js                   # ESLint configuration
│   ├── index.html                         # HTML shell + Google Fonts (Inter, Plus Jakarta Sans, JetBrains Mono)
│   ├── public/
│   │   └── favicon.svg                    # Custom FinSight neon-lime geometric logo favicon
│   └── src/
│       ├── main.jsx                       # React 19 root mount
│       ├── App.jsx                        # BrowserRouter + all public, auth, and dashboard routes
│       ├── index.css                      # Global styles + scoped .finsight-dashboard dark/light tokens
│       ├── context/
│       │   └── DashboardContext.jsx       # Global dashboard state (theme, currency, dateRange, docs, budgets, notifications)
│       ├── services/
│       │   ├── authService.js             # Frontend auth service (integration-ready for backend)
│       │   └── dashboardService.js        # Frontend analytics/upload/export service stubs
│       ├── data/
│       │   ├── sampleFinanceData.js       # Illustrative INR sample data for Landing & Auth pages
│       │   └── dashboardData.js           # Synthetic INR dataset for all 9 Dashboard views
│       ├── pages/
│       │   ├── LandingPage.jsx            # Route: /
│       │   ├── LoginPage.jsx              # Route: /login
│       │   ├── SignupPage.jsx             # Route: /signup
│       │   ├── ForgotPasswordPage.jsx     # Route: /forgot-password
│       │   └── dashboard/
│       │       ├── OverviewPage.jsx       # Route: /dashboard
│       │       ├── AnalyticsPage.jsx      # Route: /dashboard/analytics
│       │       ├── TransactionsPage.jsx   # Route: /dashboard/transactions
│       │       ├── BudgetsPage.jsx        # Route: /dashboard/budgets
│       │       ├── AIInsightsPage.jsx     # Route: /dashboard/insights
│       │       ├── ForecastsPage.jsx      # Route: /dashboard/forecasts
│       │       ├── ReportsPage.jsx        # Route: /dashboard/reports
│       │       ├── DocumentsPage.jsx      # Route: /dashboard/documents
│       │       └── SettingsPage.jsx       # Route: /dashboard/settings
│       └── components/
│           ├── Logo.jsx                   # Custom SVG FinSight mark + wordmark
│           ├── Navbar.jsx                 # Sticky landing page navbar
│           ├── HeroSection.jsx            # Centered Clario-inspired hero section
│           ├── DashboardPreview.jsx       # Interactive landing page dashboard showcase
│           ├── HowItWorks.jsx             # 3-step workflow section
│           ├── FeatureCards.jsx           # 4 core capability cards
│           ├── AIInsightSection.jsx       # Illustrative AI insight explanation section
│           ├── FinalCTA.jsx               # Closing neon-lime CTA section
│           ├── Footer.jsx                 # Footer with links, GitHub URL & disclaimer
│           ├── PreviewModal.jsx           # Legacy preview modal (retained, unused after router wiring)
│           ├── auth/
│           │   ├── AuthLayout.jsx         # Two-column fintech auth shell + spending chart card
│           │   ├── LoginForm.jsx          # Sign-in form + validation + loading state
│           │   ├── SignupForm.jsx         # Registration form + password strength + matching check
│           │   ├── ForgotPasswordForm.jsx # Password recovery form (demo state)
│           │   ├── AuthInput.jsx          # Reusable styled text/email input
│           │   ├── PasswordInput.jsx      # Reusable password input + visibility toggle + strength bar
│           │   ├── AuthButton.jsx         # Primary neon-lime CTA button with loading spinner
│           │   └── SocialAuthButtons.jsx  # Google & GitHub OAuth buttons (honest unconfigured notice)
│           └── dashboard/
│               ├── DashboardLayout.jsx    # 3-column shell (Sidebar + Center + Persistent Document Panel)
│               ├── DashboardSidebar.jsx   # Fixed/collapsible left navigation + AI card + profile
│               ├── DashboardHeader.jsx    # Top bar (greeting, date range, search, notifications, theme toggle)
│               ├── DocumentPanel.jsx      # Persistent right-side drag-and-drop CSV/XLSX/PDF workspace
│               ├── DocumentPreviewModal.jsx # Slide-over file metadata & parsed-row preview drawer
│               ├── ConfirmDialog.jsx      # Confirmation modal for destructive actions (e.g. delete file)
│               └── KpiCard.jsx            # Reusable financial KPI card with Recharts sparkline
│
└── dbms/                                  # Academic DBMS Deliverables & PostgreSQL Benchmarks
    ├── 01_normalization.md                # UNF -> 1NF -> 2NF -> 3NF -> BCNF normalization doc
    ├── 02_er_diagram.png                  # 9-table UPI Entity-Relationship Diagram
    ├── 03_schema.sql                      # 9-table PostgreSQL DDL (cities, users, bank_accounts, vpas, merchants, transactions, bill_payments, rewards, disputes)
    ├── 04_queries.sql                     # Application SQL query audit
    ├── 05_query_timings.md                # Live PostgreSQL 18.6 benchmark report (Q1–Q10)
    └── plans/                             # 10 actual EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) files
        ├── q01_transaction_history.json
        ├── q02_monthly_spending.json
        ├── q03_income_vs_expense.json
        ├── q04_category_spending.json
        ├── q05_budget_utilization.json
        ├── q06_recurring_expenses.json
        ├── q07_anomaly_records.json
        ├── q08_financial_insights.json
        ├── q09_monthly_trends.json
        └── q10_advanced_analytics.json
```

---

## 3. Backend Deep Dive (`backend/`)

### 3.1 Prisma Data Models (`backend/prisma/schema.prisma`)

Currently defines two PostgreSQL models:

1. **`User`**
   - `id`: `Int @id @default(autoincrement())`
   - `name`: `String?`
   - `email`: `String`
   - `password`: `String` (bcrypt hash)
2. **`Analytics`**
   - `id`: `String @id @default(uuid()) @db.Uuid`
   - `userId`: `String @db.Uuid` (foreign key referencing `User(id)`, `onDelete: Cascade`)
   - `fileName`: `String` (original uploaded filename)
   - `fileUrl`: `String` (local disk path in `uploads/`)
   - `totalIncome`: `Decimal @default(0) @db.Decimal(12, 2)`
   - `totalExpense`: `Decimal @default(0) @db.Decimal(12, 2)`
   - `totalSavings`: `Decimal @default(0) @db.Decimal(12, 2)`
   - `categoryBreakdown`: `Json` (map of 9 expense categories → numeric totals)
   - `monthlyBreakdown`: `Json?` (map of `YYYY-MM` → numeric totals)
   - `topTransactions`: `Json` (up to 5 largest expense transactions: `{ merchant, amount, category, date, description }`)
   - `aiInsights`: `Json` (array of AI-generated insight strings)
   - `createdAt`: `DateTime @default(now())`

### 3.2 Backend API Endpoints

| Method | Path | Auth Required | Request Payload | Behavior & Response |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | No | `{ userName, userEmail, userPassword }` | Hashes password with `bcryptjs`, creates `User`, signs 7-day JWT, sets `httpOnly` cookie `token`, returns `201 { message: "Sign Up Successful" }` |
| `POST` | `/api/auth/login` | No | `{ userEmail, userPassword }` | Verifies credentials, signs 7-day JWT, sets `httpOnly` cookie `token`, returns `200 { message: "Sign In Successful" }` |
| `POST` | `/api/analytic/upload` | Yes (`cookie: token`) | `multipart/form-data` (`statement`: PDF ≤ 5 MB) | Extracts PDF text (`pdfParser.js`) → calls Groq LLM (`utils/AI.js`) → stores row in `Analytics` → returns `201 { message, data }` (deletes file on failure) |
| `GET` | `/api/analytic/` | Yes (`cookie: token`) | None | Lists all `Analytics` records owned by `req.user.userId` (`select: { id, fileName }`) |
| `GET` | `/api/analytic/:id` | Yes (`cookie: token`) | URL param `:id` | Returns full `Analytics` record matching `{ id, userId }` (`200` or `404`) |

### 3.3 AI Statement Analysis Pipeline (`backend/utils/AI.js` & `pdfParser.js`)
1. `middlewares/upload.js` saves the uploaded PDF to `backend/uploads/<timestamp>-<rand>.pdf` (MIME filter `application/pdf`, 5 MB max).
2. `utils/pdfParser.js` uses `PDFParse` (`pdf-parse`) to extract raw text from the PDF buffer.
3. `utils/AI.js` sends the extracted text to **Groq** (`https://api.groq.com/openai/v1`) using model `openai/gpt-oss-20b` (`temperature: 0.1`, `text.format.type: "json_object"`), instructing it to categorize expenses into 9 categories (`Food & Dining`, `Shopping`, `Transportation`, `Entertainment`, `Healthcare`, `Utilities`, `Education`, `Rent`, `Other`), exclude internal transfers/refunds, compute `total_income`, `total_expense`, `total_savings`, `category_breakdown`, `monthly_breakdown`, `top_transactions` (top 5 expenses), and `ai_insights`.
4. `services/analytic.service.js` persists the parsed JSON into PostgreSQL via Prisma (`prisma.analytics.create`).

### 3.4 Required Environment Variables (`backend/.env`)
- `PORT` (defaults to `5000`)
- `DATABASE_URL` (PostgreSQL connection string)
- `JWT_SECRET` (secret for signing/verifying 7-day auth JWTs)
- `GROQ_API_KEY` (API key for Groq OpenAI-compatible endpoint)

---

## 4. Frontend Deep Dive (`frontend/`)

### 4.1 Design System & Visual Identity
Unified across all pages:
- **Landing & Auth Pages:** Pure black `#050505`, card surface `#0D1015`, neon lime `#8BFF19` / `#B8F36B`, white `#FFFFFF`, muted grey `#A1A1AA`.
- **Dashboard (`data-dash-theme="dark"` default + `"light"` toggle):**
  - Primary canvas `#050605`, Sidebar/Header/Right Panel `#090B09`, Cards `#101310`, Elevated/Inputs `#151A14`, Borders `#20251F`
  - Primary accent `#8DFF00` (hover `#A4FF32`, subtle olive `#1C2A0D`), Positive `#8DFF00`, Negative `#FF6262`, Warning `#F2B84B`
  - Typography: `Plus Jakarta Sans` (headings), `Inter` (UI body), `JetBrains Mono` (`tabular-nums` financial values).

### 4.2 Complete Route Map (`frontend/src/App.jsx`)

| Route | Component | Description |
|---|---|---|
| `/` | `LandingPage` | Clario-inspired dark SaaS landing page: sticky navbar, centered hero (`Take Control of Your Money. Understand Every Move.`), glowing interactive INR dashboard preview, 3-step How It Works, 4 Feature Cards, AI Intelligence Showcase, Final CTA, Footer. |
| `/login` | `LoginPage` | Two-column Sign In page with illustrative monthly spending chart (`₹24,850`), email/password validation, show/hide password, Remember Me, Forgot Password link, Google/GitHub OAuth notices. |
| `/signup` | `SignupPage` | Two-column Create Account page with Full Name, Email, Password (with 4-level strength meter), Confirm Password matching validation, and OAuth notices. |
| `/forgot-password` | `ForgotPasswordPage` | Centered password recovery page with email validation and clearly labeled frontend demonstration state. |
| `/dashboard` | `OverviewPage` (in `DashboardLayout`) | 3-column workspace: 4 KPI cards with Recharts sparklines, `Income vs Expenses` line chart, `Expenses by Category` donut chart, `Cash Flow Overview` bar chart, `Recent Transactions`, `AI Financial Insight` panel, bottom savings tip banner, plus persistent Right Document Panel. |
| `/dashboard/analytics` | `AnalyticsPage` | 4 Financial Health Indicators, 6-month `ComposedChart` (Income, Expenses, Net Savings), horizontal Category bar chart, Monthly comparison table. |
| `/dashboard/transactions` | `TransactionsPage` | Searchable, filterable (Category, Income/Expense), sortable transaction table with empty state and slide-over Transaction Detail Drawer. |
| `/dashboard/budgets` | `BudgetsPage` | Monthly budget summary KPIs, 6 category progress cards with overspending alerts, and inline editable budget limits. |
| `/dashboard/insights` | `AIInsightsPage` | Filterable simulated AI observations, anomaly flags, and expandable pattern explanation logic. |
| `/dashboard/forecasts` | `ForecastsPage` | Interactive scenario switcher (`Baseline`, `Budget-Optimized`, `Higher-Spend Stress Test`) and Historical (solid) vs Predicted (dashed) cash-flow `AreaChart`. |
| `/dashboard/reports` | `ReportsPage` | Monthly summary cards with working client-side CSV and JSON report downloads. |
| `/dashboard/documents` | `DocumentsPage` | Complete document library with search, status filters (`Processed`, `Processing`, `Failed`), upload, preview drawer, download, and confirmed deletion. |
| `/dashboard/settings` | `SettingsPage` | Profile editor, live Currency switcher (`INR ₹`, `USD $`, `EUR €`), Obsidian Dark / Clean Light theme switcher, and notification preference toggles. |

### 4.3 State Management (`DashboardContext.jsx`)
Manages theme (`localStorage`-persisted), display currency + live formatting (`formatAmount`), global date-range selector, global search, sidebar collapse & mobile drawers, uploaded documents lifecycle (drag-and-drop CSV/XLSX/PDF validation, simulated processing state, preview modal, download blob, delete confirmation dialog), editable budgets, notifications (with unread count), and user profile/notification preferences.

---

## 5. Known Backend Issues & Frontend↔Backend Integration Gaps

Sharing this section with ChatGPT will help immediately when wiring frontend to backend:

1. **Prisma Schema Type Mismatch (`backend/prisma/schema.prisma`):**
   - `User.id` is `Int @id @default(autoincrement())`, while `Analytics.userId` is `String @db.Uuid` referencing `User(id)`. Both must use the same type (either `String @id @default(uuid()) @db.Uuid` on `User.id` OR `Int` on `Analytics.userId`).
   - `User` should also declare `email String @unique` and the inverse relation `analytics Analytics[]`.
2. **Prisma Client Import in Plain Node (`backend/src/config/prisma.js`):**
   - Currently imports `../../generated/prisma/client.ts` (a TypeScript file). Running `node src/index.js` directly requires either compiling TypeScript, running with `tsx`, or configuring Prisma output for JS.
3. **CORS Not Mounted (`backend/src/app.js`):**
   - `cors` is installed in `backend/package.json` but not yet added to `app.js`. Needs `app.use(cors({ origin: 'http://localhost:5173', credentials: true }))` so browser `fetch(..., { credentials: 'include' })` can send/receive the `httpOnly` JWT cookie.
4. **Auth Endpoint & Field-Name Alignment:**
   - Backend expects `POST /api/auth/register` with `{ userName, userEmail, userPassword }` and `POST /api/auth/login` with `{ userEmail, userPassword }`.
   - Frontend `frontend/src/services/authService.js` currently targets `/api/auth/signup` with `{ name, email, password }` (from the earlier backend version) and uses preview mode for login/forgot-password. Update `authService.js` to match `/api/auth/register` & `/api/auth/login` with `credentials: 'include'` once CORS and Prisma are fixed.
   - Missing backend endpoints: `POST /api/auth/logout`, `GET /api/auth/me`, `POST /api/auth/forgot-password`, and OAuth routes.
5. **Document Upload & Analytics Alignment:**
   - Backend `POST /api/analytic/upload` accepts `multipart/form-data` field `statement` (PDF only, max 5 MB) and returns `{ id, fileName, totalIncome, totalExpense, totalSavings, categoryBreakdown, monthlyBreakdown, topTransactions, aiInsights }`.
   - Frontend `dashboardService.js` and `DashboardContext.jsx` currently run in synthetic demo mode and allow `.csv`, `.xlsx`, `.pdf` up to 50 MB. Once connected, `dashboardService.js` should call `POST /api/analytic/upload`, `GET /api/analytic/`, and `GET /api/analytic/:id` with `credentials: 'include'`, and map the returned `Analytics` JSON into the dashboard state.
6. **Cleanup Item:**
   - `backend/src/routes/auth.routes.js` is a leftover legacy file (unused by `app.js`, which imports `auth.route.js`).

---

## 6. How to Run Locally

### Frontend
```bash
cd frontend
npm install
npm run dev
# Runs at http://localhost:5173/ (Dashboard at http://localhost:5173/dashboard)
```

### Backend
```bash
cd backend
npm install
# Ensure backend/.env has PORT, DATABASE_URL, JWT_SECRET, GROQ_API_KEY
# After fixing the Prisma schema User.id / Analytics.userId type mismatch:
npx prisma generate
npx prisma migrate dev
npm run dev
# Runs at http://localhost:5000/
```
