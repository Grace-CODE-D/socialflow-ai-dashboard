# Fix: cors.ts's NODE_ENV keys ('local'/'staging'/'prod') never matched real NODE_ENV

## Problem

`backend/src/config/cors.ts` read `process.env.NODE_ENV ?? 'local'` and
looked it up in `ALLOWED_ORIGINS`, whose keys were `local`, `staging`,
`prod`. Every other part of the codebase — `config.ts`'s Zod schema,
`csrfProtection.ts` — treats `NODE_ENV` as `development` / `test` /
`production`. In a real production deployment `NODE_ENV=production`, so
`ALLOWED_ORIGINS['production']` was `undefined` and the code silently fell
back to `ALLOWED_ORIGINS.local` (`localhost:3000`/`5173`,
`127.0.0.1:3000`).

`SocketService.ts` uses `corsOptions.origin` for Socket.io whenever
`config.NODE_ENV === 'production'` — so in real production, Socket.io
rejected the actual frontend domain (`socialflow.app`) while incorrectly
permitting localhost-originated connections.

## Fix

- Renamed the `ALLOWED_ORIGINS` keys to the real `NODE_ENV` values:
  `development`, `test`, `production` (dropped `staging`, which was never
  a reachable `NODE_ENV` value to begin with).
- Updated the `env !== 'prod'` / fallback checks to use `'production'` and
  `'development'` respectively.

`corsOptions` still reads `process.env.NODE_ENV` directly rather than the
validated `config.NODE_ENV` singleton, since `cors.ts` has no dependency
on `config.ts` today and pulling one in was out of scope for this fix —
the key values now simply match what `config.ts` validates against.

## Tests

Added `backend/src/config/__tests__/cors.test.ts`:

- `NODE_ENV=production`: rejects `http://localhost:3000`, allows
  `https://socialflow.app`
- `NODE_ENV=development`: allows localhost, rejects the production origin
- requests with no `Origin` header: rejected in production, allowed
  otherwise

Run: `npm test -- cors` (from `backend/`).
