# Error Handling Strategy

## Overview

The SocialFlow backend implements comprehensive error handling to ensure zero unlogged errors and graceful shutdown during catastrophic failures.

## Global Error Handlers

### Uncaught Exception Handler

Catches any synchronous errors that escape try-catch blocks:

```typescript
process.on('uncaughtException', (error: Error) => {
  // Logs error with full stack trace
  // Initiates graceful shutdown
  // Exits with code 1
});
```

**When triggered:**
- Synchronous code throws an error that isn't caught
- Programming errors (e.g., accessing undefined properties)
- Third-party library errors

**Response:**
1. Log error details (message, stack trace, error name)
2. Wait 1 second for logs to flush
3. Initiate graceful shutdown
4. Exit with code 1

### Unhandled Rejection Handler

Catches any promise rejections that aren't handled with `.catch()` or `try-catch`:

```typescript
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  // Logs rejection reason with stack trace
  // Initiates graceful shutdown
  // Exits with code 1
});
```

**When triggered:**
- Async functions throw errors without proper error handling
- Promises reject without `.catch()` handlers
- Database query failures without error handling

**Response:**
1. Log rejection reason and stack trace
2. Wait 1 second for logs to flush
3. Initiate graceful shutdown
4. Exit with code 1

## Graceful Shutdown Process

The graceful shutdown handler ensures all resources are properly cleaned up before the process exits.

### Shutdown Sequence

1. **Prevent duplicate shutdowns** - Set `isShuttingDown` flag
2. **Set force exit timeout** - 30 seconds maximum for graceful shutdown
3. **Stop accepting new connections** - Close HTTP server
4. **Stop background jobs** - Worker monitor and data pruning
5. **Close database connections** - Disconnect Prisma client
6. **Exit process** - With appropriate exit code

### Exit Codes

- `0` - Normal shutdown (SIGINT, SIGTERM)
- `1` - Error shutdown (uncaughtException, unhandledRejection, timeout)

### Timeout Protection

If graceful shutdown takes longer than 30 seconds, the process is forcefully terminated to prevent hanging:

```typescript
const forceExitTimeout = setTimeout(() => {
  logger.error('Graceful shutdown timeout exceeded, forcing exit');
  process.exit(1);
}, 30000);
```

## Signal Handlers

### SIGINT (Ctrl+C)

Triggered when user presses Ctrl+C in terminal:
- Initiates graceful shutdown
- Exits with code 0

### SIGTERM

Triggered by process managers (Docker, Kubernetes, systemd):
- Initiates graceful shutdown
- Exits with code 0

## Resource Cleanup

### HTTP Server

```typescript
serverInstance.close((err) => {
  // Stops accepting new connections
  // Waits for existing connections to complete
});
```

### Worker Monitor

```typescript
await stopWorkerMonitor();
// Stops monitoring background jobs
// Cleans up Redis connections
```

### Data Pruning Job

```typescript
await stopDataPruningJob();
// Stops scheduled data cleanup tasks
```

### Database Connections

```typescript
await prisma.$disconnect();
// Closes all database connection pool connections
// Ensures no hanging connections
```

## Best Practices

### 1. Always Handle Promises

❌ **Bad:**
```typescript
async function fetchData() {
  throw new Error('Failed');
}
fetchData(); // Unhandled rejection!
```

✅ **Good:**
```typescript
async function fetchData() {
  throw new Error('Failed');
}
fetchData().catch(error => logger.error('Fetch failed', { error }));
```

### 2. Use Try-Catch in Async Functions

❌ **Bad:**
```typescript
async function processData() {
  const data = await riskyOperation(); // Could throw
  return data;
}
```

✅ **Good:**
```typescript
async function processData() {
  try {
    const data = await riskyOperation();
    return data;
  } catch (error) {
    logger.error('Process failed', { error });
    throw error;
  }
}
```

### 3. Handle Errors in Event Listeners

❌ **Bad:**
```typescript
server.on('connection', (socket) => {
  socket.write(data); // Could throw
});
```

✅ **Good:**
```typescript
server.on('connection', (socket) => {
  try {
    socket.write(data);
  } catch (error) {
    logger.error('Socket write failed', { error });
  }
});
```

### 4. Log Before Throwing

```typescript
function validateInput(input: unknown) {
  if (!input) {
    logger.error('Invalid input received', { input });
    throw new Error('Input is required');
  }
}
```

## Testing Error Handlers

### Test Uncaught Exception

```typescript
// Trigger after server starts
setTimeout(() => {
  throw new Error('Test uncaught exception');
}, 5000);
```

**Expected behavior:**
1. Error logged with stack trace
2. Graceful shutdown initiated
3. Process exits with code 1

### Test Unhandled Rejection

```typescript
// Trigger after server starts
setTimeout(() => {
  Promise.reject(new Error('Test unhandled rejection'));
}, 5000);
```

**Expected behavior:**
1. Rejection logged with reason
2. Graceful shutdown initiated
3. Process exits with code 1

### Test Graceful Shutdown

```bash
# Start server
npm run dev

# Send SIGTERM
kill -TERM <pid>
```

**Expected behavior:**
1. "Starting graceful shutdown" logged
2. All resources cleaned up
3. Process exits with code 0

## Monitoring

### Log Patterns to Monitor

- `UNCAUGHT EXCEPTION` - Critical, investigate immediately
- `UNHANDLED REJECTION` - Critical, investigate immediately
- `Graceful shutdown timeout exceeded` - Performance issue
- `Failed to close database connections` - Connection leak

### Alerts

Set up alerts for:
- Any uncaught exceptions or unhandled rejections
- Shutdown timeouts
- Failed resource cleanup

## Production Considerations

1. **Log Aggregation** - Ensure logs are sent to centralized logging (CloudWatch, Datadog, etc.)
2. **Process Manager** - Use PM2, systemd, or Docker to automatically restart after crashes
3. **Health Checks** - Implement `/health` endpoint for load balancers
4. **Metrics** - Track error rates and shutdown frequency

## References

- [Node.js Error Handling Best Practices](https://nodejs.org/api/process.html#process_event_uncaughtexception)
- [Graceful Shutdown in Node.js](https://nodejs.org/api/process.html#process_signal_events)
