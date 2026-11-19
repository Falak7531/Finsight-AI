# FinSight — Database Query Performance & Execution Plan Analysis

## 1. Introduction

**FinSight – AI-Powered Financial Intelligence Platform** relies on PostgreSQL for both low-latency user-facing financial queries (transaction history, recurring bills, personal insights) and multi-table analytical workloads (category-wise spending, anomaly detection, monthly trends, and merchant risk-adjusted GMV reporting).

The objective of this benchmark is to:
- Measure actual PostgreSQL query planning and execution latencies against the populated FinSight UPI database (`dbms/03_schema.sql`).
- Capture and analyze genuine `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` execution plans for 10 representative fintech queries (`Q1`–`Q10`).
- Evaluate how PostgreSQL's cost-based query planner behaves under the current baseline indexing strategy (primary keys and unique constraints only, with zero secondary indexes).
- Identify concrete, evidence-backed indexing and query-restructuring optimizations while weighing read-performance gains against write amplification and storage overhead.

### Schema Alignment Note
The repository contains two PostgreSQL schemas:
1. **`dbms/03_schema.sql`** (deployed in the local `gpay` database under schema `gpay`): a 9-table normalized UPI financial dataset (`cities`, `users`, `bank_accounts`, `vpas`, `merchants`, `transactions`, `bill_payments`, `rewards`, `disputes`) containing 250,468 transactions and 40,000 users.
2. **`backend/prisma/schema.prisma`** (deployed in `finsight_ai`): a minimal single-table `User` schema used only for authentication signup.

All benchmark queries in this document target the actual 9-table schema defined in [`dbms/03_schema.sql`](./03_schema.sql) and executed against the populated `gpay` database. Because `dbms/03_schema.sql` does not define dedicated `budgets`, `anomalies`, or `ai_insights` tables, queries `Q5`, `Q7`, and `Q8` are formulated strictly over existing tables and columns (using parameterized `VALUES` budget ceilings, statistical z-score + `disputes` detection, and multi-source insight derivation, respectively) without inventing nonexistent schema objects.

---

## 2. Database Environment

All measurements were collected from a live local PostgreSQL instance with no schema modifications.

### 2.1 System & PostgreSQL Configuration

| Parameter | Verified Value |
|---|---|
| **PostgreSQL Version** | `PostgreSQL 18.6 (Postgres.app) on aarch64-apple-darwin23.6.0, compiled by Apple clang version 15.0.0 (clang-1500.3.9.4), 64-bit` |
| **Operating System** | `macOS 27.2 (Build 26B123)`, `arm64` (Apple Silicon) |
| **Hardware Resources** | 10 CPU cores, 16 GB RAM (`17,179,869,184` bytes) |
| **Target Database / Schema** | Database `gpay`, `search_path = gpay, public` |
| **Total Database Size** | `83 MB` |
| **Transaction Date Range** | `2025-01-01 00:00:00+05:30` to `2026-06-30 23:56:51+05:30` (18 months) |
| **`shared_buffers`** | `128 MB` (`16384 × 8 kB`) |
| **`work_mem`** | `4 MB` (`4096 kB`) |
| **`effective_cache_size`** | `4 GB` (`524288 × 8 kB`) |
| **`max_parallel_workers_per_gather`** | `2` |
| **`seq_page_cost` / `random_page_cost`** | `1` / `4` |
| **`jit`** | `on` |

### 2.2 Table Inventory & Dataset Size

| Table | Row Count | Heap Size | Primary Purpose |
|---|---:|---:|---|
| `transactions` | 250,468 | 36 MB | UPI P2M (139,887) and P2P (110,581) payment ledger |
| `bank_accounts` | 53,333 | 4,768 kB | User-linked bank accounts (`IFSC`, account type, primary flag) |
| `vpas` | 53,333 | 4,256 kB | Virtual Payment Addresses mapping users and bank accounts |
| `rewards` | 39,799 | 4,152 kB | Cashback, coupons, and scratch cards linked to users/transactions |
| `users` | 40,000 | 3,936 kB | Customer profiles, KYC status, city, block status |
| `bill_payments` | 30,000 | 3,112 kB | Recurring utility bills (`MOBILE`, `ELECTRICITY`, `BROADBAND`, etc.) |
| `disputes` | 3,569 | 400 kB | Transaction disputes (`FRAUD`, `DUPLICATE_PAYMENT`, etc.) |
| `merchants` | 3,000 | 312 kB | Registered merchants across 10 Merchant Category Codes (`mcc`) |
| `cities` | 10 | 8 kB | Reference city/state lookup table |

### 2.3 Available Baseline Indexes

Only the 10 constraint-backed B-tree indexes created by `dbms/03_schema.sql` exist in the database. **No secondary indexes** exist on foreign key columns (`vpas.user_id`, `transactions.payer_vpa`, `transactions.payee_vpa`, `transactions.merchant_id`, `bill_payments.user_id`, `rewards.user_id`, `disputes.txn_id`, `disputes.raised_by`) or temporal/filter columns (`transactions.initiated_at`, `transactions.status`, `bill_payments.due_date`).

| Index Name | Table | Access Method | Definition Basis | Size |
|---|---|---|---|---:|
| `transactions_upi_ref_key` | `transactions` | `btree` (unique) | `UNIQUE (upi_ref)` | 7,736 kB |
| `transactions_pkey` | `transactions` | `btree` (unique) | `PRIMARY KEY (txn_id)` | 5,512 kB |
| `vpas_pkey` | `vpas` | `btree` (unique) | `PRIMARY KEY (vpa)` | 2,392 kB |
| `bank_accounts_pkey` | `bank_accounts` | `btree` (unique) | `PRIMARY KEY (account_id)` | 1,184 kB |
| `users_pkey` | `users` | `btree` (unique) | `PRIMARY KEY (user_id)` | 896 kB |
| `rewards_pkey` | `rewards` | `btree` (unique) | `PRIMARY KEY (reward_id)` | 888 kB |
| `bill_payments_pkey` | `bill_payments` | `btree` (unique) | `PRIMARY KEY (bill_id)` | 672 kB |
| `disputes_pkey` | `disputes` | `btree` (unique) | `PRIMARY KEY (dispute_id)` | 96 kB |
| `merchants_pkey` | `merchants` | `btree` (unique) | `PRIMARY KEY (merchant_id)` | 88 kB |
| `cities_pkey` | `cities` | `btree` (unique) | `PRIMARY KEY (city_id)` | 16 kB |

---

## 3. Benchmark Methodology

1. **Read-Only Execution Safety:** Every benchmark query is a read-only `SELECT` statement. No `INSERT`, `UPDATE`, `DELETE`, or `DDL` statements were executed during benchmarking.
2. **Execution Plan Capture:** Each query was profiled using PostgreSQL's:
   - `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` — executes the query, records actual row counts, per-node timings, planning time, execution time, and buffer statistics, and outputs machine-readable JSON saved under [`dbms/plans/`](./plans/).
   - `EXPLAIN (ANALYZE, BUFFERS)` — captured alongside JSON to cross-verify operator trees, sort methods, and hash-batch memory usage.
