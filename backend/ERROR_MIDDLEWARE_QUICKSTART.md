# Error Handling Middleware - Quick Start Guide

## What is it?

Global error handling middleware that provides standardized error responses across your entire API with proper status codes and consistent formatting.

## Quick Example

### Before (Inconsistent)
```typescript
// Route 1
res.status(400).json({ error: 'Bad request' });

// Route 2
res.status(400).json({ message: 'Invalid input', status: 'error' });

// Route 3
res.status(400).send('Bad request');
```
❌ Different error formats everywhere!

### After (Consistent)
```typescript
import { BadRequestError } from '../lib/errors';

// All routes return the same format
throw new BadRequestError('Invalid input');

// Response:
{
  "success": false,
  "code": "BAD_REQUEST",
  "message": "Invalid input",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-03-24T10:30:45.123Z"
}
```
✅ Consistent format everywhere!

## Installation

Already installed! The middleware is automatically active.

## Usage

### 1. Import Error Classes

```typescript
import {
  BadRequestError,      // 400
  UnauthorizedError,    // 401
  ForbiddenError,       // 403
  NotFoundError,        // 404
  ValidationError,      // 422
  InternalServerError   // 500
} from '../lib/errors';
```

### 2. Throw Errors in Your Routes

```typescript
import { Router } from 'express';
import { NotFoundError, BadRequestError } from '../lib/errors';

const router = Router();

router.get('/users/:id', async (req, res) => {
  const { id } = req.params;
  
  // Validate input
  if (!id) {
    throw new BadRequestError('User ID is required');
  }
  
  // Fetch user
  const user = await userService.findById(id);
  
  // Check if exists
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  res.json(user);
});
```

### 3. Use asyncHandler for Async Routes

```typescript
import { asyncHandler } from '../middleware/error';

router.get('/users', asyncHandler(async (req, res) => {
  const users = await userService.getAll();
  res.json(users);
}));
```

## Common Error Types

### Bad Request (400)
```typescript
throw new BadRequestError('Invalid email format');
```

### Unauthorized (401)
```typescript
throw new UnauthorizedError('Invalid credentials');
```

### Forbidden (403)
```typescript
throw new ForbiddenError('Admin access required');
```

### Not Found (404)
```typescript
throw new NotFoundError('User not found');
```

### Validation Error (422)
```typescript
throw new ValidationError('Validation failed', {
  email: ['Email is required'],
  password: ['Password must be at least 8 characters']
});
```

### Rate Limit (429)
```typescript
throw new RateLimitError('Too many requests', 60); // Retry after 60s
```

### Internal Server Error (500)
```typescript
throw new InternalServerError('Database connection failed');
```

## Response Format

All errors return this format:

```json
{
  "success": false,
  "code": "ERROR_CODE",
  "message": "Human-readable message",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-03-24T10:30:45.123Z"
}
```

### Validation Errors Include Fields

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

## Development vs Production

### Development
- Includes stack traces
- Shows detailed error messages
- Helpful for debugging

```json
{
  "success": false,
  "code": "INTERNAL_SERVER_ERROR",
  "message": "Database connection failed",
  "stack": "Error: Database connection failed\n    at ...",
  "requestId": "...",
  "timestamp": "..."
}
```

### Production
- Hides stack traces
- Sanitizes error messages
- Protects sensitive information

```json
{
  "success": false,
  "code": "INTERNAL_SERVER_ERROR",
  "message": "An unexpected error occurred",
  "requestId": "...",
  "timestamp": "..."
}
```

## Testing

### Run Tests

```bash
npm test -- error.test.ts
```

### Manual Testing

```bash
# Test 404
curl http://localhost:3000/non-existent

# Test with custom request ID
curl -H "X-Request-Id: test-123" http://localhost:3000/non-existent

# Response:
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Cannot GET /non-existent",
  "requestId": "test-123",
  "timestamp": "2024-03-24T10:30:45.123Z"
}
```

## Real-World Examples

### User Registration

```typescript
router.post('/register', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  // Validate input
  const errors: Record<string, string[]> = {};
  
  if (!email) {
    errors.email = ['Email is required'];
  } else if (!isValidEmail(email)) {
    errors.email = ['Email must be valid'];
  }
  
  if (!password) {
    errors.password = ['Password is required'];
  } else if (password.length < 8) {
    errors.password = ['Password must be at least 8 characters'];
  }
  
  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Validation failed', errors);
  }
  
  // Check if user exists
  const existingUser = await userService.findByEmail(email);
  if (existingUser) {
    throw new ConflictError('Email already registered');
  }
  
  // Create user
  const user = await userService.create({ email, password });
  res.status(201).json(user);
}));
```

### Authentication

```typescript
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    throw new BadRequestError('Email and password are required');
  }
  
  const user = await userService.findByEmail(email);
  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }
  
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new UnauthorizedError('Invalid credentials');
  }
  
  const token = jwt.sign({ userId: user.id }, JWT_SECRET);
  res.json({ token });
}));
```

### Protected Routes

```typescript
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    throw new UnauthorizedError('Authentication required');
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    throw new UnauthorizedError('Invalid token');
  }
};

router.get('/profile', authMiddleware, asyncHandler(async (req, res) => {
  const user = await userService.findById(req.user.userId);
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  res.json(user);
}));
```

### Admin Routes

```typescript
const adminMiddleware = (req, res, next) => {
  if (!req.user.isAdmin) {
    throw new ForbiddenError('Admin access required');
  }
  next();
};

router.delete('/users/:id', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  await userService.delete(req.params.id);
  res.json({ success: true });
}));
```

## Key Benefits

✅ **Consistent Format** - All errors use the same structure  
✅ **Proper Status Codes** - Automatic HTTP status code mapping  
✅ **Request Tracing** - Every error includes request ID  
✅ **Environment Aware** - Different behavior for dev/prod  
✅ **Easy Debugging** - Stack traces in development  
✅ **Type Safe** - TypeScript error classes  

## Best Practices

### ✅ DO

- Use specific error classes (NotFoundError, BadRequestError, etc.)
- Provide helpful error messages
- Use asyncHandler for async routes
- Include validation details in ValidationError
- Log errors with context

### ❌ DON'T

- Use generic Error class
- Return errors instead of throwing them
- Expose sensitive information in error messages
- Forget to use asyncHandler for async routes
- Ignore error handling in services

## Troubleshooting

**Q: Errors not being caught?**  
A: Make sure you're using `asyncHandler` for async routes

**Q: Stack traces showing in production?**  
A: Set `NODE_ENV=production` environment variable

**Q: Request ID missing?**  
A: Ensure request ID middleware is registered before error middleware

## Next Steps

- Read full documentation: `docs/ERROR_HANDLING_MIDDLEWARE.md`
- Run tests: `npm test -- error.test.ts`
- Check implementation: `src/middleware/error.ts`
- Review error classes: `src/lib/errors.ts`

## Support

For issues or questions, check the full documentation or create an issue on GitHub.
