/**
 * Router for wash service prices endpoints
 * Defines routes for price management operations (CRUD + resolve)
 */

import { Router } from 'express';
import { WashServicePricesController } from './wash-service-prices.controller';
import { validate } from '../../middleware/validate.middleware';
import { upsertPriceSchema } from './wash-service-prices.validator';

const router = Router();
const controller = new WashServicePricesController();

/**
 * GET /api/wash-service-prices
 * List all configured prices with vehicle type and wash service names
 */
router.get(
  '/',
  (req, res, next) => controller.listAll(req, res, next)
);

/**
 * PUT /api/wash-service-prices
 * Create or update a price for a vehicle type × wash service combination (upsert)
 * Body: { vehicleTypeId: UUID, washServiceId: UUID, price: number }
 */
router.put(
  '/',
  validate(upsertPriceSchema),
  (req, res, next) => controller.upsert(req, res, next)
);

/**
 * DELETE /api/wash-service-prices/:id
 * Remove a specific price record by ID
 */
router.delete(
  '/:id',
  (req, res, next) => controller.delete(req, res, next)
);

/**
 * GET /api/wash-service-prices/resolve
 * Resolve the price for a vehicle type × wash service combination
 * Query params: vehicleTypeId (optional), washServiceId (required)
 */
router.get(
  '/resolve',
  (req, res, next) => controller.resolvePrice(req, res, next)
);

export { router as washServicePricesRouter };
