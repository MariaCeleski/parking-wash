import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ValidationError } from './errors';

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const firstMessage = result.error.errors[0]?.message ?? 'Dados inválidos';
      return next(new ValidationError(firstMessage));
    }

    next();
  };
}
