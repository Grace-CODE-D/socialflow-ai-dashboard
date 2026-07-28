/**
 * authMiddleware.test.ts
 *
 * #1103 — Unit tests for authMiddleware — JWT signature verification,
 * blacklist lookup, and 401 response shape.
 *
 * Requirements covered:
 *  - Valid, non-expired JWT with correct signature → req.user is set and next() is called
 *  - Expired JWT → 401 response with { error: 'Token expired' } (or equivalent)
 *  - Invalid signature → 401 response with { error: 'Invalid token' } (or equivalent)
 *  - Token present in AuthBlacklistService (logged-out session) → 401
 *  - Missing Authorization header → 401 with { error: 'No token provided' } (or equivalent)
 *  - Malformed header (not Bearer <token>) → 401
 *
 * AuthBlacklistService is mocked, JWT library calls use a fixed test secret.
 */

// Set env before module loads
process.env.JWT_SECRET = 'test-secret-for-auth-middleware-32ch!!';
process.env.JWT_REFRESH_SECRET = 'test-refresh-for-auth-middleware-32ch!!';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Mock AuthBlacklistService before importing the middleware
jest.mock('../services/AuthBlacklistService', () => ({
  AuthBlacklistService: {
    isBlacklisted: jest.fn().mockResolvedValue(false),
    keyFromPayload: jest.fn().mockImplementation((payload: { sub?: string; jti?: string; iat?: number }) => {
      if (payload.jti) return payload.jti;
      return `${payload.sub ?? 'unknown'}:${payload.iat ?? 0}`;
    }),
  },
}));

// Mock config with our test secret
jest.mock('../config/config', () => ({
  config: {
    JWT_SECRET: 'test-secret-for-auth-middleware-32ch!!',
    JWT_REFRESH_SECRET: 'test-refresh-for-auth-middleware-32ch!!',
  },
}));

import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { AuthBlacklistService } from '../services/AuthBlacklistService';

const SECRET = 'test-secret-for-auth-middleware-32ch!!';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeReq(token?: string, overrideHeaders: Record<string, string> = {}): AuthRequest {
  return {
    headers: token
      ? { authorization: `Bearer ${token}`, ...overrideHeaders }
      : { ...overrideHeaders },
  } as unknown as AuthRequest;
}

function makeRes(): Response {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

// ── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  (AuthBlacklistService.isBlacklisted as jest.Mock).mockResolvedValue(false);
});

// ─── Missing Authorization header ────────────────────────────────────────────

describe('Missing Authorization header', () => {
  it('returns 401 when Authorization header is absent', async () => {
    const req = makeReq(); // no token
    const res = makeRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String) }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('does not call isBlacklisted when no authorization header is present', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(AuthBlacklistService.isBlacklisted).not.toHaveBeenCalled();
  });

  it('401 response body includes an error message (not empty)', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    const jsonArg = (res.json as jest.Mock).mock.calls[0][0];
    expect(jsonArg).toHaveProperty('message');
    expect(jsonArg.message).toBeTruthy();
  });
});

// ─── Malformed Authorization header ──────────────────────────────────────────

