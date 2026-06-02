/**
 * Type definitions for the parking module
 * Defines all interfaces and types used in parking check-in/check-out operations
 */

/**
 * Status of a parking record
 * - 'Parked': Vehicle is currently in the parking lot
 * - 'Exited': Vehicle has left the parking lot
 */
export type ParkingStatus = 'Parked' | 'Exited';

/**
 * Complete parking record stored in the database
 * Represents a vehicle's entry and exit from the parking lot
 */
export interface ParkingRecord {
  /** Unique identifier (UUID) */
  id: string;

  /** Vehicle license plate in Brazilian format (legacy: AAA-9999 or Mercosul: AAA9A99) */
  licensePlate: string;

  /** ISO 8601 UTC timestamp of vehicle entry */
  entryTime: string;

  /** ISO 8601 UTC timestamp of vehicle exit, or null if still parked */
  exitTime: string | null;

  /** Duration of parking in minutes, or null if still parked */
  durationMinutes: number | null;

  /** Total amount charged in Brazilian Real, or null if still parked */
  totalAmount: number | null;

  /** Current status of the parking record */
  status: ParkingStatus;

  /** Vehicle type UUID (optional for backward compatibility) */
  vehicleTypeId?: string | null;

  /** Whether daily rate was applied */
  appliedDailyRate?: boolean;

  /** Payment status */
  paymentStatus?: string;

  /** Payment method ID */
  paymentMethodId?: string | null;

  /** Payment transaction ID */
  paymentTransactionId?: string | null;
}

/**
 * Vehicle information from FIPE API
 * Contains brand, model, year, fuel type, and estimated value
 */
export interface VehicleInfo {
  /** Vehicle brand/manufacturer */
  brand: string;

  /** Vehicle model */
  model: string;

  /** Vehicle year of manufacture */
  year: number;

  /** Fuel type (Gasolina, Diesel, Álcool, Híbrido, Elétrico) */
  fuel: string;

  /** FIPE reference value in Brazilian Real */
  fipeValue: number;

  /** Vehicle type (Carro, Moto, Caminhão) */
  vehicleType: 'Carro' | 'Moto' | 'Caminhão';

  /** Timestamp when data was retrieved */
  retrievedAt: string;
}

/**
 * Request payload for check-in operation
 * Sent by the client to register a vehicle entry
 */
export interface CheckInRequest {
  /** Vehicle license plate in Brazilian format */
  licensePlate: string;

  /** Vehicle type UUID (optional for backward compatibility) */
  vehicleTypeId?: string;
}

/**
 * Response payload for successful check-in operation
 * Returned to the client after vehicle entry is registered
 */
export interface CheckInResponse {
  /** Unique identifier of the parking record */
  id: string;

  /** Vehicle license plate */
  licensePlate: string;

  /** ISO 8601 UTC timestamp of vehicle entry */
  entryTime: string;

  /** Current status (always 'Parked' for check-in response) */
  status: ParkingStatus;

  /** Vehicle information from FIPE (optional) */
  vehicleInfo?: VehicleInfo;
}

/**
 * Request payload for check-out operation
 * Sent by the client to register a vehicle exit with tariff options
 */
export interface CheckOutRequest {
  /** Whether to apply daily rate instead of hourly */
  applyDailyRate?: boolean;

  /** Payment method ID (e.g., "credit_card", "cash", "pix") */
  paymentMethodId?: string;
}

/**
 * Response payload for successful check-out operation
 * Returned to the client after vehicle exit and tariff calculation
 */
export interface CheckOutResponse {
  /** Unique identifier of the parking record */
  id: string;

  /** Vehicle license plate */
  licensePlate: string;

  /** ISO 8601 UTC timestamp of vehicle entry */
  entryTime: string;

  /** ISO 8601 UTC timestamp of vehicle exit */
  exitTime: string | null;

  /** Duration of parking in minutes */
  durationMinutes: number | null;

  /** Total amount charged in Brazilian Real */
  totalAmount: number;

  /** Current status (always 'Exited' for check-out response) */
  status: ParkingStatus;

  /** Whether daily rate was applied */
  appliedDailyRate?: boolean;

  /** Payment status */
  paymentStatus?: string;

  /** Vehicle information from FIPE (optional) */
  vehicleInfo?: VehicleInfo;
}