3. **Repeated Measurements:** To reduce run-to-run jitter from OS scheduling and worker startup, each query was executed **6 times** (1 warm-up run followed by 5 measured runs). The **median** execution-time run from the 5 measured runs is saved as the canonical JSON plan in `dbms/plans/`, and the full min–max range is reported in Section 5.
4. **Representative User Parameter:** Single-user queries (`Q1`, `Q2`, `Q3`, `Q5`, `Q8`) use `user_id = 31112` (*Priya Das*), a verified active user with 16 sent transactions (7 successful P2M, 7 successful P2P, 2 failed), 2 received P2P transactions, 2 bill payments, 4 rewards, and 1 resolved duplicate-payment dispute.
5. **Planning Time vs. Execution Time vs. Estimated Cost:**
   - **Planning Time (ms):** Wall-clock time spent parsing, rewriting, and optimizing the query plan.
   - **Execution Time (ms):** Wall-clock time spent executing the chosen plan and fetching all rows.
   - **Estimated Cost:** Dimensionless planner units (relative to sequential page fetch = `1.0`) used solely for plan comparison — never equated to milliseconds.
6. **Warm-Cache vs. Cold-Cache & Ring-Buffer Effects:**
   - Because PostgreSQL and macOS cache recently read pages in `shared_buffers` and the OS page cache, repeated runs reflect **warm-cache** performance.
   - Notably, `transactions` is `36 MB` (`4,616` 8 kB pages), which exceeds `shared_buffers / 4` (`32 MB`). PostgreSQL therefore engages its `BAS_BULKREAD` 256 kB ring buffer for full sequential scans of `transactions`, explaining why `Q1` (`shared read=2262`) and `Q2` (`shared read=570`) reported buffer reads from OS page cache before pages became resident in `shared_buffers`.

---

## 4. Query Benchmark Results

The table below reports actual measured values from the representative median run saved in `dbms/plans/`.

| Query ID | Query Name | Planning Time | Execution Time | Rows Returned | Index Usage |
|---|---|---:|---:|---:|---|
| **Q1** | User Transaction History | 1.137 ms | 16.973 ms | 16 | `bank_accounts_pkey`, `merchants_pkey` (Seq Scan on `transactions`, `vpas`) |
| **Q2** | Monthly Spending Summary | 1.009 ms | 23.226 ms | 13 | `merchants_pkey` (Seq Scan on `transactions`, `vpas`) |
| **Q3** | Income vs Expense Analysis | 1.339 ms | 114.236 ms | 1 | None (Seq Scans on `transactions` ×2, `vpas`, `rewards`, `bill_payments`) |
| **Q4** | Category-wise Spending | 0.709 ms | 125.740 ms | 10 | None (Seq Scans on `transactions`, `merchants`) |
| **Q5** | Budget Utilization | 1.121 ms | 24.186 ms | 8 | `merchants_pkey` (Seq Scan on `transactions`, `vpas`, `bill_payments`) |
| **Q6** | Recurring Expense Analysis | 0.620 ms | 10.715 ms | 50 | None (Seq Scans on `bill_payments`, `users`) |
| **Q7** | Anomaly Detection Records | 1.488 ms | 93.766 ms | 50 | `vpas_pkey` (Seq Scans on `transactions` ×2, `merchants` ×2, `disputes`) |
| **Q8** | AI Financial Insights | 1.292 ms | 16.570 ms | 9 | `transactions_pkey` (Seq Scans on `rewards`, `bill_payments`, `disputes`, `transactions`, `vpas`) |
| **Q9** | Monthly Financial Trends | 0.494 ms | 95.809 ms | 18 | None (Seq Scan on `transactions`) |
| **Q10** | Advanced Analytical Query | 2.390 ms | 146.975 ms | 30 | None (7-table Seq Scan + Hash Joins) |

### Supplementary Stability & Buffer Telemetry (5 Measured Runs)

| Query ID | Min Exec | Median Exec | Mean Exec | Max Exec | Shared Hit Blocks | Shared Read Blocks | Execution Plan File |
|---|---:|---:|---:|---:|---:|---:|---|
| **Q1** | 16.756 ms | 16.973 ms | 17.204 ms | 17.828 ms | 3,991 | 2,262 | [`q01_transaction_history.json`](./plans/q01_transaction_history.json) |
| **Q2** | 22.804 ms | 23.226 ms | 23.347 ms | 24.108 ms | 5,665 | 570 | [`q02_monthly_spending.json`](./plans/q02_monthly_spending.json) |
| **Q3** | 112.738 ms | 114.236 ms | 113.972 ms | 114.945 ms | 10,660 | 0 | [`q03_income_vs_expense.json`](./plans/q03_income_vs_expense.json) |
| **Q4** | 123.167 ms | 125.740 ms | 126.259 ms | 131.347 ms | 4,657 | 0 | [`q04_category_spending.json`](./plans/q04_category_spending.json) |
| **Q5** | 24.003 ms | 24.186 ms | 24.189 ms | 24.430 ms | 6,614 | 0 | [`q05_budget_utilization.json`](./plans/q05_budget_utilization.json) |
| **Q6** | 9.360 ms | 10.715 ms | 10.461 ms | 11.128 ms | 879 | 0 | [`q06_recurring_expenses.json`](./plans/q06_recurring_expenses.json) |
| **Q7** | 93.464 ms | 93.766 ms | 93.816 ms | 94.315 ms | 19,042 | 0 | [`q07_anomaly_records.json`](./plans/q07_anomaly_records.json) |
| **Q8** | 16.389 ms | 16.570 ms | 16.526 ms | 16.624 ms | 7,154 | 0 | [`q08_financial_insights.json`](./plans/q08_financial_insights.json) |
| **Q9** | 92.805 ms | 95.809 ms | 95.106 ms | 96.366 ms | 4,619 | 0 | [`q09_monthly_trends.json`](./plans/q09_monthly_trends.json) |
| **Q10** | 145.264 ms | 146.975 ms | 146.517 ms | 147.349 ms | 6,238 | 0 | [`q10_advanced_analytics.json`](./plans/q10_advanced_analytics.json) |

---

## 5. Individual Query Analysis

### Q1. User Transaction History

- **Objective:** Retrieve a user's recent transactions (`user_id = 31112`) enriched with merchant category (`merchants.mcc`), counterparty name, and linked bank account details, ordered newest-first (`LIMIT 50`).
- **Tables Involved:** `vpas`, `transactions`, `bank_accounts`, `merchants` (LEFT JOIN).
- **SQL Query (benchmark parameter `$1 = 31112`):**

```sql
SELECT
    t.txn_id,
    t.upi_ref,
    t.txn_type,
    t.amount,
    t.status,
    t.initiated_at,
    t.completed_at,
    COALESCE(m.merchant_name, 'P2P Transfer') AS counterparty,
    COALESCE(m.mcc, 'P2P') AS category_code,
    ba.bank_name,
    ba.account_last4
FROM vpas v
JOIN transactions t ON t.payer_vpa = v.vpa
JOIN bank_accounts ba ON ba.account_id = v.account_id
LEFT JOIN merchants m ON m.merchant_id = t.merchant_id
WHERE v.user_id = 31112
ORDER BY t.initiated_at DESC
LIMIT 50;
```

