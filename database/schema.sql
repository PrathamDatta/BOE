-- database/schema.sql

-- 1. Companies Table
CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. BOEs Table (Stage 1 Master Record)
CREATE TABLE IF NOT EXISTS boes (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  boe_number VARCHAR(100) NOT NULL,
  hawb VARCHAR(100),
  status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Invoiced', 'Discrepancy', 'Paid'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, boe_number)
);

-- 3. Stage 2 Charges (Delivery Order & Duty, Multiple per BOE)
CREATE TABLE IF NOT EXISTS stage2_charges (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  boe_id INTEGER REFERENCES boes(id) ON DELETE CASCADE,
  do_charge NUMERIC(15,2) DEFAULT 0,
  duty_charge NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Stage 3 Storage (Storage, Single per BOE)
CREATE TABLE IF NOT EXISTS stage3_storage (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  boe_id INTEGER REFERENCES boes(id) ON DELETE CASCADE,
  storage_charge NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Stage 4 Invoices (Invoiced amounts, Multiple per BOE)
CREATE TABLE IF NOT EXISTS stage4_invoices (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  boe_id INTEGER REFERENCES boes(id) ON DELETE CASCADE,
  do_charge NUMERIC(15,2) DEFAULT 0,
  duty_charge NUMERIC(15,2) DEFAULT 0,
  storage_charge NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Reconciliation View (Aggregates components to find discrepancies easily)
CREATE OR REPLACE VIEW boe_reconciliation_view AS
WITH
  s2 AS (
    SELECT boe_id, 
           SUM(do_charge) as do_charge, 
           SUM(duty_charge) as duty_charge
    FROM stage2_charges
    GROUP BY boe_id
  ),
  s3 AS (
    SELECT boe_id, 
           SUM(storage_charge) as storage_charge
    FROM stage3_storage
    GROUP BY boe_id
  ),
  s4 AS (
    SELECT boe_id, 
           SUM(do_charge) as do_charge, 
           SUM(duty_charge) as duty_charge, 
           SUM(storage_charge) as storage_charge
    FROM stage4_invoices
    GROUP BY boe_id
  )
SELECT
  b.id AS boe_id,
  b.company_id,
  b.boe_number,
  b.hawb,
  b.status,
  b.created_at,
  
  -- Recorded Totals
  COALESCE(s2.do_charge, 0) AS recorded_do,
  COALESCE(s2.duty_charge, 0) AS recorded_duty,
  COALESCE(s3.storage_charge, 0) AS recorded_storage,

  -- Invoiced Totals
  COALESCE(s4.do_charge, 0) AS invoiced_do,
  COALESCE(s4.duty_charge, 0) AS invoiced_duty,
  COALESCE(s4.storage_charge, 0) AS invoiced_storage,

  -- Computed Discrepancies
  (COALESCE(s2.do_charge, 0) - COALESCE(s4.do_charge, 0)) AS do_mismatch,
  (COALESCE(s2.duty_charge, 0) - COALESCE(s4.duty_charge, 0)) AS duty_mismatch,
  (COALESCE(s3.storage_charge, 0) - COALESCE(s4.storage_charge, 0)) AS storage_mismatch

FROM boes b
LEFT JOIN s2 ON b.id = s2.boe_id
LEFT JOIN s3 ON b.id = s3.boe_id
LEFT JOIN s4 ON b.id = s4.boe_id;
