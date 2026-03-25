# Global Error Handling Middleware

## Overview

The global error handling middleware provides standardized error responses across the entire application, ensuring consistent error formats, proper status codes, and appropriate error logging.

## Features

### ✅ Standardized Error Format

All errors return a consistent JSON structure:
```json
{
  "success": false,
  "code": "ERROR_CODE",
  "message": "Human-readable error message",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-03-24T10:30:45.123Z"
}
```

### ✅ Proper Status Code Mapping

- 400 - Bad Request
- 401 - Unauthorized
- 403 - Forbidden
- 404 - Not Found
- 409 - Conflict
- 422 - Validation Error
- 429 - Rate Limit Exceeded
- 500 - Internal Server Error
- 502 - External Service Error
- 503 - Service Unavailable

### ✅ Environment-Aware

- **Development**: Includes stack traces and detailed error messages
- **Production**: Hides sensitive information and stack traces

### ✅ Request Tracing

All errors include request ID for easy log correlation

### ✅ Comprehensive Logging

Errors are automatically logged with context for debugging

## Custom Error Classes

### AppError (Base Class)

Base class for all application errors:

```typescript
import { AppError } from '../lib/errors';

throw new AppError('Something went wrong', 500, 'CUSTOM_ERROR');
```

### BadRequestError (400)

Client sent invalid data:

```typescript
import { BadRequestError } from '../lib/errors';

throw new BadRequestError('Invalid email format');
```

### UnauthorizedError (401)

Authentication required or failed:

```typescript
import { UnauthorizedError } from '../lib/errors';

throw new UnauthorizedError('Invalid credentials');
```

### ForbiddenError (403)

User doesn't have permission:

```typescript
import { ForbiddenError } from '../lib/errors';

throw new ForbiddenError('Admin access required');
```

### NotFoundError (404)

Resource doesn't exist:

```typescript
import { NotFoundError } from '../lib/errors';

throw new NotFoundError('User not found');
```

### ConflictError (409)

Resource conflict (e.g., duplicate):

```typescript
import { ConflictError } from '../lib/errors';

throw new ConflictError('Email already registered');
```

### ValidationError (422)

Validation failed with field-specific errors:

```typescript
import { ValidationError } from '../lib/errors';

throw new ValidationError('Validation failed', {
  email: ['Email is required', 'Email must be valid'],
  password: ['Password must be at least 8 characters']
});
```

**Response:**
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "errors": {
    "email": ["Email is required", "Email must be valid"],
    "password": ["Password must be at least 8 characters"]
  },
  "requestId": "...",
  "timestamp": "..."
}
```

### RateLimitError (429)

Rate limit exceeded:

```typescript
import { RateLimitError } from '../lib/errors';

throw new RateLimitError('Too many requests', 60); // Retry after 60 seconds
```

**Response includes Retry-After header:**
```
HTTP/1.1 429 Too Many Requests
Retry-After: 60
```

### InternalServerError (500)

Unexpected server error:

```typescript
import { InternalServerError } from '../lib/errors';

throw new InternalServerError('Database connection failed');
```

### ServiceUnavailableError (503)

Service temporarily unavailable:

```typescript
import { ServiceUnavailableError } from '../lib/errors';

throw new ServiceUnavailableError('Under maintenance', 3600);
```

### DatabaseError (500)

Database operation failed:

```typescript
import { DatabaseError } from '../lib/errors';

throw new DatabaseError('Query execution failed');
```

### ExternalServiceError (502)

External API call failed:

```typescript
import { ExternalServiceError } from '../lib/errors';

throw new ExternalServiceError('Payment gateway timeout', 'stripe');
```

## Usage Examples

### Basic Error Handling

```typescript
import { Router } from 'express';
import { NotFoundError, BadRequestError } from '../lib/errors';

const router = Router();

router.get('/users/:id', async (req, res) => {
  const { id } = req.params;
  
  if (!id) {
    throw new BadRequestError('User ID is required');
  }
  
  const user = await userService.findById(id);
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  res.json(user);
});
```

### Async Route Handlers

Use `asyncHandler` to automatically catch promise rejections:

```typescript
import { asyncHandler } from '../middleware/error';
import { NotFoundError } from '../lib/errors';

router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await userService.findById(req.params.id);
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  res.json(user);
}));
```

### Validation Errors

```typescript
import { ValidationError } from '../lib/errors';

router.post('/users', asyncHandler(async (req, res) => {
  const errors: Record<string, string[]> = {};
  
  if (!req.body.email) {
    errors.email = ['Email is required'];
  } else if (!isValidEmail(req.body.email)) {
    errors.email = ['Email must be valid'];
  }
  
  if (!req.body.password) {
    errors.password = ['Password is required'];
  } else if (req.body.password.length < 8) {
    errors.password = ['Password must be at least 8 characters'];
  }
  
  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Validation failed', errors);
  }
  
  const user = await userService.create(req.body);
  res.status(201).json(user);
}));
```

### Service Layer Errors

```typescript
import { DatabaseError, NotFoundError } from '../lib/errors';

