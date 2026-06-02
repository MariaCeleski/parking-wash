/**
 * Type definitions for the notifications module
 * Defines interfaces for time warning notifications
 */

import { VehicleType } from '../vehicle-types/vehicle-type.types';

/**
 * Notification type indicating severity level
 * - 'warning': Vehicle is approaching the time limit (within 1 hour)
 * - 'critical': Vehicle has exceeded the time limit
 */
export type NotificationType = 'warning' | 'critical';

/**
 * Time warning notification generated when a parked vehicle
 * approaches or exceeds the configured parking time limit
 */
export interface TimeWarningNotification {
  /** Parking record UUID */
  parkingId: string;

  /** Vehicle license plate */
  licensePlate: string;

  /** Vehicle type information */
  vehicleType: VehicleType;

  /** Duration in minutes since vehicle entry */
  durationMinutes: number;

  /** Configured time limit in minutes */
  timeLimit: number;

  /** Notification severity: 'warning' or 'critical' */
  notificationType: NotificationType;

  /** ISO 8601 UTC timestamp when notification was generated */
  timestamp: string;
}

/**
 * Result of sending a notification
 */
export interface NotificationResult {
  /** Whether the notification was sent successfully */
  success: boolean;

  /** Descriptive message about the result */
  message: string;
}

/**
 * Interface for the NotificationService
 */
export interface INotificationService {
  checkTimeWarnings(): Promise<TimeWarningNotification[]>;
  sendNotification(notification: TimeWarningNotification): Promise<NotificationResult>;
}
