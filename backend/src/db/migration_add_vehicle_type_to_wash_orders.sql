-- Migration: Add vehicle_type_id to wash_orders table
-- Purpose: Link wash orders to vehicle types for better tracking
-- Date: 2024

-- Add vehicle_type_id column to wash_orders table
ALTER TABLE wash_orders
ADD COLUMN vehicle_type_id UUID REFERENCES vehicle_types(id);

-- Create index for better query performance
CREATE INDEX idx_wash_orders_vehicle_type_id ON wash_orders(vehicle_type_id);

-- Verify the changes
-- SELECT * FROM wash_orders LIMIT 1;
