-- ============================================================================
-- Project: FinSight – AI-Powered Financial Intelligence Platform
-- Document: PostgreSQL Database Schema (Checkpoint 2)
-- File: dbms/03_schema.sql
-- Target Database: PostgreSQL 15+
-- Description: Complete relational DDL schema implementing BCNF-compliant
--              tables, primary keys, foreign keys, check constraints,
--              unique constraints, indexes, and automated timestamp triggers.
-- Matches: dbms/01_normalization.md and dbms/02_er_diagram.png
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Extensions & Global Configuration
-- ----------------------------------------------------------------------------
-- Enable pgcrypto for UUID generation functions (native gen_random_uuid() in PG 13+)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean teardown in reverse dependency order for idempotent execution
DROP TABLE IF EXISTS insight_transactions CASCADE;
DROP TABLE IF EXISTS insights CASCADE;
DROP TABLE IF EXISTS unusual_spending_flags CASCADE;
DROP TABLE IF EXISTS recurring_payments CASCADE;
DROP TABLE IF EXISTS budgets CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS statement_imports CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop shared trigger function if already exists
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ----------------------------------------------------------------------------
-- Shared Trigger Function for updated_at Timestamps
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. Table: users
-- Core identity and authentication table.
-- Password hashes (bcrypt/argon2) are stored; plaintext passwords are never saved.
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT chk_users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_users_name_nonempty CHECK (LENGTH(TRIM(name)) >= 2)
);

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 2. Table: accounts
-- Financial depository and credit accounts owned by users (e.g., Checking,
-- Savings, Credit Card, Investment).
-- ============================================================================
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    account_type VARCHAR(30) NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    balance NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Keys
    CONSTRAINT fk_accounts_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    -- Constraints
    CONSTRAINT uq_accounts_user_bank_number UNIQUE (user_id, bank_name, account_number),
    CONSTRAINT chk_accounts_type CHECK (
        account_type IN ('CHECKING', 'SAVINGS', 'CREDIT_CARD', 'INVESTMENT', 'CASH', 'LOAN')
    ),
    CONSTRAINT chk_accounts_currency_length CHECK (LENGTH(currency) = 3)
);

CREATE TRIGGER trg_accounts_updated_at
BEFORE UPDATE ON accounts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. Table: categories
-- Standardized spending and income classification taxonomy.
-- Supports system-defined global categories (user_id IS NULL) and
-- custom user-created categories (user_id IS NOT NULL).
-- ============================================================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    name VARCHAR(60) NOT NULL,
    category_type VARCHAR(20) NOT NULL,
    description VARCHAR(255),
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Keys
    CONSTRAINT fk_categories_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    -- Constraints
    CONSTRAINT chk_categories_type CHECK (
        category_type IN ('INCOME', 'EXPENSE', 'TRANSFER')
    ),
    CONSTRAINT chk_categories_system_ownership CHECK (
        (is_system = TRUE AND user_id IS NULL) OR
        (is_system = FALSE AND user_id IS NOT NULL)
    ),
    CONSTRAINT chk_categories_name_nonempty CHECK (LENGTH(TRIM(name)) >= 2)
);

-- Unique index: System category names must be globally unique
CREATE UNIQUE INDEX uq_categories_system_name 
ON categories (LOWER(name)) 
WHERE user_id IS NULL;

-- Unique index: Custom category names must be unique per user
CREATE UNIQUE INDEX uq_categories_user_name 
ON categories (user_id, LOWER(name)) 
WHERE user_id IS NOT NULL;

