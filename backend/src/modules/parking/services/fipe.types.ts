/**
 * Type definitions for FIPE API integration
 * FIPE (Fundação Instituto de Pesquisas Econômicas) provides vehicle pricing data
 */

/**
 * Vehicle data retrieved from FIPE API
 * Contains information about a vehicle based on its license plate
 */
export interface FipeVehicleData {
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

  /** Vehicle color (if available) */
  color?: string;

  /** Vehicle type (Carro, Moto, Caminhão) */
  vehicleType: 'Carro' | 'Moto' | 'Caminhão';

  /** Timestamp when data was retrieved */
  retrievedAt: string;
}

/**
 * Response from FIPE API lookup
 */
export interface FipeApiResponse {
  success: boolean;
  data?: FipeVehicleData;
  error?: string;
}

/**
 * Cached FIPE data to avoid repeated API calls
 */
export interface FipeCacheEntry {
  licensePlate: string;
  data: FipeVehicleData;
  cachedAt: string;
  expiresAt: string;
}
