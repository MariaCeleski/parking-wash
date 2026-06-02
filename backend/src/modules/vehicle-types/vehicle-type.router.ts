/**
 * Router for vehicle type endpoints
 * Defines all routes for vehicle type operations
 */

import { Router } from 'express';
import { VehicleTypeController } from './vehicle-type.controller';
import { validate } from '../../middleware/validate.middleware';
import { createVehicleTypeSchema, updateVehicleTypeSchema, updateRatesSchema } from './vehicle-type.validator';

const router = Router();
const controller = new VehicleTypeController();

/**
 * GET /api/vehicle-types
 * List all active vehicle types
 */
router.get('/', (req, res, next) => controller.listActive(req, res, next));

/**
 * POST /api/vehicle-types
 * Create a new vehicle type
 */
router.post('/', validate(createVehicleTypeSchema), (req, res, next) => controller.create(req, res, next));

/**
 * PUT /api/vehicle-types/:id
 * Update vehicle type name (code is immutable)
 */
router.put('/:id', validate(updateVehicleTypeSchema), (req, res, next) => controller.update(req, res, next));

/**
 * PATCH /api/vehicle-types/:id/toggle-active
 * Toggle the is_active status of a vehicle type
 */
router.patch('/:id/toggle-active', (req, res, next) => controller.toggleActive(req, res, next));

/**
 * PATCH /api/vehicle-types/:id
 * Update vehicle type rates (hourly_rate, daily_rate)
 */
router.patch('/:id', validate(updateRatesSchema), (req, res, next) => controller.updateRates(req, res, next));

export default router;
