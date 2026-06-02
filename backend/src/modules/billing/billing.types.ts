/**
 * Type definitions for the billing module
 * Defines all interfaces and types used in billing operations
 */

import { VehicleType } from '../vehicle-types/vehicle-type.types';

/**
 * Breakdown of parking records by vehicle type
 */
export interface VehicleTypeBreakdown {
  /** Vehicle type information */
  vehicleType: Pick<VehicleType, 'id' | 'name' | 'code'>;

  /** Number of exited vehicles of this type */
  count: number;

  /** Total revenue from this vehicle type (2 decimal places) */
  revenue: number;
}

/**
 * Daily billing report with aggregated revenue data
 */
export interface DailyBillingReport {
  /** Report date in YYYY-MM-DD format */
  date: string;

  /** Sum of all total_amount for Exited records within the day */
  totalRevenue: number;

  /** Count of Exited records within the day */
  totalVehicles: number;

  /** Revenue breakdown by vehicle type */
  byVehicleType: VehicleTypeBreakdown[];
}
