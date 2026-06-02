/**
 * Controller for parking settings
 */

import { Request, Response, NextFunction } from 'express';
import { SettingsService } from './settings.service';

export class SettingsController {
  private service = new SettingsService();

  async getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await this.service.getSettings();
      res.status(200).json(settings);
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { totalSpots, washSpots } = req.body;

      if (totalSpots === undefined && washSpots === undefined) {
        res.status(422).json({ error: 'Nenhuma configuração fornecida' });
        return;
      }

      const updates: Record<string, number> = {};
      if (totalSpots !== undefined) {
        if (typeof totalSpots !== 'number' || totalSpots < 1) {
          res.status(422).json({ error: 'totalSpots deve ser um número >= 1' });
          return;
        }
        updates.totalSpots = totalSpots;
      }
      if (washSpots !== undefined) {
        if (typeof washSpots !== 'number' || washSpots < 1) {
          res.status(422).json({ error: 'washSpots deve ser um número >= 1' });
          return;
        }
        updates.washSpots = washSpots;
      }

      const settings = await this.service.updateSettings(updates);
      res.status(200).json(settings);
    } catch (error) {
      next(error);
    }
  }
}