- **Measured Performance:** Planning `1.137 ms`, Execution `16.973 ms` (min `16.756 ms`, max `17.828 ms`), `16` rows returned, `3,991` shared hits + `2,262` shared reads (`6,253` total buffers).
- **Execution Plan Observations ([`q01_transaction_history.json`](./plans/q01_transaction_history.json)):**
  - PostgreSQL spawns 2 parallel workers (`Gather Merge`, `Workers Launched: 2`).
  - Each worker performs a full `Seq Scan` on `vpas` (`53,332` rows removed by `user_id = 31112`, `1,584` cumulative buffer hits) to build a 1-row hash table, then probes it with a `Parallel Seq Scan` across all `250,468` rows (`4,616` pages) of `transactions`.
  - For the 16 surviving rows, PostgreSQL uses a `Nested Loop` with **`Memoize`** over `Index Scan using bank_accounts_pkey` (caching `v.account_id` so only 3 index lookups occur across 3 workers) and a `Nested Loop Left Join` using `Index Scan using merchants_pkey` (8 searches for the 8 P2M rows).
- **Index Usage:** `bank_accounts_pkey`, `merchants_pkey`. Neither `vpas(user_id)` nor `transactions(payer_vpa)` is indexed.
- **Optimization Opportunities:** Adding `CREATE INDEX idx_vpas_user_id ON vpas (user_id)` and `CREATE INDEX idx_transactions_payer_vpa_initiated_at ON transactions (payer_vpa, initiated_at DESC)` eliminates both full table scans and the `Sort` node, reducing 6,253 buffer accesses to ~20–40 pages (sub-millisecond latency).

---

### Q2. Monthly Spending Summary

- **Objective:** Aggregate a user's successful transactions by calendar month and category (`merchants.mcc` or `'P2P'`) over the 18-month dataset window.
- **Tables Involved:** `vpas`, `transactions`, `merchants` (LEFT JOIN).
- **SQL Query (parameters `$1 = 31112`, `$2 = '2025-01-01'`, `$3 = '2026-07-01'`):**

```sql
SELECT
    date_trunc('month', t.initiated_at)::date AS spending_month,
    COALESCE(m.mcc, 'P2P') AS category_code,
    COUNT(*) AS txn_count,
    SUM(t.amount) AS total_spent,
    ROUND(AVG(t.amount), 2) AS avg_txn_amount
FROM vpas v
JOIN transactions t ON t.payer_vpa = v.vpa
LEFT JOIN merchants m ON m.merchant_id = t.merchant_id
WHERE v.user_id = 31112
  AND t.status = 'SUCCESS'
  AND t.initiated_at >= TIMESTAMPTZ '2025-01-01 00:00:00+05:30'
  AND t.initiated_at <  TIMESTAMPTZ '2026-07-01 00:00:00+05:30'
GROUP BY date_trunc('month', t.initiated_at), COALESCE(m.mcc, 'P2P')
ORDER BY spending_month DESC, total_spent DESC;
```

- **Measured Performance:** Planning `1.009 ms`, Execution `23.226 ms` (min `22.804 ms`, max `24.108 ms`), `13` rows returned, `5,665` shared hits + `570` shared reads.
- **Execution Plan Observations ([`q02_monthly_spending.json`](./plans/q02_monthly_spending.json)):**
  - `Parallel Seq Scan` on `transactions` scans all 250,468 rows, filtering `status = 'SUCCESS'` and timestamp bounds (`5,853` rows removed per worker), hash-joined against `vpas` (`Seq Scan`), then `Nested Loop Left Join` via `Index Scan using merchants_pkey` (7 searches).
  - After `Gather`, the 14 matching rows are sorted (`quicksort`, `25 kB`), aggregated via `GroupAggregate` into 13 monthly category groups, and sorted again for final presentation.
- **Index Usage:** `merchants_pkey` only.
- **Optimization Opportunities:** The same composite index `transactions (payer_vpa, initiated_at DESC) INCLUDE (amount, status, merchant_id)` paired with `vpas (user_id)` converts the 250k-row parallel scan into an Index/Index-Only Scan for the user's ~16 rows.

---

### Q3. Income vs Expense Analysis

- **Objective:** Compute a user's total inflows (received P2P transfers + credited rewards), total outflows (sent transactions + paid utility bills), and net balance over a specified date range.
- **Tables Involved:** `vpas`, `transactions` (scanned twice: as `payee_vpa` and `payer_vpa`), `rewards`, `bill_payments`.
- **SQL Query (parameters `$1 = 31112`, `$2 = '2025-01-01'`, `$3 = '2026-07-01'`):**

```sql
WITH user_vpas AS (
    SELECT vpa
    FROM vpas
    WHERE user_id = 31112
),
p2p_inflows AS (
    SELECT COALESCE(SUM(t.amount), 0) AS inflow_amount, COUNT(*) AS inflow_count
    FROM transactions t
    JOIN user_vpas uv ON uv.vpa = t.payee_vpa
    WHERE t.status = 'SUCCESS'
      AND t.initiated_at >= TIMESTAMPTZ '2025-01-01 00:00:00+05:30'
      AND t.initiated_at <  TIMESTAMPTZ '2026-07-01 00:00:00+05:30'
),
reward_inflows AS (
    SELECT COALESCE(SUM(r.amount), 0) AS reward_amount
    FROM rewards r
    WHERE r.user_id = 31112
      AND r.status = 'CREDITED'
      AND r.credited_at >= TIMESTAMPTZ '2025-01-01 00:00:00+05:30'
      AND r.credited_at <  TIMESTAMPTZ '2026-07-01 00:00:00+05:30'
),
txn_outflows AS (
    SELECT COALESCE(SUM(t.amount), 0) AS txn_expense, COUNT(*) AS expense_count
    FROM transactions t
    JOIN user_vpas uv ON uv.vpa = t.payer_vpa
    WHERE t.status = 'SUCCESS'
      AND t.initiated_at >= TIMESTAMPTZ '2025-01-01 00:00:00+05:30'
      AND t.initiated_at <  TIMESTAMPTZ '2026-07-01 00:00:00+05:30'
),
bill_outflows AS (
    SELECT COALESCE(SUM(bp.amount), 0) AS bill_expense
    FROM bill_payments bp
    WHERE bp.user_id = 31112
      AND bp.status = 'PAID'
      AND bp.paid_at >= TIMESTAMPTZ '2025-01-01 00:00:00+05:30'
      AND bp.paid_at <  TIMESTAMPTZ '2026-07-01 00:00:00+05:30'
)
SELECT
    (pi.inflow_amount + ri.reward_amount) AS total_income,
    (to_.txn_expense + bo.bill_expense) AS total_expenses,
    (pi.inflow_amount + ri.reward_amount) - (to_.txn_expense + bo.bill_expense) AS net_balance,
    pi.inflow_count,
    to_.expense_count
FROM p2p_inflows pi
CROSS JOIN reward_inflows ri
CROSS JOIN txn_outflows to_
CROSS JOIN bill_outflows bo;
```

- **Measured Performance:** Planning `1.339 ms`, Execution `114.236 ms` (min `112.738 ms`, max `114.945 ms`), `1` row returned, `10,660` shared hits (`0` reads).
- **Execution Plan Observations ([`q03_income_vs_expense.json`](./plans/q03_income_vs_expense.json)):**
  - `user_vpas` is materialized once (`CTE Scan`, `528` buffers, `3.2 ms`), but **`transactions` is scanned sequentially TWICE in single-threaded mode**: `4,616` buffers (`40.8 ms`) for `payee_vpa` inflows and another `4,616` buffers (`33.8 ms`) for `payer_vpa` outflows!
  - Full sequential scans also occur on `rewards` (`515` buffers, `39,798` rows discarded) and `bill_payments` (`385` buffers, `29,998` rows discarded).
  - The four 1-row `Aggregate` results are combined via `Nested Loop` (evaluating the `CROSS JOIN` in microseconds).
