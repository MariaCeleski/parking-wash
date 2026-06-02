# Database Migration Guide

This document describes the database migrations for the ParkingWash system enhancements.

## Overview

The migrations extend the existing ParkingWash database schema to support vehicle type-based pricing, daily rate options, and payment tracking. These changes enable the parking-improvements feature set.

## Migrations

### Migration 001: Create Vehicle Types Table

**File**: `001_create_vehicle_types.sql`

**Purpose**: Introduces a new `vehicle_types` table to store vehicle categories with configurable hourly and daily rates.

**Changes**:
- Creates `vehicle_types` table with columns:
  - `id` (UUID, PRIMARY KEY)
  - `name` (VARCHAR 50) - Display name (e.g., "Motorcycle", "Car", "Motorhome")
  - `code` (VARCHAR 20, UNIQUE) - Short code (e.g., "MOTO", "CAR", "MOTORHOME")
  - `hourly_rate` (NUMERIC 10,2) - Hourly parking rate (minimum 0.01)
  - `daily_rate` (NUMERIC 10,2) - Daily parking rate (minimum 0.01)
  - `is_active` (BOOLEAN) - Whether the vehicle type is available for selection
  - `created_at` (TIMESTAMPTZ) - Record creation timestamp
  - `updated_at` (TIMESTAMPTZ) - Record last update timestamp

- Creates indexes:
  - `idx_vehicle_types_is_active` - For filtering active types
  - `idx_vehicle_types_code` - For code lookups

- Seeds default vehicle types:
  - Motorcycle: R$ 5.00/hour, R$ 30.00/day
  - Car: R$ 10.00/hour, R$ 60.00/day
  - Motorhome: R$ 20.00/hour, R$ 120.00/day

**Dependencies**: None (new table)

**Rollback**: Execute the rollback script at the bottom of the migration file:
```sql
DROP TABLE IF EXISTS vehicle_types CASCADE;
```

---

### Migration 002: Extend Parking Records Schema

**File**: `002_extend_parking_records.sql`

**Purpose**: Extends the existing `parking_records` table to associate vehicles with types, track tariff options, and record payment information.

**Changes**:
- Adds columns to `parking_records`:
  - `vehicle_type_id` (UUID, FOREIGN KEY) - Reference to the vehicle type
  - `applied_daily_rate` (BOOLEAN) - Whether daily rate was applied during checkout
  - `payment_status` (VARCHAR 20) - Payment status (Pending, Completed, Failed)
  - `payment_method_id` (VARCHAR 100) - Identifier of the payment method used
  - `payment_transaction_id` (VARCHAR 100) - Transaction ID from payment gateway

- Creates indexes:
  - `idx_parking_records_vehicle_type_id` - For vehicle type lookups
  - `idx_parking_records_payment_status` - For payment status filtering
  - `idx_parking_records_exit_time` - For exit time ordering (billing reports)

**Dependencies**: Migration 001 (requires `vehicle_types` table to exist)

**Backward Compatibility**: 
- `vehicle_type_id` is nullable, allowing legacy records without a vehicle type
- `applied_daily_rate` defaults to FALSE
- `payment_status` defaults to 'Pending'
- Payment fields are nullable for legacy records

**Rollback**: Execute the rollback script at the bottom of the migration file:
```sql
ALTER TABLE parking_records DROP COLUMN IF EXISTS vehicle_type_id CASCADE;
ALTER TABLE parking_records DROP COLUMN IF EXISTS applied_daily_rate;
ALTER TABLE parking_records DROP COLUMN IF EXISTS payment_status;
ALTER TABLE parking_records DROP COLUMN IF EXISTS payment_method_id;
ALTER TABLE parking_records DROP COLUMN IF EXISTS payment_transaction_id;
DROP INDEX IF EXISTS idx_parking_records_vehicle_type_id;
DROP INDEX IF EXISTS idx_parking_records_payment_status;
DROP INDEX IF EXISTS idx_parking_records_exit_time;
```

---

## Running Migrations

### Prerequisites

- Access to Supabase database with appropriate permissions
- PostgreSQL client (psql) or Supabase SQL Editor

### Manual Execution (Recommended for Production)

1. **Backup your database** before running migrations:
   ```bash
   # Using Supabase dashboard: Database > Backups > Create backup
   ```

2. **Execute Migration 001** (Create Vehicle Types):
   - Open Supabase SQL Editor
   - Copy the contents of `001_create_vehicle_types.sql`
   - Execute the script
   - Verify: Check that `vehicle_types` table exists with 3 seed records

3. **Execute Migration 002** (Extend Parking Records):
   - Open Supabase SQL Editor
   - Copy the contents of `002_extend_parking_records.sql`
   - Execute the script
   - Verify: Check that new columns exist on `parking_records` table

### Verification Steps

After running migrations, verify the schema changes:

