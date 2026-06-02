/**
 * Type definitions for the wash-service-prices module
 * Defines interfaces for managing prices per vehicle type × wash service combination
 */

/**
 * Database row representation of a wash service price
 * Maps directly to the `wash_service_prices` table columns
 */
export interface WashServicePrice {
  /** Unique identifier (UUID) */
  id: string;

  /** Foreign key to vehicle_types table */
  vehicle_type_id: string;

  /** Foreign key to wash_services table */
  wash_service_id: string;

  /** Price value (NUMERIC(10,2), range: 0.01 to 99999999.99) */
  price: number;

  /** ISO 8601 UTC timestamp of creation */
  created_at: string;

  /** ISO 8601 UTC timestamp of last update */
  updated_at: string;
}

/**
 * API response representation of a wash service price
 * Includes resolved entity names for display in the frontend
 */
export interface WashServicePriceResponse {
  /** Unique identifier (UUID) */
  id: string;

  /** Vehicle type UUID */
  vehicleTypeId: string;

  /** Wash service UUID */
  washServiceId: string;

  /** Configured price value */
  price: number;

  /** Display name of the vehicle type */
  vehicleTypeName: string;

  /** Display name of the wash service */
  washServiceName: string;
}

/**
 * Payload for creating or updating a price (upsert operation)
 * Used in PUT /api/wash-service-prices
 */
export interface UpsertPricePayload {
  /** Vehicle type UUID */
  vehicleTypeId: string;

  /** Wash service UUID */
  washServiceId: string;

  /** Price value (must be between 0.01 and 99999999.99, max 2 decimal places) */
  price: number;
}

/**
 * Result of resolving a price for a vehicle type × wash service combination
 * Used internally when creating wash orders
 */
export interface ResolvePriceResult {
  /** Resolved price value */
  price: number;

  /** Whether the price comes from the service default (true) or a specific configuration (false) */
  isDefault: boolean;
}
