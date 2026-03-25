# Global Error Handlers Implementation

## Overview

This implementation adds comprehensive global error handling to prevent unlogged crashes and ensure graceful shutdown during catastrophic failures.

## What's Included

### 1. Global Error Handlers (`src/server.ts`)

- **Uncaught Exception Handler** - Catches synchronous errors that escape try-catch blocks
- **Unhandled Rejection Handler** - Catches promise rejections without error handling
- **Signal Handlers** - SIGINT and SIGTERM for graceful shutdown
- **Graceful Shutdown Logic** - Properly closes all resources before exit

### 2. Documentation (`docs/ERROR_HANDLING.md`)

Comprehensive documentation covering:
- How error handlers work
- Graceful shutdown process
- Best practices for error handling
- Testing procedures
- Production considerations

### 3. Test Suite (`src/tests/error-handlers.test.ts`)

Manual tests to verify:
- Uncaught exceptions are logged and trigger shutdown
- Unhandled rejections are logged and trigger shutdown
- Process exits with correct exit codes
- Multiple errors don't cause duplicate shutdowns

## Key Features

### ✅ Zero Unlogged Errors

All errors are logged with:
- Error message
- Full stack trace
- Error name/type
- Timestamp and context

### ✅ Graceful Shutdown

Proper cleanup of:
- HTTP server (stops accepting new connections)
- Worker monitor (background jobs)
- Data pruning jobs
- Database connections (Prisma)

### ✅ Timeout Protection

- 30-second timeout for graceful shutdown
- Force exit if cleanup takes too long
- Prevents process from hanging indefinitely

### ✅ Duplicate Prevention

- `isShuttingDown` flag prevents multiple shutdown attempts
- Ensures cleanup only runs once

### ✅ Proper Exit Codes

- `0` for normal shutdown (SIGINT, SIGTERM)
- `1` for error shutdown (exceptions, rejections)

## Usage

### Running the Server

```bash
npm run dev
```

The error handlers are automatically active when the server starts.

### Testing Error Handlers

#### Test Uncaught Exception

1. Edit `src/server.ts` and add after bootstrap:
```typescript
import { testUncaughtException } from './tests/error-handlers.test';
testUncaughtException();
```

2. Run the server:
```bash
npm run dev
```

3. Observe logs - should see error logged and graceful shutdown

4. Check exit code:
```bash
echo $?  # Should output 1
```

#### Test Unhandled Rejection

1. Edit `src/server.ts` and add after bootstrap:
```typescript
import { testUnhandledRejection } from './tests/error-handlers.test';
testUnhandledRejection();
```

2. Run and verify same as above

#### Test Graceful Shutdown

1. Start server:
```bash
npm run dev
```

2. Send SIGTERM:
```bash
kill -TERM <pid>
```

3. Observe graceful shutdown logs

4. Check exit code:
```bash
echo $?  # Should output 0
```

## Log Examples

### Uncaught Exception

```
[server] ERROR UNCAUGHT EXCEPTION - Application will terminate {
  error: "Cannot read property 'foo' of undefined",
  stack: "TypeError: Cannot read property 'foo' of undefined\n    at ...",
  name: "TypeError"
}
[server] INFO Received uncaughtException. Starting graceful shutdown...
[server] INFO HTTP server closed
[server] INFO Worker monitor stopped
[server] INFO Data pruning job stopped
[server] INFO Database connections closed
[server] INFO Shutdown complete
```

### Unhandled Rejection

```
[server] ERROR UNHANDLED REJECTION - Application will terminate {
  reason: "Database connection failed",
  stack: "Error: Database connection failed\n    at ...",
  promise: "[object Promise]"
}
[server] INFO Received unhandledRejection. Starting graceful shutdown...
[server] INFO HTTP server closed
[server] INFO Worker monitor stopped
[server] INFO Data pruning job stopped
[server] INFO Database connections closed
[server] INFO Shutdown complete
```

### Normal Shutdown (SIGTERM)

```
[server] INFO Received SIGTERM. Starting graceful shutdown...
[server] INFO HTTP server closed
[server] INFO Worker monitor stopped
[server] INFO Data pruning job stopped
[server] INFO Database connections closed
[server] INFO Shutdown complete
```

## Production Deployment

### Environment Variables

No additional environment variables required. The error handlers work out of the box.

### Process Manager

Use a process manager to automatically restart after crashes:

**PM2:**
```bash
pm2 start dist/server.js --name socialflow-backend
```

**Docker:**
```dockerfile
CMD ["node", "dist/server.js"]
# Docker will automatically restart on exit code 1
```

**Kubernetes:**
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
restartPolicy: Always
```

### Monitoring

Set up alerts for:
- `UNCAUGHT EXCEPTION` in logs
- `UNHANDLED REJECTION` in logs
- `Graceful shutdown timeout exceeded` in logs
- Process restart frequency

### Log Aggregation

Ensure logs are sent to centralized logging:
- AWS CloudWatch
- Datadog
- Splunk
- ELK Stack

## Best Practices

1. **Always handle promises** - Use `.catch()` or `try-catch` with async/await
2. **Log before throwing** - Provide context for debugging
3. **Use try-catch in async functions** - Prevent unhandled rejections
4. **Handle errors in event listeners** - Don't let errors bubble up
5. **Test error scenarios** - Verify error handling works as expected

## Troubleshooting

### Process Hangs on Shutdown

- Check if any resources are not being closed
- Verify database connections are properly disconnected
- Look for hanging timers or intervals

### Errors Not Logged

- Verify Winston logger is properly configured
- Check log level settings
- Ensure logs are being written to correct destination

### Multiple Shutdowns

- Verify `isShuttingDown` flag is working
- Check for race conditions in shutdown logic

## References

- [Node.js Process Events](https://nodejs.org/api/process.html#process_process_events)
- [Error Handling Best Practices](https://nodejs.org/en/docs/guides/error-handling/)
- [Graceful Shutdown Pattern](https://expressjs.com/en/advanced/healthcheck-graceful-shutdown.html)
