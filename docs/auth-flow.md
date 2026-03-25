# Auth Flow — SocialFlow JWT Authentication

## Overview

SocialFlow uses a stateless **JWT (JSON Web Token)** authentication system with short-lived access tokens and rotating refresh tokens.

```
Client                          Server
  |                               |
  |-- POST /api/auth/register --> |  Hash password (bcrypt, 12 rounds)
  |<-- 201 { accessToken,         |  Store user, issue token pair
  |          refreshToken } ----  |
  |                               |
  |-- POST /api/auth/login -----> |  Verify password hash
  |<-- 200 { accessToken,         |  Issue token pair
  |          refreshToken } ----  |
  |                               |
  |-- GET /api/protected          |
  |   Authorization: Bearer <AT>  |  authMiddleware verifies AT
  |<-- 200 { ... } -------------- |
  |                               |
  |-- POST /api/auth/refresh ----> |  Verify RT, rotate (old RT revoked)
  |<-- 200 { accessToken,          |
  |          refreshToken } -----  |
  |                               |
  |-- POST /api/auth/logout -----> |  Revoke RT from store
  |<-- 204 ----------------------- |
```

## Endpoints

| Method | Path | Auth required | Description |
|--------|------|:---:|-------------|
| POST | `/api/auth/register` | No | Create account, returns token pair |
| POST | `/api/auth/login` | No | Authenticate, returns token pair |
| POST | `/api/auth/refresh` | No | Rotate refresh token, returns new pair |
| POST | `/api/auth/logout` | No | Revoke refresh token |

### Register / Login request body

```json
{ "email": "user@example.com", "password": "min8chars" }
```

### Refresh / Logout request body

```json
{ "refreshToken": "<refresh_jwt>" }
```

## Token Design

| Token | Algorithm | Lifetime | Payload |
|-------|-----------|----------|---------|
| Access | HS256 | 15 min | `{ sub: userId }` |
| Refresh | HS256 | 7 days | `{ sub: userId, jti: uuid }` |

- `jti` (JWT ID) is a random UUID added to every refresh token, guaranteeing uniqueness even when issued within the same second.
- Refresh tokens are **rotated on every use** — the old token is immediately invalidated and a new one is issued.

## Protecting Routes

```ts
import { authMiddleware } from './middleware/authMiddleware';

router.get('/protected', authMiddleware, (req, res) => {
  res.json({ userId: req.userId });
});
```

The middleware reads `Authorization: Bearer <token>`, verifies the signature, and attaches `req.userId`.

## Password Security

- Passwords are hashed with **bcrypt** at cost factor **12** before storage.
- Plain-text passwords are never stored or logged.
- Timing-safe comparison via `bcrypt.compare`.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | `change-me-in-production` | HMAC secret for access tokens |
| `JWT_EXPIRES_IN` | `15m` | Access token lifetime |
| `JWT_REFRESH_SECRET` | `refresh-change-me-in-production` | HMAC secret for refresh tokens |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token lifetime |

> **Security assumption**: Both secrets must be long, random strings in production (≥ 32 bytes). Store them in environment variables or a secrets manager — never in source control.

## Security Assumptions & Limitations

- **Transport**: All endpoints must be served over HTTPS in production to prevent token interception.
- **Storage**: The client is responsible for storing tokens securely (e.g., `httpOnly` cookies or secure in-memory storage — avoid `localStorage` for refresh tokens).
- **Persistence**: The current implementation uses an **in-memory store**. Tokens and users are lost on server restart. Replace `src/models/User.ts` with a real database (e.g., PostgreSQL + Prisma) for production.
- **Refresh token reuse detection**: A reused (already-rotated) refresh token is rejected with `401`. Consider implementing full refresh token family invalidation for stronger security against token theft.
- **Rate limiting**: Add rate limiting on `/login` and `/register` to mitigate brute-force attacks (see `services/rateLimitService.ts`).
