export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = 'AppError';
    // Restore prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 422);
    this.name = 'ValidationError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class PaymentRequiredError extends AppError {
  constructor(message: string) {
    super(message, 402);
    this.name = 'PaymentRequiredError';
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string) {
    super(message, 503);
    this.name = 'ServiceUnavailableError';
  }
}
