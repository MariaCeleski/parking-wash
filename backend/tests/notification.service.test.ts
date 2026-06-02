/**
 * Unit tests for NotificationService
 * Tests sendNotification() method for logging and success/failure handling
 * **Validates: Requirements 8.4, 8.6**
 */

import { NotificationService } from '../src/modules/notifications/notification.service';
import { TimeWarningNotification } from '../src/modules/notifications/notification.types';
import { VehicleType } from '../src/modules/vehicle-types/vehicle-type.types';

describe('NotificationService', () => {
  let service: NotificationService;
  let consoleSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  const mockVehicleType: VehicleType = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Carro',
    code: 'CAR',
    hourlyRate: 10.0,
    dailyRate: 60.0,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const createNotification = (
    overrides: Partial<TimeWarningNotification> = {}
  ): TimeWarningNotification => ({
    parkingId: 'parking-001',
    licensePlate: 'ABC-1234',
    vehicleType: mockVehicleType,
    durationMinutes: 1380,
    timeLimit: 1440,
    notificationType: 'warning',
    timestamp: '2024-01-01T23:00:00Z',
    ...overrides,
  });

  beforeEach(() => {
    service = new NotificationService();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('sendNotification()', () => {
    it('should return success when notification is sent', async () => {
      const notification = createNotification();

      const result = await service.sendNotification(notification);

      expect(result.success).toBe(true);
      expect(result.message).toContain('ABC-1234');
    });

    it('should log notification with timestamp, license plate, and notification type', async () => {
      const notification = createNotification({
        licensePlate: 'XYZ-9876',
        notificationType: 'critical',
        timestamp: '2024-06-15T14:30:00Z',
      });

      await service.sendNotification(notification);

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const logMessage = consoleSpy.mock.calls[0][0] as string;
      expect(logMessage).toContain('CRITICAL');
      expect(logMessage).toContain('XYZ-9876');
      expect(logMessage).toContain('2024-06-15T14:30:00Z');
    });

    it('should log vehicle type name in the notification', async () => {
      const notification = createNotification();

      await service.sendNotification(notification);

      const logMessage = consoleSpy.mock.calls[0][0] as string;
      expect(logMessage).toContain('Carro');
    });

    it('should handle warning notification type correctly', async () => {
      const notification = createNotification({ notificationType: 'warning' });

      const result = await service.sendNotification(notification);

      expect(result.success).toBe(true);
      const logMessage = consoleSpy.mock.calls[0][0] as string;
      expect(logMessage).toContain('WARNING');
    });

    it('should handle critical notification type correctly', async () => {
      const notification = createNotification({ notificationType: 'critical' });

      const result = await service.sendNotification(notification);

      expect(result.success).toBe(true);
      const logMessage = consoleSpy.mock.calls[0][0] as string;
      expect(logMessage).toContain('CRITICAL');
    });

    it('should include duration and time limit in log', async () => {
      const notification = createNotification({
        durationMinutes: 1400,
        timeLimit: 1440,
      });

      await service.sendNotification(notification);

      const logMessage = consoleSpy.mock.calls[0][0] as string;
      expect(logMessage).toContain('1400');
      expect(logMessage).toContain('1440');
    });

    it('should return success result with descriptive message', async () => {
      const notification = createNotification({
        licensePlate: 'DEF-5678',
        notificationType: 'warning',
      });

      const result = await service.sendNotification(notification);

      expect(result.success).toBe(true);
      expect(result.message).toContain('warning');
      expect(result.message).toContain('DEF-5678');
    });

    it('should not throw errors even if internal processing fails', async () => {
      // Force console.log to throw to simulate an internal failure
      consoleSpy.mockImplementation(() => {
        throw new Error('Logging system unavailable');
      });

      const notification = createNotification();

      const result = await service.sendNotification(notification);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Falha ao enviar notificação');
    });

    it('should log error details when notification fails', async () => {
      consoleSpy.mockImplementation(() => {
        throw new Error('Logging system unavailable');
      });

      const notification = createNotification({ licensePlate: 'FAIL-001' });

      await service.sendNotification(notification);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const errorMessage = consoleErrorSpy.mock.calls[0][0] as string;
      expect(errorMessage).toContain('FAIL-001');
      expect(errorMessage).toContain('Logging system unavailable');
    });

    it('should handle unknown error types gracefully', async () => {
      consoleSpy.mockImplementation(() => {
        throw 'string error'; // non-Error throw
      });

      const notification = createNotification();

      const result = await service.sendNotification(notification);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Erro desconhecido');
    });
  });
});
