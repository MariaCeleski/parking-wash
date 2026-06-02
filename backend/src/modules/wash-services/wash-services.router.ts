import { Router } from 'express';
import { WashServicesController } from './wash-services.controller';

const router = Router();
const controller = new WashServicesController();

router.get('/', (req, res, next) => controller.getWashServices(req, res, next));

/**
 * PATCH /api/wash-services/:id
 * Update wash service price
 * Body: { price: number }
 */
router.patch('/:id', (req, res, next) => controller.patchWashServicePrice(req, res, next));

export { router as washServicesRouter };