-- ============================================================================
-- 4. Table: statement_imports
-- Batch file ingestion log for uploaded CSV/PDF financial statements.
-- Tracks processing status, deduplication hash, row counts, and error reports.
-- ============================================================================
CREATE TABLE statement_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    account_id UUID,
    file_name VARCHAR(255) NOT NULL,
    file_hash CHAR(64) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    file_type VARCHAR(50) NOT NULL DEFAULT 'text/csv',
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    total_rows INTEGER NOT NULL DEFAULT 0,
    imported_rows INTEGER NOT NULL DEFAULT 0,
    rejected_rows INTEGER NOT NULL DEFAULT 0,
    error_report JSONB DEFAULT '[]'::jsonb,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMPTZ,

    -- Foreign Keys
    CONSTRAINT fk_statement_imports_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_statement_imports_account
        FOREIGN KEY (account_id)
        REFERENCES accounts(id)
        ON DELETE SET NULL,

    -- Constraints
    CONSTRAINT uq_statement_imports_user_file_hash UNIQUE (user_id, file_hash),
    CONSTRAINT chk_statement_imports_file_size CHECK (file_size_bytes > 0),
    CONSTRAINT chk_statement_imports_status CHECK (
        status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'PARTIALLY_FAILED')
    ),
    CONSTRAINT chk_statement_imports_row_counts CHECK (
        total_rows >= 0 AND
        imported_rows >= 0 AND
        rejected_rows >= 0 AND
        (imported_rows + rejected_rows <= total_rows)
    )
);

-- ============================================================================
-- 5. Table: transactions
-- Master financial ledger tracking individual income, debit, and credit items.
-- Uses exact NUMERIC data types for monetary amounts.
-- Incorporates a deterministic transaction_hash to prevent duplicate records.
-- ============================================================================
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    account_id UUID NOT NULL,
    category_id UUID NOT NULL,
    statement_import_id UUID,
    transaction_date DATE NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    merchant VARCHAR(100) NOT NULL,
    description VARCHAR(255) NOT NULL DEFAULT 'No description',
    is_manually_categorized BOOLEAN NOT NULL DEFAULT FALSE,
    original_category_id UUID,
    categorized_by VARCHAR(30) NOT NULL DEFAULT 'SYSTEM',
    transaction_hash CHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Keys
    CONSTRAINT fk_transactions_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_transactions_account
        FOREIGN KEY (account_id)
        REFERENCES accounts(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_transactions_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_transactions_original_category
        FOREIGN KEY (original_category_id)
        REFERENCES categories(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_transactions_statement_import
        FOREIGN KEY (statement_import_id)
        REFERENCES statement_imports(id)
        ON DELETE SET NULL,

    -- Constraints
    CONSTRAINT uq_transactions_account_hash UNIQUE (account_id, transaction_hash),
    CONSTRAINT chk_transactions_positive_amount CHECK (amount > 0),
    CONSTRAINT chk_transactions_type CHECK (
        transaction_type IN ('DEBIT', 'CREDIT')
    ),
    CONSTRAINT chk_transactions_categorized_by CHECK (
        categorized_by IN ('SYSTEM', 'USER', 'RULE', 'AI')
    ),
    CONSTRAINT chk_transactions_merchant_nonempty CHECK (LENGTH(TRIM(merchant)) >= 1)
);

CREATE TRIGGER trg_transactions_updated_at
BEFORE UPDATE ON transactions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. Table: budgets
-- Monthly expenditure ceilings configured by users for specific categories.
-- Prevents duplicate budget definitions for the same user, category, and month.
-- ============================================================================
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    category_id UUID NOT NULL,
    monthly_limit NUMERIC(12,2) NOT NULL,
    period_month SMALLINT NOT NULL,
    period_year SMALLINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Keys
    CONSTRAINT fk_budgets_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_budgets_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE CASCADE,

    -- Constraints
    CONSTRAINT uq_budgets_user_cat_period UNIQUE (user_id, category_id, period_month, period_year),
    CONSTRAINT chk_budgets_limit_nonnegative CHECK (monthly_limit >= 0),
    CONSTRAINT chk_budgets_month_valid CHECK (period_month BETWEEN 1 AND 12),
    CONSTRAINT chk_budgets_year_valid CHECK (period_year >= 2020)
);

