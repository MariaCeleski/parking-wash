-- Migration: 003_add_payment_method_to_wash_orders
-- Description: Add payment_method column to wash_orders table for tracking payment type on completion
-- Date: 2025
-- Status: Up

-- ============================================================
-- Alter Table: wash_orders
-- Add payment_method column to store the payment method used at checkout
-- ============================================================

ALTER TABLE wash_orders
ADD COLUMN payment_method VARCHAR(50);

-- ============================================================
-- Rollback Script (execute to undo this migration)
-- ============================================================
-- ALTER TABLE wash_orders DROP COLUMN IF EXISTS payment_method;
