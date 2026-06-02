/**
 * Controller layer for wash service prices operations
 * Handles HTTP request/response for price management endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { WashServicePricesService } from './wash-service-prices.service';

export class WashServicePricesController {
  private service: WashServicePricesService;

  constructor() {
    this.service = new WashServicePricesService();
  }

  /**
   * Handle GET /api/wash-service-prices
   * Returns all configured prices with vehicle type and wash service names
   * @returns HTTP 200 with WashServicePriceResponse[]
   */
  async listAll(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const prices = await this.service.listAll();
      res.status(200).json(prices);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle PUT /api/wash-service-prices
   * Creates or updates a price for a vehicle type × wash service combination
   * Body: { vehicleTypeId, washServiceId, price }
   * @returns HTTP 200 with WashServicePriceResponse
   */
  async upsert(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { vehicleTypeId, washServiceId, price } = req.body;
      const result = await this.service.upsert(vehicleTypeId, washServiceId, price);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle DELETE /api/wash-service-prices/:id
   * Removes a specific price record
   * @returns HTTP 200 with success message
   */
  async delete(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await this.service.delete(id);
      res.status(200).json({ message: 'Preço removido com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle GET /api/wash-service-prices/resolve
   * Resolves the price for a vehicle type × wash service combination
   * Query params: vehicleTypeId (optional), washServiceId (required)
   * @returns HTTP 200 with { price, isDefault }
   */
  async resolvePrice(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const vehicleTypeId = (req.query.vehicleTypeId as string) || null;
      const washServiceId = req.query.washServiceId as string;
      const result = await this.service.resolvePrice(vehicleTypeId, washServiceId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
