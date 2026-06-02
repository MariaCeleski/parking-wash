import { Request, Response, NextFunction } from 'express';
import { WashServicesService } from './wash-services.service';

export class WashServicesController {
  private service: WashServicesService;

  constructor() {
    this.service = new WashServicesService();
  }

  async getWashServices(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const services = await this.service.listActiveServices();
      res.status(200).json(services);
    } catch (error) {
      next(error);
    }
  }

  async patchWashServicePrice(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id as string;
      const { price } = req.body;

      if (price === undefined || typeof price !== 'number') {
        res.status(422).json({ error: 'price é obrigatório e deve ser um número' });
        return;
      }

      const updated = await this.service.updatePrice(id, price);
      res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  }
}