export class UserService {
  async findById(id: string) {
    try {
      const user = await db.user.findUnique({ where: { id } });
      
      if (!user) {
        throw new NotFoundError('User not found');
      }
      
      return user;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to fetch user');
    }
  }
}
```

### External API Calls

```typescript
import { ExternalServiceError } from '../lib/errors';

export class PaymentService {
  async processPayment(amount: number) {
    try {
      const response = await fetch('https://api.stripe.com/charges', {
        method: 'POST',
        body: JSON.stringify({ amount })
      });
      
      if (!response.ok) {
        throw new ExternalServiceError('Payment processing failed', 'stripe');
      }
      
      return response.json();
    } catch (error) {
      throw new ExternalServiceError('Payment gateway unavailable', 'stripe');
    }
  }
}
```

### Rate Limiting

```typescript
import { RateLimitError } from '../lib/errors';

const rateLimiter = new Map<string, number>();

router.post('/api/send-email', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const count = rateLimiter.get(userId) || 0;
  
  if (count >= 10) {
    throw new RateLimitError('Too many emails sent', 60);
  }
  
  rateLimiter.set(userId, count + 1);
  
  await emailService.send(req.body);
  res.json({ success: true });
}));
```

## Error Response Examples

### Development Environment

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "User not found",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-03-24T10:30:45.123Z",
  "stack": "NotFoundError: User not found\n    at UserService.findById (/app/services/user.ts:25:13)\n    ..."
}
```

### Production Environment

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "User not found",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-03-24T10:30:45.123Z"
}
```

### Validation Error

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "errors": {
    "email": ["Email is required", "Email must be valid"],
    "password": ["Password must be at least 8 characters"]
  },
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-03-24T10:30:45.123Z"
}
```

### Rate Limit Error

```json
{
  "success": false,
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests",
  "retryAfter": 60,
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-03-24T10:30:45.123Z"
}
```

## Middleware Order

The error middleware must be registered LAST in the middleware chain:

```typescript
// app.ts
import { errorHandler, notFoundHandler } from './middleware/error';

// ... other middleware ...

// Routes
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

// 404 handler (after all routes)
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);
```

## Testing

### Unit Tests

```typescript
import request from 'supertest';
import app from '../app';

describe('Error Handling', () => {
  it('should return 404 for non-existent routes', async () => {
    const response = await request(app).get('/non-existent');
    
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('NOT_FOUND');
  });
  
  it('should return 400 for bad request', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ invalid: 'data' });
    
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('BAD_REQUEST');
  });
});
```

### Manual Testing

```bash
# Test 404
curl http://localhost:3000/non-existent

# Test validation error
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"invalid":"data"}'

# Test with request ID
curl -H "X-Request-Id: test-123" http://localhost:3000/non-existent
```

## Best Practices

### 1. Use Specific Error Classes

❌ **Bad:**
```typescript
throw new Error('User not found');
```

✅ **Good:**
```typescript
throw new NotFoundError('User not found');
```

### 2. Provide Helpful Error Messages

❌ **Bad:**
```typescript
throw new BadRequestError('Invalid');
```

✅ **Good:**
```typescript
throw new BadRequestError('Email format is invalid');
```

### 3. Use asyncHandler for Async Routes

❌ **Bad:**
```typescript
router.get('/users', async (req, res) => {
  const users = await userService.getAll(); // Unhandled rejection!
  res.json(users);
});
```

✅ **Good:**
```typescript
router.get('/users', asyncHandler(async (req, res) => {
  const users = await userService.getAll();
  res.json(users);
}));
```

### 4. Include Request ID in Client Errors

```typescript
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    error: err.message,
    requestId: req.requestId // Help users report issues
  });
});
```

### 5. Log Errors with Context

```typescript
logger.error('Failed to process payment', {
  userId: req.user.id,
  amount: req.body.amount,
  error: err.message
});
```

## Troubleshooting

### Errors Not Being Caught

**Problem:** Errors are not being caught by the middleware

**Solution:**
- Ensure error middleware is registered last
- Use `asyncHandler` for async routes
- Check that you're throwing errors, not returning them

### Stack Traces in Production

**Problem:** Stack traces are visible in production

**Solution:**
- Set `NODE_ENV=production`
- Verify environment variable is being read correctly

### Missing Request ID

**Problem:** Request ID not included in error response

**Solution:**
- Ensure request ID middleware is registered before error middleware
- Check that request ID middleware is working

## Production Considerations

### Environment Variables

```bash
NODE_ENV=production  # Hide stack traces and sensitive info
LOG_LEVEL=error      # Only log errors in production
```

### Error Monitoring

Integrate with error monitoring services:

```typescript
import * as Sentry from '@sentry/node';

app.use((err, req, res, next) => {
  // Send to Sentry
  Sentry.captureException(err);
  
  // Continue with error handling
  errorHandler(err, req, res, next);
});
```

### Rate Limiting

Implement rate limiting to prevent abuse:

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  handler: (req, res) => {
    throw new RateLimitError('Too many requests', 900);
  }
});

app.use('/api/', limiter);
```

## References

- [Express Error Handling](https://expressjs.com/en/guide/error-handling.html)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [Error Handling Best Practices](https://nodejs.org/en/docs/guides/error-handling/)
