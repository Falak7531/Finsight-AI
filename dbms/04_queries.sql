-- ================================================================
-- FinSight — Complete Actual Application SQL Query Documentation
-- ================================================================
--
-- Scope and placeholder convention:
-- PostgreSQL parameter placeholders are shown as $1, $2, ... in the
-- application SQL form. When invoked through the Prisma ORM, values
-- are bound automatically by Prisma rather than interpolated.
-- If a PostgreSQL client or pg query is used directly, pass values as
-- a parameter array: [value1, value2, ...]. Never concatenate values
-- into SQL text. TIMESTAMP values are TIMESTAMP(3); monetary values
-- must use NUMERIC/DECIMAL rather than floating-point types.
--
-- Schema scope:
-- The active Prisma/PostgreSQL model declares only "User". The migration
-- creates that table in addition to a unique email index. There are no
-- Transaction, Category, Budget, Upload, Anomaly, Insight, or Recurring
-- table/column definitions in the active schema. dbms/sql/01_schema.sql
-- describes a separate UPI dataset and is not used or referenced by the
-- running backend, frontend, Prisma client, or Express routes.
--
-- Storage reality:
-- The actual active backend route is POST /api/auth/signup. Its Prisma
-- create operation is the only database operation in the application.
-- Other route modules exist as source files, but are not mounted by
-- backend/src/app.js and their repositories store data in JavaScript
-- arrays or return constants. Those operations are documented below as
-- NO DATABASE QUERY and must not be represented as SQL against imaginary
-- tables.
--
-- Endpoint/module mapping:
-- POST /api/auth/signup
--   auth.routes -> auth.controller -> auth.service -> auth.repository
--   -> Prisma user.create
-- Implementation status: auth.controller.js imports signUpchUser, but the
-- implemented export in auth.service.js is signUpUser. This named-import
-- mismatch currently prevents successful module loading/execution, so the
-- SQL INSERT is the repository's intended write, not an operation that can
-- currently complete successfully until the wiring is corrected.
--
-- Unmounted modules (no database operation is performed):
--   /api/transactions (transaction.routes, transaction.controller,
--     transaction.service, transaction.repository: in-memory array)
--   /api/uploads (upload.routes, upload.controller, upload.service:
--     metadata/status response only)
--   /api/analytics/summary (analytics.routes, analytics.controller,
--     analytics.service, report.repository: fixed in-memory constant)
--
-- ================================================================
-- SECTION 1: Authentication and User Management
-- ================================================================
-- Endpoint: POST /api/auth/signup
-- Module: auth.routes -> auth.controller -> auth.service
--          -> auth.repository -> Prisma user.create
--
-- WRITE
-- Register a new user. Prisma applies the model defaults and returns
-- only non-password fields. Do not expose the stored password hash.
INSERT INTO "User" (
    "id",
    "name",
    "email",
    "password",
    "createdAt",
    "updatedAt"
)
VALUES (
    gen_random_uuid(),
    $1,
    $2,
    $3,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
RETURNING "id", "name", "email", "createdAt", "updatedAt";

-- NO DATABASE QUERY — finding a user by email during login.
-- No login route or login operation exists in the active application.
-- backend/src/repositories/user.repository.js contains only an in-memory
-- findByEmail implementation; it does not query PostgreSQL.

-- NO DATABASE QUERY — retrieving or updating a user profile.
-- No active route, Prisma model field set, service, or repository
-- implements profile retrieval or profile updates.

-- NO DATABASE QUERY — updating authentication records.
-- No password reset, login, session, token, or credential update is
-- implemented against PostgreSQL.

-- NO DATABASE QUERY — deleting a user account.
-- No active account-deletion route or repository operation exists.
-- The current "User" table has no relations, so no associated database
-- cleanup is implemented or possible through this active schema.

-- ================================================================
-- SECTION 2: Transaction Management
-- ================================================================
-- Module: transaction.routes -> transaction.controller
--          -> transaction.service -> transaction.repository
--
-- NO DATABASE QUERY — GET or POST transaction operations.
-- These route files are not mounted in backend/src/app.js. In addition,
-- backend/src/repositories/transaction.repository.js keeps transactions
-- in a process-memory array and uses a generated UUID plus fields supplied
-- by transaction.service.js. It has no Prisma call or PostgreSQL SQL.
--
-- Required fields in the in-memory implementation are amount (number),
-- type, category, description, and date. Because there is no Transaction
-- model or table in the active Prisma/PostgreSQL schema, there is no
-- valid SQL for fetching, searching, filtering, sorting, pagination,
-- inserting, updating, or deleting persisted transactions.

-- ================================================================
-- SECTION 3: CSV Import and Duplicate Detection
-- ================================================================
-- Module: upload.routes -> upload.controller -> upload.service
--
-- NO DATABASE QUERY — CSV upload and duplicate detection.
-- backend/src/repositories/transaction.repository.js is not used by the
-- upload implementation. backend/src/services/upload.service.js validates
-- only fileName, fileType, and size, then returns a status object. It does
-- not parse a file, compute a duplicate key, or access PostgreSQL.
--
-- Consequently, there is no import/history/failed-row table or operation.
-- Duplicate protection for repeated CSV files is not implemented.

-- ================================================================
-- SECTION 4: Categories and Categorisation
-- ================================================================
-- NO DATABASE QUERY — categories or categorisation rules.
-- No Category model/table, category route, category repository, or
-- categorisation-rule table exists. In the unmounted in-memory transaction
-- repository, "category" is only an arbitrary string payload; it is not
-- persisted in a database or joined to a category table.

-- ================================================================
-- SECTION 5: Monthly Budgets
-- ================================================================
-- NO DATABASE QUERY — monthly budgets.
-- No Budget model/table, route, service, or repository exists. No
-- category-wise or total budget comparison is implemented in SQL or
-- persisted application data.

-- ================================================================
-- SECTION 6: Dashboard and Analytics
-- ================================================================
-- Module: analytics.routes -> analytics.controller
--          -> analytics.service -> report.repository
--
-- NO DATABASE QUERY — dashboard and analytics summary.
-- backend/src/repositories/report.repository.js returns a fixed JavaScript
-- object containing hard-coded totalIncome, totalExpenses, netSavings,
-- monthlyTrend, and topCategory values. It performs no SUM(), COUNT(),
-- GROUP BY, JOIN, or table read.
--
-- The analytics route is not mounted in backend/src/app.js, and no
-- PostgreSQL analytics schema exists.

-- ================================================================
-- SECTION 7: Smart Features
-- ================================================================
-- NO DATABASE QUERY — unusual flags, recurring payments, insights,
-- forecast data, or saved model metrics.
-- The active application has no models, routes, services, repositories,
-- or database tables for these features. The README describes the product
-- domain but does not implement the feature queries.

-- ================================================================
-- SECTION 8: Demo Data
-- ================================================================
-- NO DATABASE QUERY — demo data loading, retrieval, or reset.
-- The auth middleware fabricates req.user = { id: "demo-user",
-- email: "demo@insight.ai" }, and report.repository.js returns fixed
-- constants. Neither operation writes or reads database records.
-- In-memory users and transactions are process-local arrays and are lost
-- when the Node.js process stops.

-- ================================================================
-- SECTION 9: Account Deletion and Data Integrity
-- ================================================================
-- NO DATABASE QUERY — account deletion or associated data cleanup.
-- The active schema contains only the independent "User" table, and no
-- account-deletion endpoint is implemented. Accordingly, no destructive
-- DELETE or cascade operation is documented or executed.
--
-- The only data-integrity rule implemented at the database level is the
-- unique email constraint from the migration:
-- "User_email_key" uniquely indexes "email".
-- No application-level user_id filtering can be documented for transaction,
-- category, budget, import, or analytics tables because those tables and
-- relationships do not exist in the active PostgreSQL/Prisma schema.
--
-- ================================================================
-- JOIN Operations
-- ================================================================
-- No JOIN operations are included because the active schema has one table,
-- "User", and no implemented foreign-key relationship to join. No JOIN
-- is forced against the separate dbms/sql/01_schema.sql dataset.
