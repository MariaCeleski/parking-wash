/**
 * SINESP Service
 * Integrates with SINESP Cidadão API to retrieve vehicle information by license plate
 * SINESP provides more accurate and reliable data than FIPE
 * 
 * Uses HTTP requests to query the SINESP public API
 */

import axios from 'axios';
import { FipeVehicleData } from './fipe.types';

/**
 * In-memory cache for SINESP data
 * Stores vehicle information to avoid repeated API calls
 * Cache expires after 24 hours
 */
interface SinespCacheEntry {
  licensePlate: string;
  data: FipeVehicleData;
  cachedAt: string;
  expiresAt: string;
}

const sinespCache: Map<string, SinespCacheEntry> = new Map();

/**
 * Normalize license plate format
 * Converts to uppercase and removes hyphens
 * Supports both old format (AAA-9999) and Mercosul format (AAA9A99)
 */
function normalizeLicensePlate(plate: string): string {
  return plate.toUpperCase().replace(/-/g, '');
}

/**
 * Check if cache entry is still valid
 */
function isCacheValid(entry: SinespCacheEntry): boolean {
  const now = new Date();
  const expiresAt = new Date(entry.expiresAt);
  return now < expiresAt;
}

/**
 * Classify vehicle type based on model name
 */
function classifyVehicleType(model: string): 'Carro' | 'Moto' | 'Caminhão' {
  const modelLower = model.toLowerCase();
  
  if (modelLower.includes('moto') || modelLower.includes('motorcycle')) {
    return 'Moto';
  }
  if (modelLower.includes('caminhão') || modelLower.includes('truck')) {
    return 'Caminhão';
  }
  
  return 'Carro';
}

/**
 * Get vehicle data from SINESP API
 * Attempts to fetch real data from SINESP
 * Falls back to default data if API is unavailable
 *
 * @param licensePlate - Vehicle license plate (AAA-9999 or AAA9A99 format)
 * @returns Vehicle data from SINESP or fallback data
 */
export async function getVehicleDataFromSinesp(
  licensePlate: string
): Promise<FipeVehicleData> {
  try {
    const normalizedPlate = normalizeLicensePlate(licensePlate);

    // Check cache first
    const cached = sinespCache.get(normalizedPlate);
    if (cached && isCacheValid(cached)) {
      console.log(`[SINESP] Cache hit for plate: ${licensePlate}`);
      return cached.data;
    }

    // Try to fetch from SINESP API
    const vehicleData = await fetchFromSinespApi(normalizedPlate);

    // Cache the result
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    sinespCache.set(normalizedPlate, {
      licensePlate: normalizedPlate,
      data: vehicleData,
      cachedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });

    console.log(`[SINESP] Successfully retrieved data for plate: ${licensePlate}`);
    return vehicleData;
  } catch (error) {
    console.error(`[SINESP] Error fetching vehicle data for plate ${licensePlate}:`, error);
    // Return fallback data to ensure application continues working
    return getFallbackVehicleData();
  }
}

/**
 * Fetch vehicle data from SINESP API
 * Uses HTTP requests to query the SINESP Cidadão database
 *
 * @param normalizedPlate - Normalized license plate (without hyphens)
 * @returns Vehicle data from SINESP API
 */
async function fetchFromSinespApi(normalizedPlate: string): Promise<FipeVehicleData> {
  try {
    // SINESP API endpoint - using public API
    // Note: SINESP API may have rate limiting and availability constraints
    const sinespUrl = `https://www.sinesp.gov.br/api/v1/veiculos/${normalizedPlate}`;
    
    console.log(`[SINESP] Querying API for plate: ${normalizedPlate}`);
    
    const response = await axios.get(sinespUrl, {
      timeout: 5000, // 5 second timeout
      headers: {
        'User-Agent': 'ParkingWash/1.0',
      },
    });

    const result = response.data;

    if (!result) {
      throw new Error('SINESP returned empty result');
    }

    // Transform SINESP response to FipeVehicleData format
    return {
      brand: result.brand || result.marca || 'Desconhecido',
      model: result.model || result.modelo || 'Modelo Desconhecido',
      year: result.year || result.ano || new Date().getFullYear(),
      fuel: result.fuel || result.combustivel || 'Gasolina',
      fipeValue: 0, // SINESP doesn't return FIPE value
      vehicleType: classifyVehicleType(result.model || result.modelo || ''),
      retrievedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`[SINESP] API call failed:`, error);
    throw error;
  }
}

/**
 * Get fallback vehicle data when SINESP is unavailable
 */
function getFallbackVehicleData(): FipeVehicleData {
  return {
    brand: 'Desconhecido',
    model: 'Modelo Desconhecido',
    year: new Date().getFullYear(),
    fuel: 'Gasolina',
    fipeValue: 0,
    vehicleType: 'Carro',
    retrievedAt: new Date().toISOString(),
  };
}

/**
 * Get vehicle data with fallback
 * Attempts to get real SINESP data, falls back to default if unavailable
 *
 * @param licensePlate - Vehicle license plate
 * @returns Vehicle data (real or fallback)
 */
export async function getVehicleData(licensePlate: string): Promise<FipeVehicleData> {
  return getVehicleDataFromSinesp(licensePlate);
}

/**
 * Clear SINESP cache
 * Useful for testing or forcing refresh of all cached data
 */
export function clearSinespCache(): void {
  sinespCache.clear();
  console.log('[SINESP] Cache cleared');
}

/**
 * Get cache statistics
 * Returns information about cached entries
 */
export function getSinespCacheStats(): {
  totalEntries: number;
  entries: Array<{ plate: string; cachedAt: string; expiresAt: string }>;
} {
  const entries = Array.from(sinespCache.values()).map((entry) => ({
    plate: entry.licensePlate,
    cachedAt: entry.cachedAt,
    expiresAt: entry.expiresAt,
  }));

  return {
    totalEntries: sinespCache.size,
    entries,
  };
}
