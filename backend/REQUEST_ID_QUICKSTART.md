# Request ID Middleware - Quick Start Guide

## What is it?

Request ID middleware automatically assigns a unique identifier to every HTTP request, making it easy to trace requests through logs and across distributed systems.

## Quick Example

### Before (Hard to trace)
```
2024-03-24T10:30:45.123Z [api] INFO: User fetched
2024-03-24T10:30:45.234Z [database] INFO: Query executed
2024-03-24T10:30:45.345Z [api] INFO: User fetched
2024-03-24T10:30:45.456Z [database] INFO: Query executed
```
❌ Which logs belong to which request?

### After (Easy to trace)
```
2024-03-24T10:30:45.123Z [api] [req-123] INFO: User fetched
2024-03-24T10:30:45.234Z [database] [req-123] INFO: Query executed
2024-03-24T10:30:45.345Z [api] [req-456] INFO: User fetched
2024-03-24T10:30:45.456Z [database] [req-456] INFO: Query executed
```
✅ Clear request boundaries!

## Installation

Already installed! The middleware is automatically active when you start the server.

## Usage

### 1. Making Requests

```bash
# Request automatically gets an ID
curl http://localhost:3000/api/users

# Response includes the ID
HTTP/1.1 200 OK
X-Request-Id: 550e8400-e29b-41d4-a716-446655440000
```

### 2. Logging (Automatic)

```typescript
import { createLogger } from '../lib/logger';

const logger = createLogger('UserController');

export const getUser = async (req, res) => {
  logger.info('Fetching user');  // Request ID automatically included!
  
  const user = await db.user.findById(req.params.id);
  
  logger.info('User found');  // Same request ID
  
  res.json(user);
};
```

**Output:**
```
[UserController] [550e8400-e29b-41d4-a716-446655440000] INFO: Fetching user
[UserController] [550e8400-e29b-41d4-a716-446655440000] INFO: User found
```

### 3. Custom Request IDs (Optional)

```bash
# Provide your own ID for distributed tracing
curl -H "X-Request-Id: my-trace-id" http://localhost:3000/api/users
```

### 4. Accessing Request ID in Code

```typescript
import { getRequestId } from '../middleware/requestId';

const requestId = getRequestId();
console.log(`Current request: ${requestId}`);
```

## Testing

### Run Tests

```bash
npm test -- requestId.test.ts
```

### Manual Testing

```bash
# Test 1: Check header is present
curl -i http://localhost:3000/health | grep -i x-request-id

# Test 2: Use custom ID
curl -i -H "X-Request-Id: test-123" http://localhost:3000/health

# Test 3: Trace logs
REQUEST_ID=$(curl -s -i http://localhost:3000/api/users | grep -i x-request-id | cut -d' ' -f2)
grep "$REQUEST_ID" logs/combined.log
```

## Common Use Cases

### 1. Debugging Production Issues

```bash
# User reports error, provides request ID from error message
# Search logs for that specific request
grep "550e8400-e29b-41d4-a716-446655440000" logs/combined.log
```

### 2. Performance Monitoring

```typescript
logger.info('Request started');
// ... do work ...
logger.info('Request completed', { duration: Date.now() - start });

// All logs have same request ID - easy to calculate request duration
```

### 3. Distributed Tracing

```typescript
// Frontend
fetch('/api/users', {
  headers: { 'X-Request-Id': 'frontend-123' }
});

// Backend receives and uses same ID
// Backend calls another service with same ID
fetch('https://other-service.com/data', {
  headers: { 'X-Request-Id': getRequestId() }
});

// All services use same ID - complete trace!
```

### 4. Error Reporting

```typescript
app.use((err, req, res, next) => {
  logger.error('Request failed', { error: err.message });
  
  res.status(500).json({
    error: 'Something went wrong',
    requestId: req.requestId  // User can report this ID
  });
});
```

## Key Benefits

✅ **Zero Configuration** - Works automatically  
✅ **Lightweight** - < 0.02ms overhead per request  
✅ **Automatic Logging** - All logs include request ID  
✅ **Distributed Tracing** - Track requests across services  
✅ **Easy Debugging** - Find all logs for a specific request  

## Best Practices

### ✅ DO

- Use the logger from `lib/logger.ts` (includes request ID automatically)
- Propagate request ID to external services
- Include request ID in error responses
- Use for debugging and monitoring

### ❌ DON'T

- Use `console.log()` (won't include request ID)
- Modify the request ID during request processing
- Call `getRequestId()` in module-level code (outside requests)

## Troubleshooting

**Q: Request ID not showing in logs?**  
A: Make sure you're using `createLogger()` from `lib/logger.ts`, not `console.log()`

**Q: Request ID is undefined?**  
A: `getRequestId()` only works within request handlers, not in global scope

**Q: Different IDs in same request?**  
A: Check for async operations that might escape request context

## Next Steps

- Read full documentation: `docs/REQUEST_ID_TRACING.md`
- Run tests: `npm test -- requestId.test.ts`
- Check implementation: `src/middleware/requestId.ts`

## Support

For issues or questions, check the full documentation or create an issue on GitHub.
