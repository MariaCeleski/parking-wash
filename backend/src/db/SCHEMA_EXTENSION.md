# Schema Extension: Vehicle Type and Payment Fields

## Overview

This document describes the extension of the `parking_records` table to support vehicle type classification and payment tracking. The extension maintains backward compatibility with existing records.

## Changes Made

### 1. New Columns Added to `parking_records`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `vehicle_type_id` | UUID | YES | NULL | Foreign key reference to `vehicle_types` table. Allows NULL for legacy records. |
| `applied_daily_rate` | BOOLEAN | NO | FALSE | Indicates whether daily rate was applied instead of hourly rate during checkout. |
| `payment_status` | VARCHAR(20) | NO | 'Pending' | Payment status: 'Pending', 'Completed', 'Failed', 'Cancelled'. |
| `payment_method_id` | VARCHAR(100) | YES | NULL | Identifier of the payment method used (e.g., credit card, cash, PIX). |
| `payment_transaction_id` | VARCHAR(100) | YES | NULL | Transaction ID from payment gateway for audit trail. |

### 2. New Indexes Created

| Index Name | Columns | Purpose |
|------------|---------|---------|
| `idx_parking_records_vehicle_type_id` | `vehicle_type_id` | Optimize queries filtering by vehicle type |
| `idx_parking_records_payment_status` | `payment_status` | Optimize queries filtering by payment status |
| `idx_parking_records_exit_time_desc` | `exit_time DESC` | Optimize queries for recent exits (history, billing reports) |

## Backward Compatibility

- **Existing Records**: All existing `parking_records` will have `vehicle_type_id = NULL`, `applied_daily_rate = FALSE`, `payment_status = 'Pending'`, and payment fields as NULL.
- **No Data Loss**: The extension is purely additive; no existing columns are modified or removed.
- **Gradual Migration**: New records will include vehicle type information, while legacy records remain queryable without modification.

## Vehicle Types Table

The `vehicle_types` table stores vehicle classifications with type-specific pricing:

```sql
CREATE TABLE vehicle_types (
  id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  name             VARCHAR(50)    NOT NULL,
  code             VARCHAR(20)    UNIQUE NOT NULL,
  hourly_rate      NUMERIC(10, 2) NOT NULL CHECK (hourly_rate >= 0.01),
  daily_rate       NUMERIC(10, 2) NOT NULL CHECK (daily_rate >= 0.01),
  is_active        BOOLEAN        NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
```

### Default Vehicle Types

| Name | Code | Hourly Rate | Daily Rate | Active |
|------|------|-------------|-----------|--------|
| Motocicleta | MOTORCYCLE | R$ 5.00 | R$ 30.00 | TRUE |
| Carro | CAR | R$ 10.00 | R$ 60.00 | TRUE |
| Motorhome | MOTORHOME | R$ 20.00 | R$ 120.00 | TRUE |

## Usage Examples

### Query: Get parking records with vehicle type information

```sql
SELECT 
  pr.id,
  pr.license_plate,
  pr.entry_time,
  pr.exit_time,
  pr.total_amount,
  pr.applied_daily_rate,
  pr.payment_status,
  vt.name as vehicle_type_name,
  vt.code as vehicle_type_code
FROM parking_records pr
LEFT JOIN vehicle_types vt ON pr.vehicle_type_id = vt.id
WHERE pr.status = 'Exited'
ORDER BY pr.exit_time DESC
LIMIT 10;
```

### Query: Get billing report by vehicle type

```sql
SELECT 
  vt.name,
  vt.code,
  COUNT(pr.id) as total_vehicles,
  SUM(pr.total_amount) as total_revenue
FROM parking_records pr
LEFT JOIN vehicle_types vt ON pr.vehicle_type_id = vt.id
WHERE pr.status = 'Exited'
  AND DATE(pr.exit_time) = CURRENT_DATE
GROUP BY vt.id, vt.name, vt.code
ORDER BY total_revenue DESC;
```

### Query: Get pending payments

```sql
SELECT 
  pr.id,
  pr.license_plate,
  pr.total_amount,
  pr.payment_status,
  pr.exit_time
FROM parking_records pr
WHERE pr.payment_status = 'Pending'
  AND pr.status = 'Exited'
ORDER BY pr.exit_time ASC;
```

## Migration Instructions

### For New Installations

The schema is already included in `schema.sql`. Simply run the full schema creation script.

### For Existing Installations

Run the migration script:

```bash
# Using psql
psql -h <host> -U <user> -d <database> -f migration_001_extend_parking_records.sql

# Or using Supabase CLI
supabase db push
```

### Rollback Procedure

If you need to rollback the changes, use the rollback script included in the migration file:

```sql
DROP INDEX IF EXISTS idx_parking_records_vehicle_type_id;
DROP INDEX IF EXISTS idx_parking_records_payment_status;
DROP INDEX IF EXISTS idx_parking_records_exit_time_desc;
ALTER TABLE parking_records
DROP COLUMN IF EXISTS vehicle_type_id,
DROP COLUMN IF EXISTS applied_daily_rate,
DROP COLUMN IF EXISTS payment_status,
DROP COLUMN IF EXISTS payment_method_id,
DROP COLUMN IF EXISTS payment_transaction_id;
```

## Performance Considerations

1. **Index Strategy**: The three new indexes are designed to support the most common query patterns:
   - Filtering by vehicle type for billing reports
   - Filtering by payment status for payment reconciliation
   - Sorting by exit time for history and recent transactions

2. **Foreign Key**: The `vehicle_type_id` foreign key ensures referential integrity but allows NULL values for backward compatibility.

3. **Query Optimization**: Use `LEFT JOIN` when querying vehicle types to handle NULL values gracefully.

## Requirements Mapping

- **Requirement 9.1**: Vehicle type selection during check-in
- **Requirement 9.2**: Vehicle type and payment fields in parking records
- **Requirement 9.4**: Backward compatibility with legacy records

## Related Features

- Vehicle Type Management API (`/api/vehicle-types`)
- Enhanced Check-in with Vehicle Type (`POST /api/parking/checkin`)
- Enhanced Checkout with Daily Rate Option (`POST /api/parking/:id/checkout`)
- Payment Integration (`payment_status`, `payment_method_id`, `payment_transaction_id`)
- Billing Reports (`GET /api/billing/daily-report`)
- Parking History (`GET /api/parking/history`)
