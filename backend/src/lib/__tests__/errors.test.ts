import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
  InternalServerError,
  ServiceUnavailableError,
  DatabaseError,
  ExternalServiceError,
  isAppError,
  isOperationalError,
} from '../errors';

describe('lib/errors', () => {
  it('BadRequestError has status 400 and default code', () => {
    const err = new BadRequestError();
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('BAD_REQUEST');
    expect(err.isOperational).toBe(true);
  });

  it('UnauthorizedError has status 401', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
  });

  it('ForbiddenError has status 403', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });

  it('NotFoundError has status 404', () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
  });

  it('ConflictError has status 409', () => {
    const err = new ConflictError();
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('CONFLICT');
  });

  it('ValidationError has status 422 and carries field errors', () => {
    const err = new ValidationError('Invalid', { email: ['is required'] });
    expect(err.statusCode).toBe(422);
    expect(err.errors).toEqual({ email: ['is required'] });
  });

  it('RateLimitError has status 429 and carries retryAfter', () => {
    const err = new RateLimitError('Slow down', 30);
    expect(err.statusCode).toBe(429);
    expect(err.retryAfter).toBe(30);
  });

  it('InternalServerError has status 500 and is non-operational', () => {
    const err = new InternalServerError();
    expect(err.statusCode).toBe(500);
    expect(err.isOperational).toBe(false);
  });

  it('ServiceUnavailableError has status 503', () => {
    const err = new ServiceUnavailableError('down', 60);
    expect(err.statusCode).toBe(503);
    expect(err.retryAfter).toBe(60);
  });

  it('DatabaseError has status 500 and is non-operational', () => {
    const err = new DatabaseError();
    expect(err.statusCode).toBe(500);
    expect(err.isOperational).toBe(false);
  });

  it('ExternalServiceError has status 502 and carries service name', () => {
    const err = new ExternalServiceError('failed', 'stripe');
    expect(err.statusCode).toBe(502);
    expect(err.service).toBe('stripe');
  });

  it('isAppError distinguishes AppError instances from plain errors', () => {
    expect(isAppError(new NotFoundError())).toBe(true);
    expect(isAppError(new Error('plain'))).toBe(false);
  });

  it('isOperationalError reflects the isOperational flag', () => {
    expect(isOperationalError(new BadRequestError())).toBe(true);
    expect(isOperationalError(new InternalServerError())).toBe(false);
    expect(isOperationalError(new Error('plain'))).toBe(false);
  });

  it('each error instance passes instanceof checks against its own class', () => {
    expect(new BadRequestError()).toBeInstanceOf(BadRequestError);
    expect(new ValidationError()).toBeInstanceOf(ValidationError);
    expect(new ExternalServiceError()).toBeInstanceOf(ExternalServiceError);
  });
});
