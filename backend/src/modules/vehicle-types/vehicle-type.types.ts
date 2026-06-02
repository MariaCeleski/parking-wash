/**
 * Type definitions for the vehicle-types module
 * Defines all interfaces and types used in vehicle type operations
 */

/**
 * Vehicle type with pricing information
 * Represents a category of vehicles with specific hourly and daily rates
 */
export interface VehicleType {
  /** Unique identifier (UUID) */
  id: string;

  /** Display name (e.g., "Motocicleta", "Carro", "Motorhome") */
  name: string;

  /** Unique code identifier (e.g., "MOTORCYCLE", "CAR", "MOTORHOME") */
  code: string;

  /** Hourly parking rate in Brazilian Real (minimum 0.01) */
  hourlyRate: number;

  /** Daily parking rate in Brazilian Real (minimum 0.01) */
  dailyRate: number;

  /** Whether this vehicle type is available for use */
  isActive: boolean;

  /** ISO 8601 UTC timestamp of creation */
  createdAt: string;

  /** ISO 8601 UTC timestamp of last update */
  updatedAt: string;
}

/**
 * Request payload for updating vehicle type rates
 */
export interface UpdateRatesRequest {
  /** New hourly rate (must be >= 0.01) */
  hourlyRate: number;

  /** New daily rate (must be >= 0.01) */
  dailyRate: number;
}

/**
 * Response payload for vehicle type operations
 */
export interface VehicleTypeResponse {
  /** Unique identifier */
  id: string;

  /** Display name */
  name: string;

  /** Unique code */
  code: string;

  /** Hourly rate */
  hourlyRate: number;

  /** Daily rate */
  dailyRate: number;

  /** Active status */
  isActive: boolean;
}

/**
 * Request payload for creating a new vehicle type
 */
export interface CreateVehicleTypeRequest {
  /** Display name (2-50 characters) */
  name: string;

  /** Unique code (2-20 characters, uppercase alphanumeric + underscore) */
  code: string;
}

/**
 * Request payload for updating a vehicle type (only name can be changed)
 */
export interface UpdateVehicleTypeRequest {
  /** Display name (2-50 characters) */
  name: string;
}