- **Index Usage:** None (`0` indexes used).
- **Optimization Opportunities:**
  1. **Query Restructuring (zero DDL cost):** Combine `p2p_inflows` and `txn_outflows` into a single pass over `transactions` using `SUM(t.amount) FILTER (WHERE t.payee_vpa = uv.vpa)` and `SUM(t.amount) FILTER (WHERE t.payer_vpa = uv.vpa)`, cutting `transactions` I/O in half.
  2. **Targeted Indexes:** Indexes on `vpas(user_id)`, `transactions(payer_vpa)`, `transactions(payee_vpa)`, `rewards(user_id)`, and `bill_payments(user_id)` would reduce buffer touches from `10,660` to under `50`.

---

### Q4. Category-wise Spending

- **Objective:** Rank all 10 Merchant Category Codes (`merchants.mcc`) by total successful P2M spending in H1 2026 (`2026-01-01` to `2026-06-30`), including transaction count, unique payers, average ticket size, and percentage share of total spend.
- **Tables Involved:** `transactions`, `merchants`.
- **SQL Query:**

```sql
SELECT
    m.mcc AS category_code,
    COUNT(*) AS txn_count,
    COUNT(DISTINCT t.payer_vpa) AS unique_payers,
    SUM(t.amount) AS total_spent,
    ROUND(AVG(t.amount), 2) AS avg_ticket_size,
    ROUND(100.0 * SUM(t.amount) / SUM(SUM(t.amount)) OVER (), 2) AS spend_share_pct
FROM transactions t
JOIN merchants m ON m.merchant_id = t.merchant_id
WHERE t.txn_type = 'P2M'
  AND t.status = 'SUCCESS'
  AND t.initiated_at >= TIMESTAMPTZ '2026-01-01 00:00:00+05:30'
  AND t.initiated_at <  TIMESTAMPTZ '2026-07-01 00:00:00+05:30'
GROUP BY m.mcc
ORDER BY total_spent DESC;
```

- **Measured Performance:** Planning `0.709 ms`, Execution `125.740 ms` (min `123.167 ms`, max `131.347 ms`), `10` rows returned, `4,657` shared hits (`0` reads).
- **Execution Plan Observations ([`q04_category_spending.json`](./plans/q04_category_spending.json)):**
  - `Seq Scan` on `transactions` (`4,616` buffers, `27.6 ms`) filters `250,468` rows down to `43,213` matching rows (`17.3%` selectivity).
  - `Hash Join` against `merchants` (`3,000` rows, `35` buffers, `161 kB` hash table) finishes at `34.2 ms`.
  - **Primary bottleneck (~78 ms, 62% of total time):** Because of `COUNT(DISTINCT t.payer_vpa)`, PostgreSQL cannot use a simple `HashAggregate`; it performs a `Sort` of all `43,213` rows on `(m.mcc, t.payer_vpa)` (`quicksort`, `3,598 kB` memory — right below `work_mem = 4 MB`) before `GroupAggregate`, `WindowAgg`, and final `Sort`.
- **Index Usage:** None.
- **Optimization Opportunities:** A composite index on `transactions (txn_type, status, initiated_at)` or a `BRIN` index on `transactions (initiated_at)` reduces scanned heap pages for time-bounded analytics. Increasing `work_mem` (e.g., to `16 MB`) prevents disk-spill risk if H1 volume grows, while avoiding `COUNT(DISTINCT ...)` on dashboards that do not strictly require exact distinct counts enables parallel `HashAggregate`.

---

### Q5. Budget Utilization

- **Objective:** Compare a user's (`user_id = 31112`) actual spending across both P2M merchant categories (`merchants.mcc`) and utility bill categories (`bill_payments.biller_category`) against parameterized category budget ceilings (`VALUES` CTE, since no `budgets` table exists in `dbms/03_schema.sql`), flagging `EXCEEDED`, `WARNING` (≥80%), or `ON_TRACK`.
- **Tables Involved:** `vpas`, `transactions`, `merchants`, `bill_payments`.
- **SQL Query:**

```sql
WITH category_budgets (category_code, budget_limit) AS (
    VALUES
        ('5411', 5000.00::numeric),
        ('5541', 4000.00::numeric),
        ('5814', 3500.00::numeric),
        ('5912', 2000.00::numeric),
        ('4111', 2500.00::numeric),
        ('5691', 3000.00::numeric),
        ('MOBILE', 5000.00::numeric),
        ('ELECTRICITY', 6000.00::numeric)
),
actual_spend AS (
    SELECT m.mcc AS category_code, SUM(t.amount) AS spent_amount
    FROM vpas v
    JOIN transactions t ON t.payer_vpa = v.vpa
    JOIN merchants m ON m.merchant_id = t.merchant_id
    WHERE v.user_id = 31112
      AND t.status = 'SUCCESS'
      AND t.initiated_at >= TIMESTAMPTZ '2025-01-01 00:00:00+05:30'
      AND t.initiated_at <  TIMESTAMPTZ '2026-07-01 00:00:00+05:30'
    GROUP BY m.mcc
    UNION ALL
    SELECT bp.biller_category AS category_code, SUM(bp.amount) AS spent_amount
    FROM bill_payments bp
    WHERE bp.user_id = 31112
      AND bp.status = 'PAID'
      AND bp.paid_at >= TIMESTAMPTZ '2025-01-01 00:00:00+05:30'
      AND bp.paid_at <  TIMESTAMPTZ '2026-07-01 00:00:00+05:30'
    GROUP BY bp.biller_category
)
SELECT
    cb.category_code,
    cb.budget_limit,
    COALESCE(a.spent_amount, 0.00) AS actual_spent,
    cb.budget_limit - COALESCE(a.spent_amount, 0.00) AS remaining_budget,
    ROUND(100.0 * COALESCE(a.spent_amount, 0.00) / cb.budget_limit, 2) AS utilization_pct,
    CASE
        WHEN COALESCE(a.spent_amount, 0.00) > cb.budget_limit THEN 'EXCEEDED'
        WHEN COALESCE(a.spent_amount, 0.00) >= cb.budget_limit * 0.80 THEN 'WARNING'
        ELSE 'ON_TRACK'
    END AS budget_status
FROM category_budgets cb
LEFT JOIN actual_spend a ON a.category_code = cb.category_code
ORDER BY utilization_pct DESC;
```

- **Measured Performance:** Planning `1.121 ms`, Execution `24.186 ms` (min `24.003 ms`, max `24.430 ms`), `8` rows returned, `6,614` shared hits (`0` reads).
- **Execution Plan Observations ([`q05_budget_utilization.json`](./plans/q05_budget_utilization.json)):**
  - `Hash Right Join` joins the 8-row `Values Scan` against an `Append` of two aggregated branches:
    1. P2M spend: `Gather` (2 workers) + `Parallel Seq Scan` on `transactions` (`4,616` buffers) + `Seq Scan` on `vpas` (`1,584` buffers) + `Nested Loop` `Index Scan using merchants_pkey` (7 searches) + `GroupAggregate` (`21.0 ms`).
    2. Bill spend: `Seq Scan` on `bill_payments` (`385` buffers, `29,998` rows filtered out) + `GroupAggregate` (`2.56 ms`).
