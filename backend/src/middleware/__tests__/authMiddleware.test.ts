/**
 * authMiddleware.test.ts — coverage for authMiddleware.ts (issue #1242).
 *
 * authMiddleware is still wired up on several live routes (config, ai, tts,
 * organization, search, exports, PostController, webhooks controllers) but
 * previously had no dedicated test file — only its sibling `authenticate.ts`
 * did. This covers the missing/invalid/blacklisted token paths.
 */

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-that-is-at-least-32-chars!!';

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

jest.mock('../../services/AuthBlacklistService', () => ({
  AuthBlacklistService: {
    isBlacklisted: jest.fn().mockResolvedValue(false),
    keyFromPayload: jest.fn().mockReturnValue('mock-key'),
  },
}));

jest.mock('../../config/config', () => ({
  config: { JWT_SECRET: 'test-secret-that-is-at-least-32-chars!!' },
}));

import { authMiddleware, AuthRequest } from '../authMiddleware';
import { AuthBlacklistService } from '../../services/AuthBlacklistService';

const SECRET = 'test-secret-that-is-at-least-32-chars!!';

function makeReq(token?: string): AuthRequest {
  return {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  } as AuthRequest;
}

function makeRes(): Response {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

const next: NextFunction = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

describe('missing/malformed Authorization header', () => {
  it('returns 401 when the header is absent', async () => {
    const req = makeReq();
    const res = makeRes();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Missing or malformed Authorization header' });
    expect(next).not.toHaveBeenCalled();
    expect(AuthBlacklistService.isBlacklisted).not.toHaveBeenCalled();
  });

  it('returns 401 when the header does not start with "Bearer "', async () => {
    const req = { headers: { authorization: 'Basic abc123' } } as AuthRequest;
    const res = makeRes();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('invalid token', () => {
  it('returns 401 for a malformed (non-JWT) token', async () => {
    const req = makeReq('not.a.valid.token');
    const res = makeRes();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired access token' });
    expect(next).not.toHaveBeenCalled();
    expect(AuthBlacklistService.isBlacklisted).not.toHaveBeenCalled();
  });

  it('returns 401 for a token signed with the wrong secret', async () => {
    const wrongToken = jwt.sign({ sub: 'user-1' }, 'wrong-secret', { expiresIn: '15m' });
    const req = makeReq(wrongToken);
    const res = makeRes();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for an expired token', async () => {
    const expiredToken = jwt.sign({ sub: 'user-1' }, SECRET, { expiresIn: '-10s' });
    const req = makeReq(expiredToken);
    const res = makeRes();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired access token' });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('blacklisted token', () => {
  it('returns 401 when the token has been revoked', async () => {
    (AuthBlacklistService.isBlacklisted as jest.Mock).mockResolvedValueOnce(true);
    const validToken = jwt.sign({ sub: 'user-1' }, SECRET, { expiresIn: '15m' });

    const req = makeReq(validToken);
    const res = makeRes();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token has been revoked' });
    expect(next).not.toHaveBeenCalled();
  });

  it('checks the blacklist using a key derived from the token payload', async () => {
    const validToken = jwt.sign({ sub: 'user-1' }, SECRET, { expiresIn: '15m' });
    const req = makeReq(validToken);
    const res = makeRes();

    await authMiddleware(req, res, next);

    expect(AuthBlacklistService.keyFromPayload).toHaveBeenCalledWith(
      expect.objectContaining({ sub: 'user-1' }),
    );
    expect(AuthBlacklistService.isBlacklisted).toHaveBeenCalledWith('mock-key');
  });
});

describe('valid, non-blacklisted token', () => {
  it('attaches req.user and calls next()', async () => {
    const validToken = jwt.sign({ sub: 'user-42' }, SECRET, { expiresIn: '15m' });
    const req = makeReq(validToken);
    const res = makeRes();

    await authMiddleware(req, res, next);

    expect(req.user).toEqual({ id: 'user-42' });
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
