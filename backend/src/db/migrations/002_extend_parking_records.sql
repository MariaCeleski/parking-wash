-- Migration: 002_extend_parking_records
-- Description: Extend parking_records table with vehicle type, daily rate option, and payment fields
-- Date: 2024
-- Status: Up

-- ============================================================
-- Alter Table: parking_records
-- Add columns for vehicle type association, tariff option, and payment tracking
-- ============================================================

-- Add vehicle_type_id column with foreign key reference
ALTER TABLE parking_records
ADD COLUMN vehicle_type_id UUID REFERENCES vehicle_types(id);

-- Add applied_daily_rate column to track which tariff was used
ALTER TABLE parking_records
ADD COLUMN applied_daily_rate BOOLEAN DEFAULT FALSE;

-- Add payment tracking columns
ALTER TABLE parking_records
ADD COLUMN payment_status VARCHAR(20) DEFAULT 'Pending'
  CHECK (payment_status IN ('Pending', 'Completed', 'Failed'));

ALTER TABLE parking_records
ADD COLUMN payment_method_id VARCHAR(100);

ALTER TABLE parking_records
ADD COLUMN payment_transaction_id VARCHAR(100);

-- Create indexes for optimized queries
CREATE INDEX idx_parking_records_vehicle_type_id ON parking_records(vehicle_type_id);
CREATE INDEX idx_parking_records_payment_status ON parking_records(payment_status);
CREATE INDEX idx_parking_records_exit_time ON parking_records(exit_time DESC);

-- ============================================================
-- Rollback Script (execute to undo this migration)
-- ============================================================
-- ALTER TABLE parking_records DROP COLUMN IF EXISTS vehicle_type_id CASCADE;
-- ALTER TABLE parking_records DROP COLUMN IF EXISTS applied_daily_rate;
-- ALTER TABLE parking_records DROP COLUMN IF EXISTS payment_status;
-- ALTER TABLE parking_records DROP COLUMN IF EXISTS payment_method_id;
-- ALTER TABLE parking_records DROP COLUMN IF EXISTS payment_transaction_id;
-- DROP INDEX IF EXISTS idx_parking_records_vehicle_type_id;
-- DROP INDEX IF EXISTS idx_parking_records_payment_status;
-- DROP INDEX IF EXISTS idx_parking_records_exit_time;