- **Index Usage:** `merchants_pkey` only.
- **Optimization Opportunities:** Secondary indexes on `vpas(user_id)`, `transactions(payer_vpa, initiated_at)`, and `bill_payments(user_id, paid_at)` eliminate full scans on both `Append` branches.

---

### Q6. Recurring Expense Analysis

- **Objective:** Retrieve upcoming (`DUE`) and past-due (`OVERDUE`) recurring utility bills from `2026-01-01` onward with customer details and computed next expected payment dates, ordered by urgency (`due_date ASC, amount DESC`, `LIMIT 50`).
- **Tables Involved:** `bill_payments`, `users`.
- **SQL Query:**

```sql
SELECT
    bp.bill_id,
    u.full_name,
    bp.biller_category,
    bp.biller_name,
    bp.consumer_number,
    bp.amount,
    bp.due_date,
    bp.status,
    bp.paid_at,
    CASE
        WHEN bp.status = 'PAID' THEN (bp.due_date + INTERVAL '1 month')::date
        ELSE bp.due_date
    END AS expected_next_payment_date
FROM bill_payments bp
JOIN users u ON u.user_id = bp.user_id
WHERE bp.status IN ('DUE', 'OVERDUE')
  AND bp.due_date >= DATE '2026-01-01'
ORDER BY bp.due_date ASC, bp.amount DESC
LIMIT 50;
```

- **Measured Performance:** Planning `0.620 ms`, Execution `10.715 ms` (min `9.360 ms`, max `11.128 ms`), `50` rows returned, `879` shared hits (`0` reads).
- **Execution Plan Observations ([`q06_recurring_expenses.json`](./plans/q06_recurring_expenses.json)):**
  - `Seq Scan` on `bill_payments` (`385` buffers, `4.1 ms`) retains `2,456` of `30,000` rows (`8.2%` selectivity) and builds a `272 kB` hash table (`4,096` buckets, 1 batch).
  - `Hash Join` probes with a `Seq Scan` on all `40,000` rows of `users` (`488` buffers, `2.4 ms`).
  - PostgreSQL applies **`Sort Method: top-N heapsort Memory: 36kB`** to emit the top 50 rows without sorting all 2,456 matches completely.
- **Index Usage:** None.
- **Optimization Opportunities:** A **partial composite index** `CREATE INDEX idx_bill_payments_unpaid_due ON bill_payments (due_date ASC, amount DESC) WHERE status IN ('DUE', 'OVERDUE')` covers only ~14% of rows (`~4,300` unpaid bills), eliminates both the `Seq Scan` on `bill_payments` and the `Sort` node, and lets PostgreSQL fetch only 50 matching users via `Index Scan using users_pkey` instead of scanning all 40,000 users!

---

### Q7. Anomaly Detection Records

- **Objective:** Identify anomalous Q2 2026 P2M transactions (`initiated_at >= '2026-04-01'`) whose amount exceeds the category mean by more than 3 standard deviations ($z > 3.0$) OR that have an associated `FRAUD` / `DUPLICATE_PAYMENT` dispute, returning the top 50 highest-z-score alerts with user ID and dispute status.
- **Tables Involved:** `transactions` (scanned twice: historical MCC baseline + Q2 candidates), `merchants`, `disputes` (LEFT JOIN), `vpas`.
- **SQL Query:**

```sql
WITH mcc_stats AS (
    SELECT
        m.mcc,
        AVG(t.amount) AS avg_amount,
        STDDEV_SAMP(t.amount) AS stddev_amount
    FROM transactions t
    JOIN merchants m ON m.merchant_id = t.merchant_id
    WHERE t.status = 'SUCCESS'
      AND t.txn_type = 'P2M'
    GROUP BY m.mcc
)
SELECT
    t.txn_id,
    v.user_id,
    t.initiated_at,
    t.amount,
    m.merchant_name,
    m.mcc,
    ROUND(ms.avg_amount, 2) AS mcc_avg,
    ROUND((t.amount - ms.avg_amount) / NULLIF(ms.stddev_amount, 0), 2) AS z_score,
    d.dispute_id,
    d.reason AS dispute_reason,
    d.status AS dispute_status
FROM transactions t
JOIN vpas v ON v.vpa = t.payer_vpa
JOIN merchants m ON m.merchant_id = t.merchant_id
JOIN mcc_stats ms ON ms.mcc = m.mcc
LEFT JOIN disputes d ON d.txn_id = t.txn_id
WHERE t.status = 'SUCCESS'
  AND t.initiated_at >= TIMESTAMPTZ '2026-04-01 00:00:00+05:30'
  AND (
      t.amount > ms.avg_amount + (3.0 * ms.stddev_amount)
      OR d.reason IN ('FRAUD', 'DUPLICATE_PAYMENT')
  )
ORDER BY z_score DESC NULLS LAST, t.initiated_at DESC
LIMIT 50;
```

- **Measured Performance:** Planning `1.488 ms`, Execution `93.766 ms` (min `93.464 ms`, max `94.315 ms`), `50` rows returned, `19,042` shared hits (`0` reads).
- **Execution Plan Observations ([`q07_anomaly_records.json`](./plans/q07_anomaly_records.json)):**
  - **Key Bottleneck (Redundant Parallel CTE Execution):** Because `mcc_stats` is referenced once, PostgreSQL 18 inlined it inside the parallel worker subtree (`Gather Merge`, 2 workers + leader = `loops=3`). Consequently, each of the 3 processes independently executed a full `Seq Scan` of `transactions` (`13,848` buffer hits across 3 loops, `76.8 ms`!) to build the exact same 10-row `HashAggregate` table!
  - **Smart Post-Limit Index Lookup:** PostgreSQL deferred the join to `vpas` until *above* `Gather Merge` and under `Limit 50`, executing only `50` `Index Scan using vpas_pkey` lookups (`200` buffers, `0.25 ms` total) instead of joining `53,333` VPAs early.
- **Index Usage:** `vpas_pkey` (50 targeted probes).
- **Optimization Opportunities:**
  1. Adding `WITH mcc_stats AS MATERIALIZED (...)` (or pre-computing MCC statistics in a refreshed summary/materialized view) prevents the 3× duplicate scan inside parallel workers, immediately eliminating ~9,232 redundant buffer hits.
  2. Indexing `transactions(initiated_at)` (or `(status, initiated_at)`) and `disputes(txn_id)` further accelerates the Q2 candidate filter and dispute join.

---

### Q8. AI Financial Insights

- **Objective:** Synthesize the 20 most recent actionable financial insights for a user (`user_id = 31112`) by combining four signal streams via `UNION ALL`: reward expiries/credits (`rewards`), utility bill statuses (`bill_payments`), dispute alerts (`disputes` + `transactions`), and failed payment diagnostics (`vpas` + `transactions`).
- **Tables Involved:** `rewards`, `bill_payments`, `disputes`, `transactions`, `vpas`.
- **SQL Query:**

