/**
 * Tests for parking.validator module
 * Tests UUID validation for vehicle type IDs
 */

import {
  validateVehicleTypeId,
  validateVehicleTypeIdWithResult,
  ValidationResult,
} from '../src/modules/parking/parking.validator';

describe('parking.validator', () => {
  describe('validateVehicleTypeId', () => {
    it('should return true for valid UUID format', () => {
      const validUUIDs = [
        '550e8400-e29b-41d4-a716-446655440000',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        '123e4567-e89b-12d3-a456-426614174000',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      ];

      validUUIDs.forEach((uuid) => {
        expect(validateVehicleTypeId(uuid)).toBe(true);
      });
    });

    it('should return false for invalid UUID format', () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '550e8400-e29b-41d4-a716',
        '550e8400-e29b-41d4-a716-446655440000-extra',
        '550e8400-e29b-41d4-g716-446655440000', // invalid hex character (g)
        '',
        '550e8400e29b41d4a716446655440000', // missing hyphens
      ];

      invalidUUIDs.forEach((uuid) => {
        expect(validateVehicleTypeId(uuid)).toBe(false);
      });
    });

    it('should be case-insensitive', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      expect(validateVehicleTypeId(uuid.toUpperCase())).toBe(true);
      expect(validateVehicleTypeId(uuid.toLowerCase())).toBe(true);
      expect(validateVehicleTypeId(uuid.toUpperCase().slice(0, 8) + uuid.slice(8))).toBe(true);
    });
  });

  describe('validateVehicleTypeIdWithResult', () => {
    it('should return isValid=true for valid UUID', () => {
      const result = validateVehicleTypeIdWithResult('550e8400-e29b-41d4-a716-446655440000');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return isValid=false with error message for empty string', () => {
      const result = validateVehicleTypeIdWithResult('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('ID do tipo de veículo é obrigatório');
    });

    it('should return isValid=false with error message for invalid UUID format', () => {
      const result = validateVehicleTypeIdWithResult('not-a-uuid');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('ID do tipo de veículo deve ser um UUID válido');
    });

    it('should return ValidationResult interface with correct structure', () => {
      const result: ValidationResult = validateVehicleTypeIdWithResult('550e8400-e29b-41d4-a716-446655440000');
      expect(result).toHaveProperty('isValid');
      expect(typeof result.isValid).toBe('boolean');
      if (!result.isValid) {
        expect(result).toHaveProperty('error');
        expect(typeof result.error).toBe('string');
      }
    });

    it('should handle various invalid UUID formats', () => {
      const invalidCases = [
        { input: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx', expectedError: 'ID do tipo de veículo deve ser um UUID válido' },
        { input: '550e8400e29b41d4a716446655440000', expectedError: 'ID do tipo de veículo deve ser um UUID válido' },
        { input: '550e8400-e29b-41d4-a716-44665544000', expectedError: 'ID do tipo de veículo deve ser um UUID válido' }, // too short
      ];

      invalidCases.forEach(({ input, expectedError }) => {
        const result = validateVehicleTypeIdWithResult(input);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(expectedError);
      });
    });
  });
});
