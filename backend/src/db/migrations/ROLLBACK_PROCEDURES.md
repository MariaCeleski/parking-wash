# Database Migration Rollback Procedures

This document provides step-by-step instructions for rolling back database migrations.

## Overview

Rollback procedures are provided for each migration to safely undo schema changes. Always backup your database before executing rollback operations.

---

## Rollback Migration 002: Extend Parking Records

**File**: `002_extend_parking_records.sql`

**When to use**: If you need to remove vehicle type associations, tariff options, and payment tracking from parking records.

### Prerequisites

- Database backup completed
- No active queries on `parking_records` table
- All application instances stopped (to prevent concurrent modifications)

### Rollback Steps

1. **Backup the database** (if not already done):
   - Supabase Dashboard → Database → Backups → Create backup
   - Wait for backup to complete

2. **Open Supabase SQL Editor** or connect with psql

3. **Execute the rollback script**:

```sql
-- Remove new columns and indexes from parking_records table
ALTER TABLE parking_records DROP COLUMN IF EXISTS vehicle_type_id CASCADE;
ALTER TABLE parking_records DROP COLUMN IF EXISTS applied_daily_rate;
ALTER TABLE parking_records DROP COLUMN IF EXISTS payment_status;
ALTER TABLE parking_records DROP COLUMN IF EXISTS payment_method_id;
ALTER TABLE parking_records DROP COLUMN IF EXISTS payment_transaction_id;
DROP INDEX IF EXISTS idx_parking_records_vehicle_type_id;
DROP INDEX IF EXISTS idx_parking_records_payment_status;
DROP INDEX IF EXISTS idx_parking_records_exit_time;
```

4. **Verify the rollback**:

```sql
-- Check that columns are removed
SELECT column_name FROM information_schema.columns
WHERE table_name = 'parking_records'
ORDER BY ordinal_position;

-- Verify indexes are removed
SELECT indexname FROM pg_indexes
WHERE tablename = 'parking_records' AND indexname LIKE 'idx_parking_records_%';
```

### Expected Results

- All new columns removed from `parking_records`
- Three indexes removed: `idx_parking_records_vehicle_type_id`, `idx_parking_records_payment_status`, `idx_parking_records_exit_time`
- Existing parking records remain intact (no data loss)
- Table structure returns to pre-migration state

### Data Loss

- **Vehicle type associations**: Lost (vehicle_type_id values discarded)
- **Tariff information**: Lost (applied_daily_rate values discarded)
- **Payment tracking**: Lost (payment_status, payment_method_id, payment_transaction_id values discarded)
- **Parking records**: Preserved (no records deleted)

### Recovery

If you need to recover the rolled-back data:
1. Restore from the backup created before rollback
2. Re-apply Migration 002

---

## Rollback Migration 001: Create Vehicle Types

**File**: `001_create_vehicle_types.sql`

**When to use**: If you need to remove the vehicle types table entirely.

### Prerequisites

- Database backup completed
- Migration 002 has been rolled back (if it was applied)
- No active queries on `vehicle_types` table
- All application instances stopped

### Rollback Steps

1. **Backup the database** (if not already done):
   - Supabase Dashboard → Database → Backups → Create backup
   - Wait for backup to complete

2. **Check for dependencies**:

```sql
-- Verify no foreign key constraints exist
SELECT constraint_name, table_name, column_name
FROM information_schema.key_column_usage
WHERE referenced_table_name = 'vehicle_types';
```

If results are returned, Migration 002 has not been rolled back. Rollback Migration 002 first.

3. **Open Supabase SQL Editor** or connect with psql

4. **Execute the rollback script**:

```sql
-- Drop the vehicle_types table
DROP TABLE IF EXISTS vehicle_types CASCADE;
```

5. **Verify the rollback**:

```sql
-- Check that table is removed
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_name = 'vehicle_types'
);
-- Expected result: false
```

### Expected Results

- `vehicle_types` table removed
- All indexes on `vehicle_types` removed
- Seed data (motorcycle, car, motorhome) deleted

### Data Loss

- **Vehicle types**: Lost (all 3 seed records deleted)
- **Pricing configuration**: Lost (hourly and daily rates deleted)

### Recovery

If you need to recover the rolled-back data:
1. Restore from the backup created before rollback
2. Re-apply Migration 001

---

## Complete Rollback (Both Migrations)

**When to use**: If you need to completely undo all parking-improvements schema changes.

### Prerequisites

- Database backup completed
- All application instances stopped
- No active queries on affected tables

### Rollback Steps

