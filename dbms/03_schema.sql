-- PostgreSQL schema for the supplied UPI CSV files
-- This file contains table creation statements only.

CREATE TABLE cities (
    city_id INTEGER PRIMARY KEY,
    city_name VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL
);

CREATE TABLE users (
    user_id INTEGER PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    city_id INTEGER NOT NULL REFERENCES cities(city_id),
    kyc_status VARCHAR(30) NOT NULL,
    is_blocked BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE bank_accounts (
    account_id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    bank_name VARCHAR(150) NOT NULL,
    ifsc VARCHAR(11) NOT NULL,
    account_last4 CHAR(4) NOT NULL,
    account_type VARCHAR(30) NOT NULL,
    is_primary BOOLEAN NOT NULL,
    linked_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE vpas (
    vpa VARCHAR(255) PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    account_id INTEGER NOT NULL REFERENCES bank_accounts(account_id),
    is_active BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE merchants (
    merchant_id INTEGER PRIMARY KEY,
    merchant_name VARCHAR(200) NOT NULL,
    mcc VARCHAR(10) NOT NULL,
    merchant_vpa VARCHAR(255) NOT NULL,
    city_id INTEGER NOT NULL REFERENCES cities(city_id),
    is_verified BOOLEAN NOT NULL,
    onboarded_on DATE NOT NULL
);

CREATE TABLE transactions (
    txn_id BIGINT PRIMARY KEY,
    upi_ref VARCHAR(12) NOT NULL UNIQUE,
    txn_type VARCHAR(10) NOT NULL,
    payer_vpa VARCHAR(255) NOT NULL REFERENCES vpas(vpa),
    payee_vpa VARCHAR(255) NOT NULL,
    merchant_id INTEGER REFERENCES merchants(merchant_id),
    amount NUMERIC(12, 2) NOT NULL,
    note TEXT,
    initiated_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL,
    failure_code VARCHAR(30)
);

CREATE TABLE bill_payments (
    bill_id BIGINT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    biller_category VARCHAR(50) NOT NULL,
    biller_name VARCHAR(150) NOT NULL,
    consumer_number VARCHAR(100) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL,
    paid_at TIMESTAMPTZ
);

CREATE TABLE rewards (
    reward_id BIGINT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    txn_id BIGINT REFERENCES transactions(txn_id),
    reward_type VARCHAR(50) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(30) NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    credited_at TIMESTAMPTZ
);

CREATE TABLE disputes (
    dispute_id BIGINT PRIMARY KEY,
    txn_id BIGINT NOT NULL REFERENCES transactions(txn_id),
    raised_by INTEGER NOT NULL REFERENCES users(user_id),
    reason VARCHAR(100) NOT NULL,
    raised_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(30) NOT NULL,
    resolved_at TIMESTAMPTZ
);
