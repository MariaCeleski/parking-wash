/**
 * Controller layer for notification operations
 * Handles HTTP request/response for time warning notifications
 */

import { Request, Response, NextFunction } from 'express';
import { NotificationService } from './notification.service';

export class NotificationController {
  private service: NotificationService;

  constructor() {
    this.service = new NotificationService();
  }

  /**
   * Handle GET /api/notifications
   * Checks all parked vehicles and returns active time warning notifications
   * @returns HTTP 200 with array of TimeWarningNotification objects
   */
  async getNotifications(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const notifications = await this.service.checkTimeWarnings();
      res.status(200).json(notifications);
    } catch (error) {
      next(error);
    }
  }
}
