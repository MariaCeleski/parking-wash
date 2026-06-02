/**
 * Service layer for parking time limit notifications
 * Monitors parked vehicles and generates warnings when approaching or exceeding time limits
 */

import { supabase } from '../../db/supabase';
import { config } from '../../config/env';
import { ServiceUnavailableError } from '../../middleware/errors';
import { VehicleTypeService } from '../vehicle-types/vehicle-type.service';
import { TimeWarningNotification, NotificationResult } from './notification.types';
import { VehicleType } from '../vehicle-types/vehicle-type.types';

export class NotificationService {
  private vehicleTypeService = new VehicleTypeService();

  /**
   * Check all currently parked vehicles and generate time warning notifications
   * for those approaching or exceeding the configured parking time limit.
   *
   * - Warning: durationMinutes >= (PARKING_TIME_LIMIT_HOURS * 60 - 60)
   * - Critical: durationMinutes >= (PARKING_TIME_LIMIT_HOURS * 60)
   *
   * @returns Array of TimeWarningNotification objects for vehicles at or above warning threshold
   * @throws ServiceUnavailableError if database query fails
   */
  async checkTimeWarnings(): Promise<TimeWarningNotification[]> {
    const timeLimitMinutes = config.parkingTimeLimitHours * 60;
    const warningThresholdMinutes = timeLimitMinutes - 60;

    try {
      // Query all currently parked vehicles
      const { data: parkedRecords, error } = await supabase
        .from('parking_records')
        .select('id, license_plate, entry_time, vehicle_type_id')
        .eq('status', 'Parked');

      if (error) {
        throw new ServiceUnavailableError(
          'Serviço temporariamente indisponível. Tente novamente em instantes'
        );
      }

      if (!parkedRecords || parkedRecords.length === 0) {
        return [];
      }

      const now = new Date();
      const notifications: TimeWarningNotification[] = [];

      for (const record of parkedRecords) {
        const entryTime = new Date(record.entry_time);
        const durationMs = now.getTime() - entryTime.getTime();
        const durationMinutes = Math.floor(durationMs / 60000);

        // Skip if below warning threshold
        if (durationMinutes < warningThresholdMinutes) {
          continue;
        }

        // Determine notification type
        const notificationType: 'warning' | 'critical' =
          durationMinutes >= timeLimitMinutes ? 'critical' : 'warning';

        // Get vehicle type information
        let vehicleType: VehicleType;
        try {
          if (record.vehicle_type_id) {
            vehicleType = await this.vehicleTypeService.getById(record.vehicle_type_id);
          } else {
            // Fallback for legacy records without vehicle type
            vehicleType = {
              id: '',
              name: 'Desconhecido',
              code: 'UNKNOWN',
              hourlyRate: config.hourlyRate,
              dailyRate: config.dailyRateCap,
              isActive: true,
              createdAt: '',
              updatedAt: '',
            };
          }
        } catch {
          // Fallback if vehicle type lookup fails
          vehicleType = {
            id: '',
            name: 'Desconhecido',
            code: 'UNKNOWN',
            hourlyRate: config.hourlyRate,
            dailyRate: config.dailyRateCap,
            isActive: true,
            createdAt: '',
            updatedAt: '',
          };
        }

        notifications.push({
          parkingId: record.id,
          licensePlate: record.license_plate,
          vehicleType,
          durationMinutes,
          timeLimit: timeLimitMinutes,
          notificationType,
          timestamp: now.toISOString(),
        });
      }

      return notifications;
    } catch (error) {
      if (error instanceof ServiceUnavailableError) {
        throw error;
      }
      throw new ServiceUnavailableError(
        'Serviço temporariamente indisponível. Tente novamente em instantes'
      );
    }
  }

  /**
   * Send/log a time warning notification
   * Logs the notification details for auditing purposes
   *
   * @param notification - The TimeWarningNotification to send
   * @returns NotificationResult indicating success or failure
   */
  async sendNotification(notification: TimeWarningNotification): Promise<NotificationResult> {
    try {
      // Log the notification for auditing (Requirement 8.6)
      console.log(
        `[NOTIFICATION] ${notification.notificationType.toUpperCase()} - ` +
        `Placa: ${notification.licensePlate}, ` +
        `Tipo: ${notification.vehicleType.name}, ` +
        `Duração: ${notification.durationMinutes} min, ` +
        `Limite: ${notification.timeLimit} min, ` +
        `Timestamp: ${notification.timestamp}`
      );

      return {
        success: true,
        message: `Notificação ${notification.notificationType} enviada para ${notification.licensePlate}`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Erro desconhecido';

      console.error(
        `[NOTIFICATION ERROR] Falha ao enviar notificação para ${notification.licensePlate}: ${errorMessage}`
      );

      return {
        success: false,
        message: `Falha ao enviar notificação: ${errorMessage}`,
      };
    }
  }
}
