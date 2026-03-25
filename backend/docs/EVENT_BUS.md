# EventBus — Custom EventEmitter Registry

A typed wrapper around Node's built-in `EventEmitter` for broadcasting real-time job progress events across the backend, primarily used to push updates to SSE (Server-Sent Events) connections.

---

## Why EventBus?

Raw `EventEmitter` works, but it's stringly-typed and easy to misuse. `EventBus` wraps it with:

- Typed event payloads (`JobProgressEvent`)
- Scoped per-user channels (`job:<userId>`)
- A wildcard channel for admin/monitoring (`job:*`)
- A raised listener limit (200) to support many concurrent SSE clients

---

## Setup

The bus is a singleton — import and use it anywhere.

```ts
import { eventBus } from '@/lib/eventBus';
```

---

## Event Payload

```ts
interface JobProgressEvent {
  jobId: string;
  userId: string;
  type: 'video_transcoding' | 'ai_generation';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0–100
  message?: string;
  error?: string;
  meta?: Record<string, unknown>;
}
```

---

## API

### Emit a progress update

```ts
eventBus.emitJobProgress({
  jobId: 'abc123',
  userId: 'user_42',
  type: 'video_transcoding',
  status: 'processing',
  progress: 45,
  message: 'Encoding segment 3/7',
});
```

Internally this fires two events:
- `job:user_42` — picked up by that user's SSE listener
- `job:*` — picked up by any admin/monitoring listener

---

### Subscribe to a user's jobs

```ts
const handler = (event: JobProgressEvent) => {
  console.log(`[${event.jobId}] ${event.progress}%`);
};

eventBus.onUserJob('user_42', handler);
```

### Unsubscribe (important — always clean up SSE connections)

```ts
eventBus.offUserJob('user_42', handler);
```

---

### Listen to all jobs (admin / monitoring)

```ts
eventBus.on('job:*', (event: JobProgressEvent) => {
  monitor.track(event);
});
```

---

## SSE Integration Pattern

```ts
// GET /events/jobs
app.get('/events/jobs', authMiddleware, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.flushHeaders();

  const userId = req.user.id;

  const handler = (event: JobProgressEvent) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  eventBus.onUserJob(userId, handler);

  // Clean up when client disconnects
  req.on('close', () => {
    eventBus.offUserJob(userId, handler);
  });
});
```

---

## Custom Registry Pattern (extending further)

If you need named channels beyond jobs, extend `EventBus`:

```ts
class EventBus extends EventEmitter {
  emit<T>(channel: string, payload: T): boolean {
    return super.emit(channel, payload);
  }

  on<T>(channel: string, listener: (payload: T) => void): this {
    return super.on(channel, listener);
  }
}
```

This gives you a fully generic, type-safe registry for any domain event.

---

## Notes

- Max listeners is set to `200`. Raise it if you expect more concurrent SSE clients.
- Always call `offUserJob` on connection close to prevent memory leaks.
- The `job:*` wildcard is a convention — Node's `EventEmitter` does not natively support glob patterns. It's just a literal event name used as a broadcast channel.
