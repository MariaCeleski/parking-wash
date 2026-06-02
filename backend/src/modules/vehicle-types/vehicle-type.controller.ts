/**
 * Controller layer for vehicle type operations
 * Handles HTTP requests and responses for vehicle type endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { VehicleTypeService } from './vehicle-type.service';
import { NotFoundError, ValidationError } from '../../middleware/errors';

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
   * Update vehicle type rates (hourly_rate, daily_rate)
   * 
   * Validates:
   * - hourly_rate and daily_rate are required and >= 0.01
   * 
   * Returns:
   * - HTTP 200 with updated VehicleType
   * - HTTP 422 if validation fails
   * - HTTP 404 if vehicle type not found
   * 
   * Requirements: 1.5, 1.6, 1.7
   */
  async updateRates(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { hourly_rate, daily_rate } = req.body;

      // Validate request body format
      if (hourly_rate === undefined || daily_rate === undefined) {
        res.status(422).json({
          error: 'hourly_rate e daily_rate são obrigatórios',
        });
        return;
      }

      if (typeof hourly_rate !== 'number' || typeof daily_rate !== 'number') {
        res.status(422).json({
          error: 'hourly_rate e daily_rate devem ser números',
        });
        return;
      }

      // Validate minimum values
      if (hourly_rate < 0.01 || daily_rate < 0.01) {
        res.status(422).json({
          error: 'As tarifas devem ser maiores que 0.01',
        });
        return;
      }

      const updatedVehicleType = await this.service.updateRates(id, hourly_rate, daily_rate);
      res.status(200).json(updatedVehicleType);
    } catch (error) {
      // Handle specific error types
      if (error instanceof NotFoundError) {
        res.status(404).json({
          error: 'Tipo de veículo não encontrado',
        });
        return;
      }
      if (error instanceof ValidationError) {
        res.status(422).json({
          error: (error as ValidationError).message,
        });
        return;
      }
      next(error);
    }
  }
}
