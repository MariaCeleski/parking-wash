import { Request, Response, NextFunction } from 'express';
import { AppError } from './errors';

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isProd = process.env.NODE_ENV === 'production';

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode,
      ...(isProd ? {} : { stack: err.stack }),
    });
    return;
  }

  // Erro não tratado
  console.error('[Unhandled Error]', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    statusCode: 500,
    ...(isProd ? {} : { stack: err.stack }),
  });
}
