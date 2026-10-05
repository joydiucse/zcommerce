export class AppError extends Error {
  constructor(message, { status = 500, code = 'INTERNAL_ERROR', details } = {}) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    if (details) this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details) {
    super(message, { status: 422, code: 'VALIDATION_ERROR', details });
  }

  /** Convenience: single-field validation error. */
  static field(path, message) {
    return new ValidationError(message, [{ path, message }]);
  }
}

export class UnauthenticatedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, { status: 401, code: 'UNAUTHENTICATED' });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, { status: 403, code: 'FORBIDDEN' });
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, { status: 404, code: 'NOT_FOUND' });
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists', details) {
    super(message, { status: 409, code: 'CONFLICT', details });
  }
}

export class RateLimitedError extends AppError {
  constructor(message = 'Too many requests, please try again later') {
    super(message, { status: 429, code: 'RATE_LIMITED' });
  }
}

export class TenantNotFoundError extends AppError {
  constructor(message = 'Store not found') {
    super(message, { status: 404, code: 'TENANT_NOT_FOUND' });
  }
}

export class TenantSuspendedError extends AppError {
  constructor(message = 'This store is currently suspended') {
    super(message, { status: 403, code: 'TENANT_SUSPENDED' });
  }
}
