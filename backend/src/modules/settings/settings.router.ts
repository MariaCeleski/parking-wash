/**
 * Router for parking settings
 */

import { Router } from 'express';
import { SettingsController } from './settings.controller';

const router = Router();
const controller = new SettingsController();

/**
 * GET /api/settings
 * Get parking settings (totalSpots, etc.)
 */
router.get('/', (req, res, next) => controller.getSettings(req, res, next));

/**
 * PATCH /api/settings
 * Update parking settings
 * Body: { totalSpots?: number }
 */
router.patch('/', (req, res, next) => controller.updateSettings(req, res, next));

export { router as settingsRouter };
