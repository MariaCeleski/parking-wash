/**
 * Controller layer for parking operations
 * Handles HTTP request/response serialization for parking endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { ParkingService } from './parking.service';
import { CheckInRequest, CheckOutRequest } from './parking.types';
import { validateVehicleTypeIdWithResult } from './parking.validator';
import { VehicleTypeService } from '../vehicle-types/vehicle-type.service';
import { getVehicleData } from './services/fipe.service';
import {
  ValidationError,
  NotFoundError,
  PaymentRequiredError,
} from '../../middleware/errors';

export class ParkingController {
  private service: ParkingService;
  private vehicleTypeService: VehicleTypeService;

  constructor() {
    this.service = new ParkingService();
    this.vehicleTypeService = new VehicleTypeService();
  }

  /**
   * Handle POST /api/parking/checkin
   * Registers a vehicle entry into the parking lot
   * Validates vehicleTypeId using ParkingValidator
   * @returns HTTP 201 with ExtendedParkingRecord including vehicleType
   * @returns HTTP 422 if validation fails (missing/invalid vehicleTypeId)
   * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
   */
  async postCheckIn(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Support both string (backward compatibility) and object formats
      const body = req.body;
      let licensePlate: string;
      let vehicleTypeId: string | undefined;

      if (typeof body === 'string') {
        licensePlate = body;
      } else if (typeof body === 'object' && body.licensePlate) {
        licensePlate = body.licensePlate;
        vehicleTypeId = body.vehicleTypeId;
      } else {
        res.status(422).json({ error: 'licensePlate é obrigatório' });
        return;
      }

      // Validate vehicleTypeId format if provided (Requirement 10.1)
      // vehicleTypeId is optional for backward compatibility with existing frontend
      if (vehicleTypeId) {
        const validation = validateVehicleTypeIdWithResult(vehicleTypeId);
        if (!validation.isValid) {
          res.status(422).json({ error: validation.error });
          return;
        }
      }

      const result = await this.service.checkIn({
        licensePlate,
        vehicleTypeId,
      });

      // Enrich response with vehicleType object (Requirement 2.1, 9.3)
      let vehicleType = null;
      if (vehicleTypeId) {
        try {
          vehicleType = await this.vehicleTypeService.getById(vehicleTypeId);
        } catch {
          // vehicleType may have been validated by service already
        }
      }

      res.status(201).json({
        ...result,
        vehicleType: vehicleType
          ? {
              id: vehicleType.id,
              name: vehicleType.name,
              code: vehicleType.code,
              hourlyRate: vehicleType.hourlyRate,
              dailyRate: vehicleType.dailyRate,
            }
          : null,
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(422).json({ error: (error as ValidationError).message });
        return;
      }
      next(error);
    }
  }

  /**
   * Handle POST /api/parking/:id/checkout
   * Registers a vehicle exit and calculates parking fee
   * Validates paymentMethodId is present (HTTP 422 if missing)
   * Returns HTTP 402 if payment gateway fails
   * Returns HTTP 404 if parking record not found
   * @returns HTTP 200 with updated ExtendedParkingRecord
   * Requirements: 3.1, 3.2, 3.3, 3.4, 7.1, 7.2, 7.3, 7.4
   */
  async postCheckOut(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { applyDailyRate, paymentMethodId } = req.body as CheckOutRequest;

      // Validate paymentMethodId is present (Requirement 7.4)
      if (!paymentMethodId) {
        res.status(422).json({ error: 'paymentMethodId é obrigatório' });
        return;
      }
      
      const result = await this.service.checkOut(id, {
        applyDailyRate,
        paymentMethodId,
      });
      res.status(200).json(result);
    } catch (error) {
      // Handle specific error types with appropriate HTTP status codes
      if (error instanceof ValidationError) {
        res.status(422).json({ error: (error as ValidationError).message });
        return;
      }
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: (error as NotFoundError).message });
        return;
      }
      if (error instanceof PaymentRequiredError) {
        res.status(402).json({ error: (error as PaymentRequiredError).message });
        return;
      }
      next(error);
    }
  }

  /**
   * Handle GET /api/parking/dashboard
   * Returns today's metrics: revenue, vehicles, avg duration, occupancy
   * @returns HTTP 200 with DashboardMetrics
   */
  async getDashboard(
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
   * Handle GET /api/parking/history
   * Lists last 10 exited parking records ordered by exit_time DESC
   * @returns HTTP 200 with array of ExtendedParkingRecord (max 10)
   * Requirements: 5.1, 5.2, 5.3, 5.4
   */
  async getHistory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const result = await this.service.getHistory(limit, offset);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle GET /api/parking
   * Lists parking records with optional status filter
   * @returns HTTP 200 with array of ParkingRecords
   */
  async getParking(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { status } = req.query;
      const result = await this.service.listRecords(status as string | undefined);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle GET /api/parking/fipe/:licensePlate
   * Retrieves vehicle information from FIPE API by license plate
   * @returns HTTP 200 with vehicle information (brand, model, year, fuel, value)
   */
  async getFipeData(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const licensePlate = Array.isArray(req.params.licensePlate) 
        ? req.params.licensePlate[0] 
        : req.params.licensePlate;
      
      if (!licensePlate) {
        res.status(422).json({ error: 'licensePlate é obrigatório' });
        return;
      }

      const vehicleInfo = await getVehicleData(licensePlate);
      res.status(200).json(vehicleInfo);
    } catch (error) {
      next(error);
    }
  }
}
