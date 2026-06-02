/**
 * Router for parking endpoints
 * Defines routes for check-in, check-out, history, and listing parking records
 * Requirements: 2.1, 3.1, 5.1
 */

import { Router } from 'express';
import { ParkingController } from './parking.controller';
import { validate } from '../../middleware/validate.middleware';
import { checkInSchema } from './parking.validator';

const router = Router();
const controller = new ParkingController();

/**
 * POST /api/parking/checkin
 * Register a vehicle entry with vehicleTypeId
 * Validates licensePlate and vehicleTypeId using checkInSchema
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
router.post(
  '/checkin',
  validate(checkInSchema),
  (req, res, next) => controller.postCheckIn(req, res, next)
);

/**
 * POST /api/parking/:id/checkout
 * Register a vehicle exit, calculate parking fee, and process payment
 * Accepts applyDailyRate and paymentMethodId in request body
 * Requirements: 3.1, 3.2, 3.3, 3.4, 7.1, 7.2, 7.3, 7.4
 */
router.post(
  '/:id/checkout',
  (req, res, next) => controller.postCheckOut(req, res, next)
);

/**
 * GET /api/parking/dashboard
 * Get dashboard metrics (today's stats)
 * MUST come before /:id routes to avoid being captured by dynamic parameter
 */
router.get(
  '/dashboard',
  (req, res, next) => controller.getDashboard(req, res, next)
);

/**
 * GET /api/parking/history
 * List last 10 exited parking records ordered by exit_time DESC
 * Returns array of ExtendedParkingRecord (max 10)
 * MUST come before /:id routes to avoid being captured by dynamic parameter
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */
router.get(
  '/history',
  (req, res, next) => controller.getHistory(req, res, next)
);

/**
 * GET /api/parking/fipe/:licensePlate
 * Retrieve vehicle information from FIPE API by license plate
 * MUST come before /:id routes to avoid being captured by dynamic parameter
 */
router.get(
  '/fipe/:licensePlate',
  (req, res, next) => controller.getFipeData(req, res, next)
);

/**
 * GET /api/parking
 * List parking records with optional status filter
 */
router.get(
  '/',
  (req, res, next) => controller.getParking(req, res, next)
);

export { router as parkingRouter };
