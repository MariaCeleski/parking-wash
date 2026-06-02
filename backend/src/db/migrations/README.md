# Database Migrations

This directory contains SQL migration scripts for the ParkingWash database schema.

## Files

- **001_create_vehicle_types.sql** - Creates the `vehicle_types` table with seed data
- **002_extend_parking_records.sql** - Extends `parking_records` with vehicle type and payment fields
- **MIGRATION_GUIDE.md** - Comprehensive guide for running and rolling back migrations

## Quick Start

### Running Migrations

1. Open Supabase SQL Editor (or use psql)
2. Execute migrations in order:
   - First: `001_create_vehicle_types.sql`
   - Second: `002_extend_parking_records.sql`

### Verifying Migrations

```sql
-- Check vehicle_types table exists
SELECT COUNT(*) FROM vehicle_types;

-- Check parking_records has new columns
SELECT column_name FROM information_schema.columns
WHERE table_name = 'parking_records' AND column_name IN (
  'vehicle_type_id', 'applied_daily_rate', 'payment_status',
  'payment_method_id', 'payment_transaction_id'
);
```

### Rolling Back

See MIGRATION_GUIDE.md for detailed rollback procedures.

## Migration Naming Convention

Migrations follow the pattern: `NNN_description.sql`

- **NNN**: Sequential number (001, 002, 003, etc.)
- **description**: Brief description of changes (snake_case)

## Important Notes

- **Order matters**: Execute migrations in numerical order
- **Idempotent**: Migrations use `IF NOT EXISTS` and `ON CONFLICT` where appropriate
- **Backward compatible**: New columns are nullable or have defaults
- **Reversible**: Each migration includes rollback instructions

## Dependencies

- Migration 002 depends on Migration 001 (requires `vehicle_types` table)

## Status

| Migration | Status |
|-----------|--------|
| 001 | Ready |
| 002 | Ready |

## See Also

- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Detailed migration procedures
- [../schema.sql](../schema.sql) - Original schema definition
- [../seed.sql](../seed.sql) - Seed data for wash services
