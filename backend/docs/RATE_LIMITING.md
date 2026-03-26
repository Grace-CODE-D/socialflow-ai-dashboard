# Rate Limiting

Rate limiting is implemented via [`express-rate-limit`](https://github.com/express-rate-limit/express-rate-limit) and applied at the route level in `src/app.ts`.

## Policies

| Scope | Routes | Window | Max requests | Rationale |
|---|---|---|---|---|
| Auth (strict) | `POST /api/auth/login`<br>`POST /api/auth/register`<br>`POST /api/auth/refresh`<br>`POST /api/auth/logout` | 15 minutes | 10 | Brute-force / credential-stuffing protection |
| AI generation | `POST /api/ai/analyze-image`<br>`POST /api/tts/jobs` (and all TTS routes) | 1 minute | 30 | High-cost upstream API calls |
| General API | All other `/api/*` routes | 1 minute | 100 | Standard abuse prevention |

## Response format

When a limit is exceeded the server returns **HTTP 429** with:

```json
{
  "success": false,
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please slow down and try again later.",
  "retryAfter": 60,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

Standard `RateLimit-*` headers (RFC 6585) are included in every response.

## Storage

| Environment | Store |
|---|---|
| `development` | In-memory (default) |
| `production` | Redis via `rate-limit-redis` |

Redis connection is configured through the standard env vars (`REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB`) — see `.env.example`.

## Implementation

- Middleware: `src/middleware/rateLimit.ts`
- Applied in: `src/app.ts`
- Test script: `scripts/test-rate-limit.sh`

## Testing

Start the server, then run:

```bash
./scripts/test-rate-limit.sh http://localhost:3001
```

The script fires requests above each threshold and asserts HTTP 429 is returned.