```sql
WITH reward_insights AS (
    SELECT
        'REWARD_EXPIRY_OR_CREDIT'::text AS insight_type,
        r.issued_at AS insight_ts,
        r.amount AS metric_value,
        r.reward_type || ' (' || r.status || ')' AS detail
    FROM rewards r
    WHERE r.user_id = 31112
),
bill_insights AS (
    SELECT
        'BILL_PAYMENT_STATUS'::text AS insight_type,
        COALESCE(bp.paid_at, bp.due_date::timestamptz) AS insight_ts,
        bp.amount AS metric_value,
        bp.biller_category || ' - ' || bp.biller_name || ' (' || bp.status || ')' AS detail
    FROM bill_payments bp
    WHERE bp.user_id = 31112
),
dispute_insights AS (
    SELECT
        'DISPUTE_ALERT'::text AS insight_type,
        d.raised_at AS insight_ts,
        t.amount AS metric_value,
        d.reason || ' (' || d.status || ')' AS detail
    FROM disputes d
    JOIN transactions t ON t.txn_id = d.txn_id
    WHERE d.raised_by = 31112
),
failure_insights AS (
    SELECT
        'FAILED_TRANSACTION'::text AS insight_type,
        t.initiated_at AS insight_ts,
        t.amount AS metric_value,
        COALESCE(t.failure_code, 'UNKNOWN') || ' (' || t.txn_type || ')' AS detail
    FROM vpas v
    JOIN transactions t ON t.payer_vpa = v.vpa
    WHERE v.user_id = 31112
      AND t.status = 'FAILED'
)
SELECT insight_type, insight_ts, metric_value, detail
FROM (
    SELECT * FROM reward_insights
    UNION ALL SELECT * FROM bill_insights
    UNION ALL SELECT * FROM dispute_insights
    UNION ALL SELECT * FROM failure_insights
) combined
ORDER BY insight_ts DESC
LIMIT 20;
```

- **Measured Performance:** Planning `1.292 ms`, Execution `16.570 ms` (min `16.389 ms`, max `16.624 ms`), `9` rows returned, `7,154` shared hits (`0` reads).
- **Execution Plan Observations ([`q08_financial_insights.json`](./plans/q08_financial_insights.json)):**
  - PostgreSQL uses **`Gather` + `Parallel Append`** (2 workers launched) to evaluate the 4 independent `UNION ALL` branches concurrently:
    - `rewards` (`Seq Scan`, `515` buffers, `2.09 ms`)
    - `bill_payments` (`Seq Scan`, `385` buffers, `1.59 ms`)
    - `disputes` (`Seq Scan`, `46` buffers) + `Nested Loop` `Index Scan using transactions_pkey` (`5` buffers, `0.017 ms`)
    - `failed transactions` (`Parallel Seq Scan` on `transactions`, `4,616` buffers + `Seq Scan` on `vpas`, `1,584` buffers, `11.8 ms`)
  - The 9 combined insight rows are sorted in `26 kB` (`quicksort`).