CREATE TRIGGER trg_budgets_updated_at
BEFORE UPDATE ON budgets
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. Table: recurring_payments
-- AI-detected or user-configured recurring charges (subscriptions, utilities, bills).
-- ============================================================================
CREATE TABLE recurring_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    account_id UUID,
    category_id UUID,
    merchant_name VARCHAR(100) NOT NULL,
    expected_amount NUMERIC(12,2) NOT NULL,
    frequency VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    last_payment_date DATE,
    next_expected_date DATE NOT NULL,
    confidence_score NUMERIC(4,3) NOT NULL DEFAULT 1.000,
    detected_by VARCHAR(30) NOT NULL DEFAULT 'SYSTEM',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Keys
    CONSTRAINT fk_recurring_payments_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_recurring_payments_account
        FOREIGN KEY (account_id)
        REFERENCES accounts(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_recurring_payments_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE SET NULL,

    -- Constraints
    CONSTRAINT chk_recurring_payments_amount CHECK (expected_amount > 0),
    CONSTRAINT chk_recurring_payments_frequency CHECK (
        frequency IN ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY')
    ),
    CONSTRAINT chk_recurring_payments_status CHECK (
        status IN ('ACTIVE', 'PAUSED', 'CANCELLED', 'FLAGGED')
    ),
    CONSTRAINT chk_recurring_payments_confidence CHECK (
        confidence_score BETWEEN 0.000 AND 1.000
    ),
    CONSTRAINT chk_recurring_payments_detected_by CHECK (
        detected_by IN ('SYSTEM', 'AI_MODEL', 'USER')
    )
);

CREATE TRIGGER trg_recurring_payments_updated_at
BEFORE UPDATE ON recurring_payments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. Table: unusual_spending_flags
-- Smart anomaly flags generated when transactions exceed expected thresholds
-- or diverge from learned user behavioral baselines (1:0..1 with transactions).
-- ============================================================================
CREATE TABLE unusual_spending_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL,
    flag_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    anomaly_score NUMERIC(4,3) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'FLAGGED',
    explanation TEXT NOT NULL,
    flagged_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMPTZ,

    -- Foreign Keys
    CONSTRAINT fk_flags_transaction
        FOREIGN KEY (transaction_id)
        REFERENCES transactions(id)
        ON DELETE CASCADE,

    -- Constraints (Enforces 1:0..1 relationship)
    CONSTRAINT uq_flags_transaction UNIQUE (transaction_id),
    CONSTRAINT chk_flags_type CHECK (
        flag_type IN (
            'UNUSUAL_AMOUNT',
            'HIGH_FREQUENCY',
            'NEW_MERCHANT',
            'OUT_OF_PATTERN',
            'DUPLICATE_SUSPECT',
            'WEEKEND_SPIKE'
        )
    ),
    CONSTRAINT chk_flags_severity CHECK (
        severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
    ),
    CONSTRAINT chk_flags_score CHECK (
        anomaly_score BETWEEN 0.000 AND 1.000
    ),
    CONSTRAINT chk_flags_status CHECK (
        status IN ('FLAGGED', 'REVIEWED', 'CONFIRMED_FRAUD', 'DISMISSED', 'RESOLVED')
    )
);

-- ============================================================================
-- 9. Table: insights
-- High-level AI-generated financial insights, budget alerts, and cash-flow recommendations.
-- ============================================================================
CREATE TABLE insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    insight_type VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    impact_score NUMERIC(4,3),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    generated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMPTZ,

    -- Foreign Keys
    CONSTRAINT fk_insights_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    -- Constraints
    CONSTRAINT chk_insights_type CHECK (
        insight_type IN (
            'SPENDING_SURGE',
            'BUDGET_OVERRUN',
            'SAVINGS_OPPORTUNITY',
            'RECURRING_PRICE_HIKE',
            'INCOME_IRREGULARITY',
            'CASH_FLOW_WARNING'
        )
    ),
    CONSTRAINT chk_insights_impact CHECK (
        impact_score IS NULL OR (impact_score BETWEEN 0.000 AND 1.000)
    ),
    CONSTRAINT chk_insights_status CHECK (
        status IN ('ACTIVE', 'ACKNOWLEDGED', 'ARCHIVED', 'DISMISSED')
    )
);

