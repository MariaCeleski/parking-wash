# Database Schema and Migrations

This directory contains the database schema definition and migration scripts for the ParkingWash system.

## Files

### Core Schema Files

- **`schema.sql`** - Complete database schema definition
  - Defines all tables: `vehicle_types`, `parking_records`, `wash_services`, `wash_orders`
  - Creates all indexes for query optimization
  - Use this file for fresh database installations

- **`seed.sql`** - Initial data population
  - Populates `vehicle_types` with default values (motorcycle, car, motorhome)
  - Populates `wash_services` with example services
  - Run after schema creation to initialize the database

### Migration Files

- **`migration_001_extend_parking_records.sql`** - Schema extension migration
  - Adds vehicle type and payment tracking to `parking_records` table
  - Creates performance indexes
  - Includes rollback procedure
  - For existing databases: run this migration to add new features

### Documentation

- **`SCHEMA_EXTENSION.md`** - Detailed documentation of schema changes
  - Describes all new columns and their purposes
  - Explains backward compatibility approach
  - Provides SQL query examples
  - Documents migration and rollback procedures

- **`IMPLEMENTATION_SUMMARY.md`** - Implementation summary
  - Overview of changes made
  - Requirements mapping
  - Database schema diagram
  - Next steps for development

- **`README.md`** - This file

## Database Setup

### For New Installations

```bash
# 1. Create schema
psql -h <host> -U <user> -d <database> -f schema.sql

# 2. Populate initial data
psql -h <host> -U <user> -d <database> -f seed.sql
```

### For Existing Installations

```bash
# Apply migration to add new features
psql -h <host> -U <user> -d <database> -f migration_001_extend_parking_records.sql
```

### Using Supabase

```bash
# Push schema changes
supabase db push

# View migrations
supabase migration list
```

## Schema Overview

### Tables

1. **`vehicle_types`** - Vehicle classifications with pricing
   - Stores motorcycle, car, motorhome types
   - Each type has hourly and daily rates
   - Supports active/inactive status

2. **`parking_records`** - Parking session records
   - Tracks vehicle entry/exit times
   - Stores calculated fees
   - Links to vehicle type for pricing
   - Tracks payment status and method

3. **`wash_services`** - Available car wash services
   - Stores service names and prices
   - Includes duration estimates
   - Supports active/inactive status

4. **`wash_orders`** - Car wash service orders
   - Links parking records to wash services
   - Tracks order status (Waiting, InProgress, Completed)
   - Records timestamps for each status change

### Key Indexes

| Index | Table | Purpose |
|-------|-------|---------|
| `idx_parking_records_status` | parking_records | Filter by parking status |
| `idx_parking_records_entry_time` | parking_records | Sort by entry time |
| `idx_parking_records_vehicle_type_id` | parking_records | Filter by vehicle type |
| `idx_parking_records_payment_status` | parking_records | Filter by payment status |
| `idx_parking_records_exit_time_desc` | parking_records | Sort by exit time (recent first) |
| `idx_vehicle_types_is_active` | vehicle_types | Filter active vehicle types |
| `idx_wash_orders_status` | wash_orders | Filter by order status |
| `idx_wash_orders_created_at` | wash_orders | Sort by creation time |

## Backward Compatibility

All schema changes maintain backward compatibility:
- New columns are nullable or have sensible defaults
- Existing records remain unchanged
- Legacy records can coexist with new records
- No data migration required

## Performance Considerations

- Indexes are created on frequently queried columns
- Foreign keys ensure referential integrity
- NUMERIC(10,2) used for monetary values for precision
- TIMESTAMPTZ used for timezone-aware timestamps

## Rollback Procedures

Each migration includes a rollback script. To rollback:

```bash
# For migration_001_extend_parking_records.sql
# Run the rollback script included in the migration file
psql -h <host> -U <user> -d <database> -f rollback_001.sql
```

## Common Queries

### Get parking history with vehicle type
```sql
SELECT pr.*, vt.name, vt.code
FROM parking_records pr
LEFT JOIN vehicle_types vt ON pr.vehicle_type_id = vt.id
WHERE pr.status = 'Exited'
ORDER BY pr.exit_time DESC
LIMIT 10;
```

### Get daily billing report
```sql
SELECT 
  vt.name,
  COUNT(pr.id) as vehicles,
  SUM(pr.total_amount) as revenue
FROM parking_records pr
LEFT JOIN vehicle_types vt ON pr.vehicle_type_id = vt.id
WHERE DATE(pr.exit_time) = CURRENT_DATE
GROUP BY vt.id, vt.name;
```

### Get pending payments
```sql
SELECT * FROM parking_records
WHERE payment_status = 'Pending'
  AND status = 'Exited'
ORDER BY exit_time ASC;
```

## Support

For questions or issues with the database schema:
1. Check the documentation files in this directory
2. Review the schema.sql file for table definitions
3. Consult the migration files for recent changes
4. Check the main README.md in the project root

## Version History

- **v1.0** - Initial schema with parking, wash services, and wash orders
- **v1.1** - Extended parking_records with vehicle type and payment fields (migration_001)
