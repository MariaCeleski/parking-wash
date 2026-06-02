/**
 * Tests for VehicleTypeService
 * Tests listActive(), getById(), and updateRates() methods
 */

// Mock Supabase BEFORE importing the service
jest.mock('../src/db/supabase', () => {
  const mockChain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    single: jest.fn(),
  };

  return {
    supabase: {
      from: jest.fn().mockReturnValue(mockChain),
    },
  };
});

import { VehicleTypeService } from '../src/modules/vehicle-types/vehicle-type.service';
import { supabase } from '../src/db/supabase';
import {
  NotFoundError,
  ServiceUnavailableError,
  ValidationError,
} from '../src/middleware/errors';

describe('VehicleTypeService', () => {
  let vehicleTypeService: VehicleTypeService;

  beforeEach(() => {
    jest.clearAllMocks();
    vehicleTypeService = new VehicleTypeService();
  });

  // ========================================================================
  // listActive Tests
  // ========================================================================

  describe('listActive', () => {
    it('should return array of active vehicle types', async () => {
      // Mock data as returned from DB (snake_case)
      const mockDbRows = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Motorcycle',
          code: 'MOTO',
          hourly_rate: 5.0,
          daily_rate: 30.0,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Car',
          code: 'CAR',
          hourly_rate: 10.0,
          daily_rate: 60.0,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      // Expected result after mapToVehicleType (camelCase)
      const expectedResult = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Motorcycle',
          code: 'MOTO',
          hourlyRate: 5.0,
          dailyRate: 30.0,
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Car',
          code: 'CAR',
          hourlyRate: 10.0,
          dailyRate: 60.0,
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: mockDbRows,
          error: null,
        }),
        update: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await vehicleTypeService.listActive();

      expect(result).toEqual(expectedResult);
      expect(result.length).toBe(2);
      expect(supabase.from).toHaveBeenCalledWith('vehicle_types');
      expect(mockChain.select).toHaveBeenCalledWith(
        'id, name, code, hourly_rate, daily_rate, is_active, created_at, updated_at'
      );
      expect(mockChain.eq).toHaveBeenCalledWith('is_active', true);
    });

    it('should return empty array when no active vehicle types exist', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
        update: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await vehicleTypeService.listActive();

      expect(result).toEqual([]);
    });

    it('should throw ServiceUnavailableError on database error', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST500', message: 'Internal server error' },
        }),
        update: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await expect(vehicleTypeService.listActive()).rejects.toThrow(
        ServiceUnavailableError
      );
    });
  });

  // ========================================================================
  // getById Tests
  // ========================================================================

  describe('getById', () => {
    it('should return vehicle type by id', async () => {
      const vehicleTypeId = '550e8400-e29b-41d4-a716-446655440000';
      const mockDbRow = {
        id: vehicleTypeId,
        name: 'Car',
        code: 'CAR',
        hourly_rate: 10.0,
        daily_rate: 60.0,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const expectedResult = {
        id: vehicleTypeId,
        name: 'Car',
        code: 'CAR',
        hourlyRate: 10.0,
        dailyRate: 60.0,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockDbRow,
          error: null,
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await vehicleTypeService.getById(vehicleTypeId);

      expect(result).toEqual(expectedResult);
      expect(supabase.from).toHaveBeenCalledWith('vehicle_types');
      expect(mockChain.select).toHaveBeenCalledWith(
        'id, name, code, hourly_rate, daily_rate, is_active, created_at, updated_at'
      );
      expect(mockChain.eq).toHaveBeenCalledWith('id', vehicleTypeId);
    });

    it('should throw NotFoundError when vehicle type does not exist', async () => {
      const vehicleTypeId = '550e8400-e29b-41d4-a716-446655440000';

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows found' },
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await expect(vehicleTypeService.getById(vehicleTypeId)).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw ServiceUnavailableError on database error', async () => {
      const vehicleTypeId = '550e8400-e29b-41d4-a716-446655440000';

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST500', message: 'Internal server error' },
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await expect(vehicleTypeService.getById(vehicleTypeId)).rejects.toThrow(
        ServiceUnavailableError
      );
    });
  });

  // ========================================================================
  // updateRates Tests
  // ========================================================================

  describe('updateRates', () => {
    it('should update rates with valid values', async () => {
      const vehicleTypeId = '550e8400-e29b-41d4-a716-446655440000';
      const newHourlyRate = 12.5;
      const newDailyRate = 75.0;

      const mockDbRow = {
        id: vehicleTypeId,
        name: 'Car',
        code: 'CAR',
        hourly_rate: newHourlyRate,
        daily_rate: newDailyRate,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      const expectedResult = {
        id: vehicleTypeId,
        name: 'Car',
        code: 'CAR',
        hourlyRate: newHourlyRate,
        dailyRate: newDailyRate,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      };

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockDbRow,
          error: null,
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await vehicleTypeService.updateRates(
        vehicleTypeId,
        newHourlyRate,
        newDailyRate
      );

      expect(result).toEqual(expectedResult);
      expect(supabase.from).toHaveBeenCalledWith('vehicle_types');
      expect(mockChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          hourly_rate: newHourlyRate,
          daily_rate: newDailyRate,
        })
      );
      expect(mockChain.eq).toHaveBeenCalledWith('id', vehicleTypeId);
    });

    it('should reject hourly_rate < 0.01', async () => {
      const vehicleTypeId = '550e8400-e29b-41d4-a716-446655440000';

      await expect(
        vehicleTypeService.updateRates(vehicleTypeId, 0.009, 30.0)
      ).rejects.toThrow(ValidationError);
    });

    it('should reject daily_rate < 0.01', async () => {
      const vehicleTypeId = '550e8400-e29b-41d4-a716-446655440000';

      await expect(
        vehicleTypeService.updateRates(vehicleTypeId, 10.0, 0.005)
      ).rejects.toThrow(ValidationError);
    });

    it('should reject both rates < 0.01', async () => {
      const vehicleTypeId = '550e8400-e29b-41d4-a716-446655440000';

      await expect(
        vehicleTypeService.updateRates(vehicleTypeId, 0.0, 0.0)
      ).rejects.toThrow(ValidationError);
    });

    it('should accept hourly_rate = 0.01 (minimum valid)', async () => {
      const vehicleTypeId = '550e8400-e29b-41d4-a716-446655440000';
      const mockDbRow = {
        id: vehicleTypeId,
        name: 'Car',
        code: 'CAR',
        hourly_rate: 0.01,
        daily_rate: 0.01,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      const expectedResult = {
        id: vehicleTypeId,
        name: 'Car',
        code: 'CAR',
        hourlyRate: 0.01,
        dailyRate: 0.01,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      };

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockDbRow,
          error: null,
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await vehicleTypeService.updateRates(
        vehicleTypeId,
        0.01,
        0.01
      );

      expect(result).toEqual(expectedResult);
    });

    it('should throw NotFoundError when vehicle type does not exist', async () => {
      const vehicleTypeId = '550e8400-e29b-41d4-a716-446655440000';

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows found' },
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await expect(
        vehicleTypeService.updateRates(vehicleTypeId, 10.0, 60.0)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ServiceUnavailableError on database error', async () => {
      const vehicleTypeId = '550e8400-e29b-41d4-a716-446655440000';

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST500', message: 'Internal server error' },
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await expect(
        vehicleTypeService.updateRates(vehicleTypeId, 10.0, 60.0)
      ).rejects.toThrow(ServiceUnavailableError);
    });

    it('should update updated_at timestamp', async () => {
      const vehicleTypeId = '550e8400-e29b-41d4-a716-446655440000';
      const mockDbRow = {
        id: vehicleTypeId,
        name: 'Car',
        code: 'CAR',
        hourly_rate: 12.5,
        daily_rate: 75.0,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockDbRow,
          error: null,
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await vehicleTypeService.updateRates(vehicleTypeId, 12.5, 75.0);

      // Verify that update was called with updated_at
      const updateCall = mockChain.update.mock.calls[0][0];
      expect(updateCall).toHaveProperty('updated_at');
      expect(typeof updateCall.updated_at).toBe('string');
    });
  });
});
