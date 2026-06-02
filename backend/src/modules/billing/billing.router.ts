/**
 * Router for billing endpoints
 * Defines routes for billing report operations
 */

import { Router } from 'express';
import { BillingController } from './billing.controller';

const router = Router();
const controller = new BillingController();

/**
 * GET /api/billing/daily-report
 * Get daily billing report with revenue totals and breakdown by vehicle type
 * Optional query parameter: date (YYYY-MM-DD)
 */
router.get(
  '/daily-report',
  (req, res, next) => controller.getDailyReport(req, res, next)
);

export { router as billingRouter };
