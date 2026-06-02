/**
 * Controller layer for billing operations
 * Handles HTTP request/response serialization for billing endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { BillingService } from './billing.service';

export class BillingController {
  private service: BillingService;

  constructor() {
    this.service = new BillingService();
  }

  /**
   * Handle GET /api/billing/daily-report
   * Returns the daily billing report with revenue totals and vehicle type breakdown
   * Accepts optional query parameter `date` in YYYY-MM-DD format
   * @returns HTTP 200 with DailyBillingReport object
   */
  async getDailyReport(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const date = req.query.date as string | undefined;
      const report = await this.service.getDailyReport(date);
      res.status(200).json(report);
    } catch (error) {
      next(error);
    }
  }
}
