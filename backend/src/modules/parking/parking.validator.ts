/**
 * Validation schemas and utilities for the parking module
 * Uses Zod for runtime validation of parking-related requests
 */

import { z } from 'zod';

/**
 * Regex pattern for legacy Brazilian license plate format
 * Format: AAA-9999 (3 uppercase letters, hyphen, 4 digits)
 * Example: ABC-1234
 */
const LEGACY_PLATE_REGEX = /^[A-Z]{3}-\d{4}$/;

/**
 * Regex pattern for Mercosul Brazilian license plate format
 * Format: AAA9A99 (3 uppercase letters, 1 digit, 1 uppercase letter, 2 digits)
 * Example: ABC1D23
 */
const MERCOSUL_PLATE_REGEX = /^[A-Z]{3}\d[A-Z]\d{2}$/;

/**
 * Validates if a license plate string matches either Brazilian format
 * @param plate - The license plate string to validate
 * @returns true if the plate matches legacy (AAA-9999) or Mercosul (AAA9A99) format, false otherwise
 */
export function isValidLicensePlate(plate: string): boolean {
  return LEGACY_PLATE_REGEX.test(plate) || MERCOSUL_PLATE_REGEX.test(plate);
}

/**
 * Zod schema for validating check-in requests
 * Validates that licensePlate is a non-empty string matching Brazilian plate formats
 * Allows optional vehicleTypeId for vehicle type selection
 */
export const checkInSchema = z.object({
  licensePlate: z
    .string()
    .min(1, 'Placa é obrigatória')
    .refine(
      (plate) => isValidLicensePlate(plate),
      'Placa inválida. Use o formato AAA-9999 ou AAA9A99'
    ),
  vehicleTypeId: z.string().uuid().optional(),
});

/**
 * Type inference from checkInSchema for type-safe request handling
 */
export type CheckInSchemaType = z.infer<typeof checkInSchema>;

/**
 * Zod schema for validating list parking query parameters
 * Validates optional status filter parameter
 */
export const listParkingSchema = z.object({
  status: z
    .enum(['Parked', 'Exited'])
    .optional()
    .describe('Filter parking records by status'),
});

/**
 * Type inference from listParkingSchema for type-safe query parameter handling
 */
export type ListParkingSchemaType = z.infer<typeof listParkingSchema>;

/**
 * Regex pattern for UUID format validation
 * Matches standard UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 * where x is any hexadecimal digit
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates if a string is a valid UUID format
 * @param id - The string to validate as UUID
 * @returns true if the string is a valid UUID, false otherwise
 */
export function validateVehicleTypeId(id: string): boolean {
  return UUID_REGEX.test(id);
}

/**
 * Validation result object returned by vehicle type ID validation
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates a vehicle type ID and returns a validation result with error message if invalid
 * @param vehicleTypeId - The vehicle type ID to validate
 * @returns ValidationResult object with isValid flag and optional error message
 */
export function validateVehicleTypeIdWithResult(vehicleTypeId: string): ValidationResult {
  if (!vehicleTypeId) {
    return {
      isValid: false,
      error: 'ID do tipo de veículo é obrigatório',
    };
  }

  if (!validateVehicleTypeId(vehicleTypeId)) {
    return {
      isValid: false,
      error: 'ID do tipo de veículo deve ser um UUID válido',
    };
  }

  return {
    isValid: true,
  };
}