1. **Backup the database**:
   - Supabase Dashboard → Database → Backups → Create backup

2. **Rollback Migration 002 first** (see section above):

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

3. **Rollback Migration 001** (see section above):

```sql
DROP TABLE IF EXISTS vehicle_types CASCADE;
```

4. **Verify complete rollback**:

```sql
-- Check vehicle_types table is removed
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_name = 'vehicle_types'
);
-- Expected: false

-- Check parking_records columns are removed
SELECT column_name FROM information_schema.columns
WHERE table_name = 'parking_records' AND column_name IN (
  'vehicle_type_id', 'applied_daily_rate', 'payment_status',
  'payment_method_id', 'payment_transaction_id'
);
-- Expected: no rows
```

### Expected Results

- `vehicle_types` table removed
- All new columns removed from `parking_records`
- All new indexes removed
- Database schema returns to original state (before parking-improvements)

---

## Partial Rollback Scenarios

### Scenario 1: Keep Vehicle Types, Remove Payment Fields

If you want to keep vehicle type support but remove payment tracking:

```sql
-- Remove only payment-related columns
ALTER TABLE parking_records DROP COLUMN IF EXISTS payment_status;
ALTER TABLE parking_records DROP COLUMN IF EXISTS payment_method_id;
ALTER TABLE parking_records DROP COLUMN IF EXISTS payment_transaction_id;
DROP INDEX IF EXISTS idx_parking_records_payment_status;

-- Keep vehicle_type_id and applied_daily_rate
```

### Scenario 2: Keep Vehicle Types, Remove Daily Rate Option

If you want to keep vehicle types but remove the daily rate option:

```sql
-- Remove only the daily rate tracking column
ALTER TABLE parking_records DROP COLUMN IF EXISTS applied_daily_rate;

-- Keep vehicle_type_id and payment fields
```

---

## Troubleshooting Rollback Issues

### Issue: "Cannot drop table 'vehicle_types' because other objects depend on it"

**Cause**: Foreign key constraints still exist (Migration 002 not rolled back)

**Solution**:
1. Rollback Migration 002 first
2. Then rollback Migration 001

Or use CASCADE:
```sql
DROP TABLE IF EXISTS vehicle_types CASCADE;
```

### Issue: "Column 'vehicle_type_id' does not exist"

**Cause**: Migration 002 was not applied or already rolled back

**Solution**: Verify migration status and skip this rollback step

### Issue: "Index 'idx_parking_records_vehicle_type_id' does not exist"

**Cause**: Index was not created or already dropped

**Solution**: The `IF EXISTS` clause handles this; the command will succeed

### Issue: Rollback takes a long time

**Cause**: Large number of parking records (millions of rows)

**Solution**:
- This is normal; wait for the operation to complete
- Monitor progress in Supabase dashboard
- Do not interrupt the operation

### Issue: "Permission denied" error

**Cause**: Insufficient database permissions

**Solution**:
- Use a database user with admin/owner permissions
- Contact database administrator

---

## Verification Checklist

After completing a rollback, verify:

- [ ] Database backup exists (created before rollback)
- [ ] All specified tables/columns removed
- [ ] All specified indexes removed
- [ ] Existing parking records still present (not deleted)
- [ ] No foreign key constraint errors
- [ ] Application can connect to database
- [ ] Application functions correctly with rolled-back schema

---

## Recovery from Failed Rollback

If a rollback fails or causes issues:

1. **Stop all application instances** to prevent further modifications
2. **Restore from backup**:
   - Supabase Dashboard → Database → Backups
   - Select the backup created before rollback
   - Click "Restore"
   - Wait for restore to complete
3. **Verify database state**:
   - Check that tables and columns are restored
   - Verify data integrity
4. **Restart application instances**
5. **Investigate root cause** of rollback failure
6. **Retry rollback** with corrected procedure

---

## Best Practices

1. **Always backup before rollback**: Use Supabase automated backups
2. **Test in staging first**: Perform rollback in staging environment before production
3. **Schedule during maintenance window**: Perform rollbacks during low-traffic periods
4. **Notify team members**: Inform team before starting rollback
5. **Monitor application**: Watch for errors after rollback
6. **Document changes**: Record what was rolled back and why
7. **Keep rollback scripts**: Store rollback procedures for future reference

---

## Related Documentation

- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Forward migration procedures
- [README.md](./README.md) - Migration overview
- [001_create_vehicle_types.sql](./001_create_vehicle_types.sql) - Vehicle types migration
- [002_extend_parking_records.sql](./002_extend_parking_records.sql) - Parking records extension migration
