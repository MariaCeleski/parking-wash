/**
 * Router for notification endpoints
 * Defines routes for polling time warning notifications
 */

import { Router } from 'express';
import { NotificationController } from './notification.controller';

const router = Router();
const controller = new NotificationController();

/**
 * GET /api/notifications
 * Returns active time warning notifications for parked vehicles
 * approaching or exceeding the configured time limit
 */
router.get(
  '/',
  (req, res, next) => controller.getNotifications(req, res, next)
);

export { router as notificationRouter };
