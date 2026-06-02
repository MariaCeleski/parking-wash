import { Request, Response, NextFunction } from 'express';
import { WashOrderService } from './wash-orders.service';
import { CreateWashOrderRequest, UpdateWashOrderStatusRequest } from './wash-orders.validator';

export class WashOrdersController {
  private service: WashOrderService;

  constructor() {
    this.service = new WashOrderService();
  }

  /**
   * POST /api/wash-orders
   * Creates a new wash order
   * @returns HTTP 201 with WashOrderResponse
   */
  async postWashOrder(
    req: Request<{}, {}, CreateWashOrderRequest>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { licensePlate, washServiceId, vehicleTypeId } = req.body;
      const order = await this.service.createOrder(licensePlate, washServiceId, vehicleTypeId);
      res.status(201).json(order);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/wash-orders/:id/status
   * Updates the status of a wash order
   * @returns HTTP 200 with updated WashOrderResponse
   */
  async patchWashOrderStatus(
    req: Request<{ id: string }, {}, UpdateWashOrderStatusRequest>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { status, paymentMethod } = req.body;
      const order = await this.service.advanceStatus(id, status, paymentMethod);
      res.status(200).json(order);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/wash-orders
   * Lists wash orders, optionally filtered by status and date
   * @query status - Optional filter (Waiting, InProgress, or Completed)
   * @query date - Optional date filter (YYYY-MM-DD)
   * @query all - If "true", returns all records regardless of date
   * @returns HTTP 200 with array of WashOrderResponse
   */
  async getWashOrders(
    req: Request<{}, {}, {}, { status?: string; date?: string; all?: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { status, date, all } = req.query;
      const showAll = all === 'true';
      const orders = await this.service.listOrders(status, date, showAll);
      res.status(200).json(orders);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/wash-orders/dashboard
   * Get wash orders dashboard metrics for today
   */
  async getWashDashboard(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const metrics = await this.service.getDashboardMetrics();
      res.status(200).json(metrics);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/wash-orders/history
   * Lists completed wash orders history (all dates, last 50)
   * Used for audit/consultation of past services
   * @query limit - Optional limit (default 50)
   * @returns HTTP 200 with array of WashOrderResponse
   */
  async getWashOrdersHistory(
    req: Request<{}, {}, {}, { limit?: string; offset?: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0;
      const orders = await this.service.listHistory(limit, offset);
      res.status(200).json(orders);
    } catch (error) {
      next(error);
    }
  }
}