- **Index Usage:** `transactions_pkey` (1 lookup for the user's disputed transaction).
- **Optimization Opportunities:** Adding foreign-key indexes on `rewards(user_id)`, `bill_payments(user_id)`, `disputes(raised_by)`, `vpas(user_id)`, and a partial index `transactions(payer_vpa) WHERE status = 'FAILED'` (covering only ~5% of transactions) collapses all 4 branches from `7,154` buffer hits to <50 buffer hits.

---

### Q9. Monthly Financial Trends

- **Objective:** Calculate platform-wide monthly successful transaction volume across all 18 months (`2025-01` to `2026-06`), including month-over-month percentage growth (`LAG`) and a 3-month rolling average (`AVG(...) OVER`).
- **Tables Involved:** `transactions`.
- **SQL Query:**

```sql
WITH monthly_totals AS (
    SELECT
        date_trunc('month', t.initiated_at)::date AS month_start,
        COUNT(*) AS txn_count,
        SUM(t.amount) AS total_volume,
        ROUND(AVG(t.amount), 2) AS avg_txn_value
    FROM transactions t
    WHERE t.status = 'SUCCESS'
    GROUP BY date_trunc('month', t.initiated_at)
)
SELECT
    month_start,
    txn_count,
    total_volume,
    avg_txn_value,
    LAG(total_volume) OVER (ORDER BY month_start) AS prev_month_volume,
    ROUND(
        100.0 * (total_volume - LAG(total_volume) OVER (ORDER BY month_start))
        / NULLIF(LAG(total_volume) OVER (ORDER BY month_start), 0),
        2
    ) AS mom_growth_pct,
    ROUND(
        AVG(total_volume) OVER (ORDER BY month_start ROWS BETWEEN 2 PRECEDING AND CURRENT ROW),
        2
    ) AS rolling_3m_avg
FROM monthly_totals
ORDER BY month_start ASC;
```

- **Measured Performance:** Planning `0.494 ms`, Execution `95.809 ms` (min `92.805 ms`, max `96.366 ms`), `18` rows returned, `4,619` shared hits (`0` reads).
- **Execution Plan Observations ([`q09_monthly_trends.json`](./plans/q09_monthly_trends.json)):**
  - `Seq Scan` on `transactions` (`4,616` buffers, `68.1 ms`) retains `232,909` of `250,468` rows (`93.0%` selectivity — an index on `status` would be counterproductive here).
  - **Notable Planner Cardinality Misestimation:** Without expression statistics on `date_trunc('month', initiated_at)`, PostgreSQL estimated `rows=233244` output groups for `HashAggregate` instead of the actual `18` monthly groups (a **12,958× overestimate**). As a result, it planned `Planned Partitions: 16` (though execution used `Batches: 1`, `545 kB`) and chose a single-threaded scan instead of a parallel partial `HashAggregate`.
  - Two lightweight `WindowAgg` stages (`w1` for `LAG`, `w2` for 3-month rolling `AVG`) execute in `<0.05 ms` over the 18 rows.
- **Index Usage:** None (appropriate for a 93%-selectivity full-table aggregation).
- **Optimization Opportunities:**
  1. **Extended/Expression Statistics** (`CREATE STATISTICS` on `date_trunc('month', initiated_at)`) or an **expression index** lets PostgreSQL see `n_distinct = 18`, unlocking parallel `Partial HashAggregate` + `Finalize HashAggregate` (cutting the 68 ms single-threaded scan roughly in half).
  2. For recurring executive dashboards, a **Materialized View** (`mv_monthly_financial_trends`) refreshed nightly reduces this query to `<0.2 ms`.

---

### Q10. Advanced Analytical Query

- **Objective:** Produce a 7-table **City & Merchant Category Risk-Adjusted GMV and Reward Efficiency Report** for verified users in H1 2026 (`2026-01-01` to `2026-06-30`), combining successful GMV, failure rate, dispute rate, credited reward spend, and per-city GMV ranking (`DENSE_RANK() OVER (PARTITION BY city_name ORDER BY total_gmv DESC)`).
- **Tables Involved:** `transactions`, `merchants`, `cities`, `vpas`, `users`, `disputes` (LEFT JOIN), `rewards` (LEFT JOIN).
- **SQL Query:**

```sql
WITH merchant_metrics AS (
    SELECT
        c.city_name,
        m.mcc,
        COUNT(t.txn_id) AS total_txns,
        COUNT(t.txn_id) FILTER (WHERE t.status = 'SUCCESS') AS success_txns,
        COUNT(t.txn_id) FILTER (WHERE t.status = 'FAILED') AS failed_txns,
        COALESCE(SUM(t.amount) FILTER (WHERE t.status = 'SUCCESS'), 0) AS total_gmv,
        COUNT(DISTINCT d.dispute_id) AS dispute_count,
        COALESCE(SUM(r.amount) FILTER (WHERE r.status = 'CREDITED'), 0) AS credited_rewards
    FROM transactions t
    JOIN merchants m ON m.merchant_id = t.merchant_id
    JOIN cities c ON c.city_id = m.city_id
    JOIN vpas v ON v.vpa = t.payer_vpa
    JOIN users u ON u.user_id = v.user_id
    LEFT JOIN disputes d ON d.txn_id = t.txn_id
    LEFT JOIN rewards r ON r.txn_id = t.txn_id
    WHERE t.txn_type = 'P2M'
      AND u.kyc_status = 'VERIFIED'
      AND t.initiated_at >= TIMESTAMPTZ '2026-01-01 00:00:00+05:30'
      AND t.initiated_at <  TIMESTAMPTZ '2026-07-01 00:00:00+05:30'
    GROUP BY c.city_name, m.mcc
)
SELECT
    city_name,
    mcc,
    total_txns,
    success_txns,
    ROUND(100.0 * failed_txns / NULLIF(total_txns, 0), 2) AS failure_rate_pct,
    total_gmv,
    dispute_count,
    ROUND(100.0 * dispute_count / NULLIF(success_txns, 0), 2) AS dispute_rate_pct,
    credited_rewards,
    DENSE_RANK() OVER (PARTITION BY city_name ORDER BY total_gmv DESC) AS city_gmv_rank
FROM merchant_metrics
ORDER BY city_name ASC, city_gmv_rank ASC
LIMIT 30;
```

- **Measured Performance:** Planning `2.390 ms` (highest across all 10 queries due to 7-table join-order search space), Execution `146.975 ms` (min `145.264 ms`, max `147.349 ms`), `30` rows returned, `6,238` shared hits (`0` reads).
- **Execution Plan Observations ([`q10_advanced_analytics.json`](./plans/q10_advanced_analytics.json)):**
  - PostgreSQL builds a **6-stage Hash Join / Hash Left Join pipeline** where all 6 build-side hash tables fit in single-batch memory (`Batches: 1`): `vpas` (`3,763 kB`), `users` (`1,781 kB`), `merchants` (`173 kB`), `cities` (`9 kB`), `disputes` (`200 kB`), `rewards` (`2,691 kB`).
  - `transactions` is scanned sequentially (`4,616` buffers, `30.9 ms`), yielding `46,474` H1 2026 P2M rows (`41,901` after verified-user join).
  - `COUNT(DISTINCT d.dispute_id)` triggers a `Sort` (`3,582 kB`, ~26 ms) before `GroupAggregate` on `(c.city_name, m.mcc)`.
  - **PostgreSQL 18 Incremental Sort + Early Termination:** Because `GroupAggregate` emits rows already ordered by `city_name`, PostgreSQL uses **`Incremental Sort`** (`Presorted Key: city_name`) before `WindowAgg` (`DENSE_RANK`) and again before `Limit 30`, stopping early after reading only `33` of the `100` city-MCC groups!
- **Index Usage:** None (Hash Joins are cost-optimal when joining `~42,000` rows against full dimension tables).
- **Optimization Opportunities:**
  1. Pre-aggregating `disputes` and `rewards` by `txn_id` (or filtering `rewards` to `status = 'CREDITED'` in a subquery before the `LEFT JOIN`) shrinks the `rewards` hash table from `39,799` rows (`2,691 kB`) to `31,745` rows and prevents row multiplication if multiple rewards ever link to one transaction.
  2. A composite index on `transactions (txn_type, initiated_at)` narrows the initial `transactions` scan from `250,468` rows to `46,474` rows (`18.5%` selectivity).

---

## 6. Execution Plan Analysis

Understanding *why* PostgreSQL selected each physical operator is more valuable than blindly assuming an index scan is always faster.

| Operator | Observed In | Why PostgreSQL Selected (or Skipped) It |
|---|---|---|
| **Seq Scan / Parallel Seq Scan** | `Q1`–`Q10` | Selected for two distinct reasons: (1) **Missing secondary indexes** on high-selectivity filters like `vpas.user_id = 31112` (`Q1`, `Q2`, `Q3`, `Q5`, `Q8`), where an index *would* be dramatically faster; and (2) **High-selectivity / small-table scans** like `transactions` in `Q9` (93% of rows match `status = 'SUCCESS'`) or `cities` (`1` page) and `merchants` (`35` pages), where sequential I/O (`seq_page_cost = 1`) is genuinely cheaper than random index I/O (`random_page_cost = 4`). |
| **Index Scan** | `Q1` (`bank_accounts_pkey`, `merchants_pkey`), `Q2` (`merchants_pkey`), `Q5` (`merchants_pkey`), `Q7` (`vpas_pkey`), `Q8` (`transactions_pkey`) | Chosen on the inner side of `Nested Loop` joins when the outer side produces very few rows (e.g., `1`–`50` rows), making targeted B-tree probes (`0.003–0.017 ms` each) far cheaper than hashing an entire table. In `Q1`, PostgreSQL further wrapped `bank_accounts_pkey` in a **`Memoize`** node to cache repeated `account_id` lookups in memory. |
| **Index Only Scan** | *Not observed* | Requires a covering index containing every referenced column in the query plus a clean visibility map. None of the 10 baseline PK/UNIQUE indexes cover both the filter predicates and projected analytical columns. |
| **Bitmap Heap Scan** | *Not observed* | Typically chosen for medium-selectivity predicates (e.g., 1%–15% of a table) when an index exists on the filter column (such as `bill_payments.due_date` in `Q6` or `transactions.initiated_at` in `Q4`/`Q10`). Absent here because no non-PK indexes exist on those columns. |
| **Nested Loop / Nested Loop Left Join** | `Q1`, `Q2`, `Q3`, `Q5`, `Q7`, `Q8` | Chosen when the outer input is tiny (1–50 rows) and the inner side has a primary-key index (`Q1`, `Q2`, `Q5`, `Q7`, `Q8`) or is a 1-row `CROSS JOIN` aggregate (`Q3`). |
| **Hash Join / Hash Left & Right Join** | `Q1`–`Q8`, `Q10` | Dominant join strategy for medium-to-large unsorted inputs (`Q4`, `Q6`, `Q7`, `Q10`) and unindexed equality joins (`t.payer_vpa = v.vpa`). With `work_mem = 4 MB`, every hash table across all 10 queries stayed in memory (`Batches: 1`), avoiding disk spills. |
| **Merge Join** | *Not observed* | Requires both inputs to be pre-sorted on the join key (via index order or explicit `Sort`). Because the join keys lacked ordering indexes and the smaller inputs fit easily inside `work_mem` hash tables, `Hash Join` consistently had lower total cost. |
| **Aggregate (`GroupAggregate` vs `HashAggregate`)** | `GroupAggregate`: `Q2`, `Q4`, `Q5`, `Q10`; `HashAggregate`: `Q7`, `Q9`; `Plain Aggregate`: `Q3` | PostgreSQL picked `HashAggregate` when no `DISTINCT` ordering was needed (`Q7`, `Q9`), and `GroupAggregate` (preceded by `Sort`) when `COUNT(DISTINCT ...)` forced sorted input (`Q4`, `Q10`) or when input cardinality was tiny (`Q2`, `Q5`). |
| **Sort (`quicksort`, `top-N heapsort`, `Incremental Sort`)** | `Q1`, `Q2`, `Q4`–`Q10` | All sorts completed in memory (`25 kB`–`3,598 kB`). PostgreSQL automatically selected **`top-N heapsort`** (`36 kB`) for `Q6` (`LIMIT 50`) and **`Incremental Sort`** in `Q10` to exploit `city_name` pre-ordering from `GroupAggregate`. |
| **WindowAgg & Parallel Append** | `WindowAgg`: `Q4`, `Q9`, `Q10`; `Parallel Append`: `Q8` | `WindowAgg` computed spend shares (`Q4`), MoM `LAG` & rolling averages (`Q9`), and `DENSE_RANK` (`Q10`) in `17 kB` memory. `Parallel Append` in `Q8` executed all 4 `UNION ALL` branches concurrently across workers. |

---

## 7. Performance Optimization

Based on the measured execution plans (without altering the repository's `dbms/03_schema.sql`), the following optimizations are justified in priority order:

### 7.1 High-Impact Indexing Recommendations (with Write-Overhead Trade-Offs)

| Priority | Recommended Index | Target Queries | Expected Impact | Write & Storage Overhead |
|---|---|---|---|---|
| **1** | `CREATE INDEX idx_vpas_user_id ON vpas (user_id);` | `Q1`, `Q2`, `Q3`, `Q5`, `Q8` | Eliminates 53,333-row `Seq Scan` (`528`–`1,584` buffers) on every user-scoped query. | **Very Low.** `vpas` is low-churn (created once per account link). Index size ~1.2 MB. |
| **2** | `CREATE INDEX idx_transactions_payer_vpa_initiated ON transactions (payer_vpa, initiated_at DESC);` | `Q1`, `Q2`, `Q3`, `Q5`, `Q8` | Replaces 250,468-row `Parallel Seq Scan` (`4,616` buffers) + `Sort` with a targeted `Index Scan` for per-user history & spend. | **Moderate–High.** `transactions` is the highest-write table; adds 1 B-tree insert per transaction (~12–15 MB) and can inhibit HOT updates only if `payer_vpa` or `initiated_at` are updated (they are immutable). |
| **3** | `CREATE INDEX idx_transactions_payee_vpa_initiated ON transactions (payee_vpa, initiated_at DESC);` | `Q3` | Eliminates the second full-table scan of `transactions` for incoming P2P transfers. | **Moderate–High.** Same insert overhead on `transactions` as above; justify only if incoming-history / net-balance queries are frequent. |
| **4** | `CREATE INDEX idx_bill_payments_unpaid_due ON bill_payments (due_date ASC, amount DESC) WHERE status IN ('DUE', 'OVERDUE');` | `Q6` | **Partial composite index** (~4,300 rows, <200 kB). Eliminates `Seq Scan` on `bill_payments`, `Sort`, and 40k-row `users` scan (enables `Nested Loop` on `users_pkey` for top 50). | **Minimal.** Only maintained while a bill is `DUE`/`OVERDUE`; automatically removed from the index when updated to `PAID`. |
| **5** | `CREATE INDEX idx_rewards_user_id ON rewards (user_id);`<br>`CREATE INDEX idx_bill_payments_user_id ON bill_payments (user_id);`<br>`CREATE INDEX idx_disputes_raised_by ON disputes (raised_by);`<br>`CREATE INDEX idx_disputes_txn_id ON disputes (txn_id);` | `Q3`, `Q5`, `Q7`, `Q8`, `Q10` | Eliminates per-user full scans on `rewards` (40k rows), `bill_payments` (30k rows), and `disputes` (3.5k rows). | **Low.** Moderate write volume; total combined storage <2.5 MB. |
| **6** | `CREATE INDEX idx_transactions_initiated_brin ON transactions USING BRIN (initiated_at);` | `Q4`, `Q7`, `Q10` | If `transactions` is appended chronologically, a tiny (~48 kB) BRIN index skips out-of-range blocks for time-windowed analytics. | **Negligible.** Orders of magnitude smaller and cheaper to maintain than a B-tree on `initiated_at`. |

### 7.2 Query Restructuring & Planner Optimizations (Zero Schema/Index Cost)

1. **Single-Pass Aggregation in `Q3`:** Merging `p2p_inflows` and `txn_outflows` into one `transactions` scan with `FILTER (WHERE ...)` eliminates `4,616` redundant buffer hits (~35–40 ms saved immediately).
2. **Explicit CTE Materialization in `Q7`:** Changing `WITH mcc_stats AS (...)` to `WITH mcc_stats AS MATERIALIZED (...)` stops PostgreSQL from executing the 250k-row MCC baseline aggregation inside every parallel worker (`loops=3`), cutting ~9,232 redundant buffer hits.
3. **Fixing Cardinality Misestimation in `Q9`:** Defining extended statistics or a monthly materialized view resolves the 12,958× row-count overestimate (`233,244` estimated vs. `18` actual) on `date_trunc('month', initiated_at)`.
4. **Filtering Before Aggregation & Avoiding `SELECT *`:** All 10 queries project only required columns (minimizing tuple width in `Sort` and `Hash` buffers — e.g., keeping `Q4` at `3,598 kB` and `Q10` at `3,582 kB`, just inside `work_mem = 4 MB`) and push date/status predicates below joins and aggregates.

---

## 8. Conclusion

- **Overall Performance Profile:** Against the 83 MB, 250,468-transaction `gpay` database, all 10 benchmark queries executed in **`10.715 ms` to `146.975 ms`** with planning times between **`0.494 ms` and `2.390 ms`**.
- **Primary Bottleneck:** The complete absence of secondary indexes forces every user-scoped query (`Q1`, `Q2`, `Q3`, `Q5`, `Q8`) to perform full sequential scans of `vpas` (53k rows) and `transactions` (250k rows), while `Q3` and `Q7` incur avoidable duplicate scans of `transactions`.
- **Where Full Scans Are Optimal:** For broad analytical queries (`Q4`, `Q9`, `Q10`), PostgreSQL's planner correctly preferred `Seq Scan` + in-memory `Hash Join`, `Incremental Sort`, and `top-N heapsort` over random index probes.
- **Highest-ROI Improvements:** Adding 3–5 targeted indexes (starting with `vpas(user_id)`, `transactions(payer_vpa, initiated_at DESC)`, and the partial index on unpaid `bill_payments`), materializing `mcc_stats` in `Q7`, and consolidating `Q3` to a single `transactions` pass will reduce OLTP-style user queries from `16–114 ms` to sub-millisecond latency.
- **Current Benchmark Limitations:**
  - Measurements reflect **single-connection, warm-cache** execution on a local Apple Silicon workstation (`16 GB` RAM) where the entire `83 MB` database fits in OS memory. Under production concurrency or multi-gigabyte cold-disk datasets, the unindexed sequential scans observed in `Q1`–`Q3`, `Q5`, and `Q8` will degrade far more severely.
  - Dedicated `budgets`, `anomalies`, and `ai_insights` tables do not yet exist in `dbms/03_schema.sql`; once introduced in future schema iterations, their access patterns should be re-benchmarked using this same methodology.