describe('Malformed Authorization header (not "Bearer <token>")', () => {
  it('returns 401 for Basic auth header', async () => {
    const req = makeReq(undefined, { authorization: 'Basic dXNlcjpwYXNz' });
    const res = makeRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for header with Bearer but no token (trailing space)', async () => {
    const req = makeReq(undefined, { authorization: 'Bearer ' });
    const res = makeRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when authorization header is just "Bearer" without a token', async () => {
    const req = makeReq(undefined, { authorization: 'Bearer' });
    const res = makeRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for a token-like string without Bearer prefix', async () => {
    const token = jwt.sign({ sub: 'user-1' }, SECRET, { expiresIn: '1h' });
    const req = makeReq(undefined, { authorization: token }); // missing "Bearer "
    const res = makeRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

// ─── Expired JWT ──────────────────────────────────────────────────────────────

describe('Expired JWT', () => {
  it('returns 401 for a token expired in the past', async () => {
    const expiredToken = jwt.sign({ sub: 'user-expired' }, SECRET, { expiresIn: '-10s' });

    const req = makeReq(expiredToken);
    const res = makeRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for a token with exp far in the past', async () => {
    const pastExp = Math.floor(Date.now() / 1000) - 7200; // 2 hours ago
    const expiredToken = jwt.sign({ sub: 'user-old', exp: pastExp }, SECRET);

    const req = makeReq(expiredToken);
    const res = makeRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('401 json response has a message property for expired tokens', async () => {
    const expiredToken = jwt.sign({ sub: 'user-exp-msg' }, SECRET, { expiresIn: '-1s' });

    const req = makeReq(expiredToken);
    const res = makeRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    const jsonArg = (res.json as jest.Mock).mock.calls[0][0];
    expect(jsonArg).toHaveProperty('message');
  });
});

// ─── Invalid JWT signature ────────────────────────────────────────────────────

describe('Invalid JWT signature', () => {
  it('returns 401 when token is signed with a wrong secret', async () => {
    const wrongToken = jwt.sign({ sub: 'user-wrong' }, 'completely-wrong-secret', {
      expiresIn: '1h',
    });

    const req = makeReq(wrongToken);
    const res = makeRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('does not call isBlacklisted when signature is invalid', async () => {
    const wrongToken = jwt.sign({ sub: 'user-sig' }, 'bad-secret', { expiresIn: '1h' });

    const req = makeReq(wrongToken);
    const res = makeRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(AuthBlacklistService.isBlacklisted).not.toHaveBeenCalled();
  });

  it('returns 401 for a completely malformed token string', async () => {
    const req = makeReq('this.is.not.a.jwt');
    const res = makeRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for a token with tampered payload', async () => {
    const validToken = jwt.sign({ sub: 'user-tamper' }, SECRET, { expiresIn: '1h' });
    // Tamper the payload section (middle part)
    const parts = validToken.split('.');
    const tamperedPayload = Buffer.from(
      JSON.stringify({ sub: 'admin-user', exp: Math.floor(Date.now() / 1000) + 3600 }),
    ).toString('base64url');
    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

    const req = makeReq(tamperedToken);
    const res = makeRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

// ─── Blacklisted token ────────────────────────────────────────────────────────

describe('AuthBlacklistService integration (logged-out session)', () => {
  it('returns 401 when a valid token is in the blacklist', async () => {
    (AuthBlacklistService.isBlacklisted as jest.Mock).mockResolvedValueOnce(true);

    const validToken = jwt.sign({ sub: 'user-blacklisted', jti: 'blacklisted-jti' }, SECRET, {
      expiresIn: '15m',
    });

    const req = makeReq(validToken);
    const res = makeRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls isBlacklisted with the key derived from the token payload', async () => {
    const payload = { sub: 'user-bl-key', jti: 'specific-jti-value' };
    const validToken = jwt.sign(payload, SECRET, { expiresIn: '15m' });

    const req = makeReq(validToken);
    const res = makeRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(AuthBlacklistService.isBlacklisted).toHaveBeenCalledTimes(1);
    expect(AuthBlacklistService.keyFromPayload).toHaveBeenCalled();
  });

  it('allows a valid non-blacklisted token through', async () => {
    (AuthBlacklistService.isBlacklisted as jest.Mock).mockResolvedValueOnce(false);

    const validToken = jwt.sign({ sub: 'user-allowed' }, SECRET, { expiresIn: '15m' });

    const req = makeReq(validToken);
    const res = makeRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('401 response body for blacklisted token has a message property', async () => {
    (AuthBlacklistService.isBlacklisted as jest.Mock).mockResolvedValueOnce(true);

    const validToken = jwt.sign({ sub: 'user-bl-msg' }, SECRET, { expiresIn: '15m' });
    const req = makeReq(validToken);
    const res = makeRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    const jsonArg = (res.json as jest.Mock).mock.calls[0][0];
    expect(jsonArg).toHaveProperty('message');
    expect(jsonArg.message).toBeTruthy();
  });
});

// ─── Valid JWT (happy path) ───────────────────────────────────────────────────

describe('Valid JWT (happy path)', () => {
  it('calls next() with no arguments for a valid non-blacklisted token', async () => {
    const validToken = jwt.sign({ sub: 'user-happy' }, SECRET, { expiresIn: '1h' });

    const req = makeReq(validToken);
    const res = makeRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(); // no error argument
  });

  it('sets req.user.id from the token subject claim', async () => {
    const validToken = jwt.sign({ sub: 'user-id-from-sub' }, SECRET, { expiresIn: '1h' });

    const req = makeReq(validToken);
    const res = makeRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(req.user).toEqual({ id: 'user-id-from-sub' });
  });

  it('does not set a response status code on successful validation', async () => {
    const validToken = jwt.sign({ sub: 'user-no-status' }, SECRET, { expiresIn: '1h' });

    const req = makeReq(validToken);
    const res = makeRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('checks the blacklist exactly once per valid request', async () => {
    const validToken = jwt.sign({ sub: 'user-once' }, SECRET, { expiresIn: '1h' });

    const req = makeReq(validToken);
    const res = makeRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(AuthBlacklistService.isBlacklisted).toHaveBeenCalledTimes(1);
  });
});

// ─── Response shape verification ─────────────────────────────────────────────

describe('401 response shape for all failure modes', () => {
  const failureCases = [
    {
      name: 'missing auth header',
      setup: () => makeReq(),
    },
    {
      name: 'wrong auth scheme',
      setup: () => makeReq(undefined, { authorization: 'Basic abc' }),
    },
    {
      name: 'invalid signature',
      setup: () => makeReq(jwt.sign({ sub: 'x' }, 'wrong', { expiresIn: '1h' })),
    },
    {
      name: 'expired token',
      setup: () => makeReq(jwt.sign({ sub: 'x' }, SECRET, { expiresIn: '-1s' })),
    },
  ];

  for (const { name, setup } of failureCases) {
    it(`returns a JSON object with a 'message' property for: ${name}`, async () => {
      const req = setup();
      const res = makeRes();
      const next = jest.fn();

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      const jsonArg = (res.json as jest.Mock).mock.calls[0]?.[0];
      expect(jsonArg).toBeDefined();
      expect(jsonArg).toHaveProperty('message');
      expect(next).not.toHaveBeenCalled();
    });
  }

  it('returns 401 when blacklisted and response contains message', async () => {
    (AuthBlacklistService.isBlacklisted as jest.Mock).mockResolvedValueOnce(true);
    const validToken = jwt.sign({ sub: 'bl-shape' }, SECRET, { expiresIn: '1h' });
    const req = makeReq(validToken);
    const res = makeRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    const jsonArg = (res.json as jest.Mock).mock.calls[0][0];
    expect(jsonArg).toHaveProperty('message');
    expect(next).not.toHaveBeenCalled();
  });
});
