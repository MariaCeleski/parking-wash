/**
 * FIPE Service (Mock)
 * Simulates vehicle lookup by license plate using a local mock database.
 * Since there is no free/official API for license plate lookup in Brazil,
 * this service provides realistic mock data for development and academic use.
 *
 * Uses an in-memory cache to avoid repeated lookups.
 */

import { FipeVehicleData, FipeCacheEntry } from './fipe.types';
import { MOCK_VEHICLES } from './fipe-mock-data';

/**
 * In-memory cache for vehicle data
 * Cache expires after 24 hours
 */
const fipeCache: Map<string, FipeCacheEntry> = new Map();

/**
 * Fallback vehicle data when plate is not found in mock database
 */
const FALLBACK_VEHICLE_DATA: FipeVehicleData = {
  brand: 'Desconhecido',
  model: 'Modelo Desconhecido',
  year: new Date().getFullYear(),
  fuel: 'Gasolina',
  fipeValue: 0,
  vehicleType: 'Carro',
  retrievedAt: new Date().toISOString(),
};

/**
 * Normalize license plate format
 * Converts to uppercase and removes hyphens/spaces
 * Supports both old format (AAA-9999) and Mercosul format (AAA9A99)
 */
function normalizeLicensePlate(plate: string): string {
  return plate.toUpperCase().replace(/[-\s]/g, '');
}

/**
 * Check if cache entry is still valid (24h TTL)
 */
function isCacheValid(entry: FipeCacheEntry): boolean {
  const now = new Date();
  const expiresAt = new Date(entry.expiresAt);
  return now < expiresAt;
}

/**
 * Look up vehicle data from the mock database
 * Returns mock data for known plates, fallback for unknown plates
 *
 * @param licensePlate - Vehicle license plate (AAA-9999 or AAA9A99 format)
 * @returns Vehicle data from mock DB or fallback
 */
export async function getVehicleDataFromFipe(
  licensePlate: string
): Promise<FipeVehicleData> {
  const normalizedPlate = normalizeLicensePlate(licensePlate);

  // Check cache first
  const cached = fipeCache.get(normalizedPlate);
  if (cached && isCacheValid(cached)) {
    console.log(`[FIPE-MOCK] Cache hit for plate: ${licensePlate}`);
    return cached.data;
  }

  // Look up in mock database
  const mockData = MOCK_VEHICLES[normalizedPlate];

  const vehicleData: FipeVehicleData = mockData
    ? { ...mockData, retrievedAt: new Date().toISOString() }
    : { ...FALLBACK_VEHICLE_DATA, retrievedAt: new Date().toISOString() };

  if (mockData) {
    console.log(`[FIPE-MOCK] Found vehicle for plate ${licensePlate}: ${mockData.brand} ${mockData.model}`);
  } else {
    console.log(`[FIPE-MOCK] Plate ${licensePlate} not in mock DB, returning fallback data`);
  }

  // Cache the result for 24 hours
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  fipeCache.set(normalizedPlate, {
    licensePlate: normalizedPlate,
    data: vehicleData,
    cachedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  });

  return vehicleData;
}

/**
 * Get vehicle data (main entry point)
 * @param licensePlate - Vehicle license plate
 * @returns Vehicle data (mock or fallback)
 */
export async function getVehicleData(licensePlate: string): Promise<FipeVehicleData> {
  return getVehicleDataFromFipe(licensePlate);
}

/**
 * Clear FIPE cache
 * Useful for testing or forcing refresh of all cached data
 */
export function clearFipeCache(): void {
  fipeCache.clear();
  console.log('[FIPE-MOCK] Cache cleared');
}

/**
 * Get cache statistics
 */
export function getFipeCacheStats(): {
  totalEntries: number;
  entries: Array<{ plate: string; cachedAt: string; expiresAt: string }>;
} {
  const entries = Array.from(fipeCache.values()).map((entry) => ({
    plate: entry.licensePlate,
    cachedAt: entry.cachedAt,
    expiresAt: entry.expiresAt,
  }));

  return {
    totalEntries: fipeCache.size,
    entries,
  };
}