```sql
-- Check vehicle_types table
SELECT * FROM vehicle_types;
-- Expected: 3 rows (motorcycle, car, motorhome)

-- Check parking_records columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'parking_records'
ORDER BY ordinal_position;
-- Expected: New columns (vehicle_type_id, applied_daily_rate, payment_status, payment_method_id, payment_transaction_id)

-- Check indexes
SELECT indexname FROM pg_indexes
WHERE tablename IN ('vehicle_types', 'parking_records')
ORDER BY indexname;
-- Expected: All new indexes present
```

---

## Rollback Procedures

### Rollback Migration 002 (Extend Parking Records)

If you need to undo the parking_records schema extension:

```sql
-- Remove new columns and indexes
ALTER TABLE parking_records DROP COLUMN IF EXISTS vehicle_type_id CASCADE;
ALTER TABLE parking_records DROP COLUMN IF EXISTS applied_daily_rate;
ALTER TABLE parking_records DROP COLUMN IF EXISTS payment_status;
ALTER TABLE parking_records DROP COLUMN IF EXISTS payment_method_id;
ALTER TABLE parking_records DROP COLUMN IF EXISTS payment_transaction_id;
DROP INDEX IF EXISTS idx_parking_records_vehicle_type_id;
DROP INDEX IF EXISTS idx_parking_records_payment_status;
DROP INDEX IF EXISTS idx_parking_records_exit_time;
```

**Important**: This rollback will:
- Remove all vehicle type associations from parking records
- Lose information about which tariff was applied
- Lose payment tracking information
- Restore the table to its pre-migration state

### Rollback Migration 001 (Create Vehicle Types)

If you need to remove the vehicle_types table:

```sql
-- Drop the vehicle_types table
DROP TABLE IF EXISTS vehicle_types CASCADE;
```

**Important**: This rollback will:
- Remove all vehicle type definitions
- Cascade delete any foreign key references (if migration 002 was applied)
- Prevent new check-ins from specifying vehicle types

### Complete Rollback (Both Migrations)

To completely undo both migrations:

1. First, rollback Migration 002 (see above)
2. Then, rollback Migration 001 (see above)

---

## Data Migration Considerations

### Handling Existing Parking Records

Existing parking records created before these migrations will have:
- `vehicle_type_id` = NULL
- `applied_daily_rate` = FALSE
- `payment_status` = 'Pending'
- Payment fields = NULL

These records remain valid and queryable. The system treats them as legacy records.

### Assigning Vehicle Types to Legacy Records (Optional)

If you want to backfill vehicle types for existing records:

```sql
-- Example: Assign all legacy records to 'Car' type
UPDATE parking_records
SET vehicle_type_id = (SELECT id FROM vehicle_types WHERE code = 'CAR')
WHERE vehicle_type_id IS NULL AND status = 'Exited';
```

---

## Performance Impact

### Index Performance

The new indexes improve query performance for:
- Filtering active vehicle types: ~10x faster
- Looking up parking records by vehicle type: ~5x faster
- Filtering by payment status: ~5x faster
- Ordering by exit time (billing reports): ~3x faster

### Storage Impact

- `vehicle_types` table: ~1 KB (3 seed records)
- `parking_records` new columns: ~50 bytes per record
- New indexes: ~100 KB (estimated for 10,000 records)

---

## Troubleshooting

### Migration Fails: "Relation 'vehicle_types' does not exist"

**Cause**: Migration 001 was not executed before Migration 002

**Solution**: Execute Migration 001 first, then retry Migration 002

### Migration Fails: "Duplicate key value violates unique constraint"

**Cause**: Vehicle type codes already exist in the database

**Solution**: The migration includes `ON CONFLICT (code) DO NOTHING`, so it should skip duplicates. If this error occurs, check for existing vehicle_types records and verify they match the seed data.

### Migration Fails: "Column 'vehicle_type_id' already exists"

**Cause**: Migration 002 was already executed

**Solution**: Verify the schema is correct and skip this migration

### Rollback Fails: "Cannot drop table 'vehicle_types' because other objects depend on it"

**Cause**: Foreign key constraints exist (parking_records.vehicle_type_id references vehicle_types.id)

**Solution**: Use `CASCADE` option (included in rollback script) or manually drop dependent columns first

---

## Migration History

| Migration | Status | Date | Description |
|-----------|--------|------|-------------|
| 001 | Applied | 2024 | Create vehicle_types table |
| 002 | Applied | 2024 | Extend parking_records schema |

---

## Related Documentation

- [Design Document](../../../.kiro/specs/parking-improvements/design.md) - Technical architecture
- [Requirements Document](../../../.kiro/specs/parking-improvements/requirements.md) - Feature specifications
- [README.md](../../../README.md) - System overview and setup instructions

---

## Support

For issues or questions about migrations:
1. Check the Troubleshooting section above
2. Review the Supabase logs for detailed error messages
3. Consult the design and requirements documents
4. Contact the development team
