/**
 * Controller layer for vehicle type operations
 * Handles HTTP requests and responses for vehicle type endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { VehicleTypeService } from './vehicle-type.service';

export class VehicleTypeController {
  private service = new VehicleTypeService();

  /**
   * GET /api/vehicle-types
   * List vehicle types. Use ?includeInactive=true to include inactive types.
   */
  async listActive(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const vehicleTypes = includeInactive
        ? await this.service.listAll()
        : await this.service.listActive();
      res.status(200).json(vehicleTypes);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/vehicle-types
   * Create a new vehicle type
   * Body: { name, code }
   */
  async create(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { name, code } = req.body;
      const vehicleType = await this.service.create(name, code);
      res.status(201).json(vehicleType);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/vehicle-types/:id
   * Update vehicle type name (code is immutable)
   * Body: { name }
   */
  async update(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { name } = req.body;
      const vehicleType = await this.service.update(id, name);
      res.status(200).json(vehicleType);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/vehicle-types/:id/toggle-active
   * Toggle the is_active status of a vehicle type
   */
  async toggleActive(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const vehicleType = await this.service.toggleActive(id);
      res.status(200).json(vehicleType);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/vehicle-types/:id
   * Update vehicle type rates
   */
  async updateRates(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { hourlyRate, dailyRate } = req.body;

      // Validate request body
      if (hourlyRate === undefined || dailyRate === undefined) {
        res.status(422).json({
          error: 'hourlyRate e dailyRate são obrigatórios',
        });
        return;
      }

      if (typeof hourlyRate !== 'number' || typeof dailyRate !== 'number') {
        res.status(422).json({
          error: 'hourlyRate e dailyRate devem ser números',
        });
        return;
      }

      const updatedVehicleType = await this.service.updateRates(id, hourlyRate, dailyRate);
      res.status(200).json(updatedVehicleType);
    } catch (error) {
      next(error);
    }
  }
}
