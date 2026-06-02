import { Router } from 'express';
import { WashOrdersController } from './wash-orders.controller';
import { validate } from '../../middleware/validate.middleware';
import { createWashOrderSchema, updateWashOrderStatusSchema } from './wash-orders.validator';

const router = Router();
const controller = new WashOrdersController();

/**
 * POST /api/wash-orders
 * Create a new wash order
 * Body: { licensePlate: string, washServiceId: string }
 * Response: HTTP 201 with WashOrderResponse
 */
router.post(
  '/',
  validate(createWashOrderSchema),
  (req, res, next) => controller.postWashOrder(req, res, next)
);

/**
 * PATCH /api/wash-orders/:id/status
 * Update wash order status
 * Params: id (UUID)
 * Body: { status: 'Waiting' | 'InProgress' | 'Completed' }
 * Response: HTTP 200 with updated WashOrderResponse
 */
router.patch(
  '/:id/status',
  validate(updateWashOrderStatusSchema),
  (req, res, next) => controller.patchWashOrderStatus(req as any, res, next)
);

/**
 * GET /api/wash-orders/dashboard
 * Get wash dashboard metrics for today
 */
router.get(
  '/dashboard',
  (req, res, next) => controller.getWashDashboard(req, res, next)
);

/**
 * GET /api/wash-orders/history
 * List completed wash orders history (all dates, for audit)
 * Query: limit? (default 50)
 * Response: HTTP 200 with array of WashOrderResponse (completed, ordered by date DESC)
 */
router.get(
  '/history',
  (req, res, next) => controller.getWashOrdersHistory(req, res, next)
);

/**
 * GET /api/wash-orders
 * List wash orders, optionally filtered by status and date
 * Query: status? (Waiting | InProgress | Completed), date? (YYYY-MM-DD), all? (true)
 * Response: HTTP 200 with array of WashOrderResponse
 */
router.get(
  '/',
  (req, res, next) => controller.getWashOrders(req, res, next)
);

export { router as washOrdersRouter };
