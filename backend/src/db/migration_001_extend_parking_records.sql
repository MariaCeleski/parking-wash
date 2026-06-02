-- Migration: Extend parking_records table with vehicle type and payment fields
-- Description: Adds vehicle_type_id, applied_daily_rate, payment_status, payment_method_id, 
--              and payment_transaction_id columns to parking_records table
-- Date: 2024
-- Backward Compatibility: YES - vehicle_type_id is nullable for legacy records

-- ============================================================
-- Step 1: Add new columns to parking_records table
-- ============================================================
ALTER TABLE parking_records
ADD COLUMN vehicle_type_id UUID REFERENCES vehicle_types(id),
ADD COLUMN applied_daily_rate BOOLEAN DEFAULT FALSE,
ADD COLUMN payment_status VARCHAR(20) DEFAULT 'Pending',
ADD COLUMN payment_method_id VARCHAR(100),
ADD COLUMN payment_transaction_id VARCHAR(100);

-- ============================================================
-- Step 2: Create indexes for query performance
-- ============================================================
CREATE INDEX idx_parking_records_vehicle_type_id ON parking_records(vehicle_type_id);
CREATE INDEX idx_parking_records_payment_status ON parking_records(payment_status);
CREATE INDEX idx_parking_records_exit_time_desc ON parking_records(exit_time DESC);

-- ============================================================
-- Rollback Script (if needed):
-- ============================================================
-- DROP INDEX IF EXISTS idx_parking_records_vehicle_type_id;
-- DROP INDEX IF EXISTS idx_parking_records_payment_status;
-- DROP INDEX IF EXISTS idx_parking_records_exit_time_desc;
-- ALTER TABLE parking_records
-- DROP COLUMN IF EXISTS vehicle_type_id,
-- DROP COLUMN IF EXISTS applied_daily_rate,
-- DROP COLUMN IF EXISTS payment_status,
-- DROP COLUMN IF EXISTS payment_method_id,
-- DROP COLUMN IF EXISTS payment_transaction_id;