-- ============================================================================
-- 10. Table: insight_transactions
-- Junction table connecting generated insights to their supporting/triggering
-- transactions (enforces traceability of all AI recommendations).
-- ============================================================================
CREATE TABLE insight_transactions (
    insight_id UUID NOT NULL,
    transaction_id UUID NOT NULL,
    relevance_score NUMERIC(4,3) NOT NULL DEFAULT 1.000,
    linked_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Primary Key (Composite)
    CONSTRAINT pk_insight_transactions PRIMARY KEY (insight_id, transaction_id),

    -- Foreign Keys
    CONSTRAINT fk_insight_transactions_insight
        FOREIGN KEY (insight_id)
        REFERENCES insights(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_insight_transactions_transaction
        FOREIGN KEY (transaction_id)
        REFERENCES transactions(id)
        ON DELETE CASCADE,

    -- Constraints
    CONSTRAINT chk_insight_transactions_relevance CHECK (
        relevance_score BETWEEN 0.000 AND 1.000
    )
);

-- ============================================================================
-- 11. Performance & Foreign Key Indexes
-- ============================================================================

-- Foreign Key Indexes (Eliminates full table scans on joins and cascading deletes)
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_statement_imports_user_id ON statement_imports(user_id);
CREATE INDEX idx_statement_imports_account_id ON statement_imports(account_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_statement_import_id ON transactions(statement_import_id);
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_category_id ON budgets(category_id);
CREATE INDEX idx_recurring_payments_user_id ON recurring_payments(user_id);
CREATE INDEX idx_recurring_payments_category_id ON recurring_payments(category_id);
CREATE INDEX idx_unusual_spending_flags_transaction_id ON unusual_spending_flags(transaction_id);
CREATE INDEX idx_insights_user_id ON insights(user_id);
CREATE INDEX idx_insight_transactions_transaction_id ON insight_transactions(transaction_id);

-- Analytical & Filtering Composite Indexes
CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_account_date ON transactions(account_id, transaction_date DESC);
CREATE INDEX idx_transactions_merchant_search ON transactions(LOWER(merchant));
CREATE INDEX idx_statement_imports_pending ON statement_imports(status) WHERE status IN ('PENDING', 'PROCESSING');
CREATE INDEX idx_recurring_payments_upcoming ON recurring_payments(next_expected_date) WHERE status = 'ACTIVE';
CREATE INDEX idx_unusual_flags_active ON unusual_spending_flags(status) WHERE status = 'FLAGGED';
CREATE INDEX idx_insights_user_active ON insights(user_id, status) WHERE status = 'ACTIVE';

-- ============================================================================
-- 12. Standard System Categories Seed Data
-- Default baseline taxonomy for Finsight-AI personal and commercial expense tracking.
-- ============================================================================
INSERT INTO categories (id, user_id, name, category_type, description, is_system) VALUES
    ('00000000-0000-0000-0000-000000000001', NULL, 'Food & Dining', 'EXPENSE', 'Restaurants, cafes, food delivery, and bars', TRUE),
    ('00000000-0000-0000-0000-000000000002', NULL, 'Groceries', 'EXPENSE', 'Supermarkets, organic food, and grocery staples', TRUE),
    ('00000000-0000-0000-0000-000000000003', NULL, 'Utilities & Bills', 'EXPENSE', 'Electricity, gas, water, internet, and mobile phone bills', TRUE),
    ('00000000-0000-0000-0000-000000000004', NULL, 'Rent & Housing', 'EXPENSE', 'Monthly rent, mortgage payments, HOA, and home maintenance', TRUE),
    ('00000000-0000-0000-0000-000000000005', NULL, 'Transportation', 'EXPENSE', 'Fuel, public transit, rideshare, parking, and toll fees', TRUE),
    ('00000000-0000-0000-0000-000000000006', NULL, 'Healthcare & Medical', 'EXPENSE', 'Doctor visits, pharmacies, health insurance, and dental care', TRUE),
    ('00000000-0000-0000-0000-000000000007', NULL, 'Entertainment & Leisure', 'EXPENSE', 'Streaming services, movies, concerts, and gaming', TRUE),
    ('00000000-0000-0000-0000-000000000008', NULL, 'Salary & Wages', 'INCOME', 'Primary employment salary, payroll direct deposits, and bonuses', TRUE),
    ('00000000-0000-0000-0000-000000000009', NULL, 'Investments & Dividends', 'INCOME', 'Stock dividends, interest, capital gains, and crypto yield', TRUE),
    ('00000000-0000-0000-0000-000000000010', NULL, 'Internal Transfer', 'TRANSFER', 'Transfers between user checking, savings, and investment accounts', TRUE)
ON CONFLICT DO NOTHING;
