/**
 * Coverage for #1303 — the GraphQL context layer had zero test coverage.
 * Exercises buildContext() for valid, invalid, missing, and
 * blacklisted-token cases.
 *
 * Also covers #1262 — buildContext must validate tokens against the
 * config-validated JWT_SECRET, not a hardcoded fallback string.
 */
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { AuthBlacklistService } from '../../services/AuthBlacklistService';

const TEST_SECRET = 'test-secret-that-is-at-least-32-chars!!';

jest.mock('../../config/config', () => ({
  config: { JWT_SECRET: 'test-secret-that-is-at-least-32-chars!!' },
}));

jest.mock('../../services/AuthBlacklistService', () => ({
  AuthBlacklistService: {
    isBlacklisted: jest.fn(),
    keyFromPayload: jest.fn(
      (p: { sub?: string; jti?: string; iat?: number }) => p.jti ?? `${p.sub}:${p.iat}`,
    ),
  },
}));

import { buildContext } from '../context';

const mockIsBlacklisted = AuthBlacklistService.isBlacklisted as jest.Mock;
const mockKeyFromPayload = AuthBlacklistService.keyFromPayload as jest.Mock;

const SECRET = TEST_SECRET;

function makeReq(authorization?: string): { req: Request } {
  return { req: { headers: { authorization } } as unknown as Request };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('buildContext', () => {
  it('returns an empty context when there is no Authorization header', async () => {
    const ctx = await buildContext(makeReq());
    expect(ctx).toEqual({});
    expect(mockIsBlacklisted).not.toHaveBeenCalled();
  });

  it('returns an empty context when the Authorization header is not a Bearer token', async () => {
    const ctx = await buildContext(makeReq('Basic abc123'));
    expect(ctx).toEqual({});
    expect(mockIsBlacklisted).not.toHaveBeenCalled();
  });

  it('returns an empty context for a malformed token', async () => {
    const ctx = await buildContext(makeReq('Bearer not.a.valid.token'));
    expect(ctx).toEqual({});
    expect(mockIsBlacklisted).not.toHaveBeenCalled();
  });

  it('returns an empty context for a token signed with the wrong secret', async () => {
    const wrongToken = jwt.sign({ sub: 'user-1' }, 'wrong-secret', { expiresIn: '15m' });
    const ctx = await buildContext(makeReq(`Bearer ${wrongToken}`));
    expect(ctx).toEqual({});
    expect(mockIsBlacklisted).not.toHaveBeenCalled();
  });

  it('returns an empty context for an expired token', async () => {
    const expiredToken = jwt.sign({ sub: 'user-1' }, SECRET, { expiresIn: '-10s' });
    const ctx = await buildContext(makeReq(`Bearer ${expiredToken}`));
    expect(ctx).toEqual({});
  });

  it('returns userId and tokenKey for a valid, non-blacklisted token', async () => {
    mockIsBlacklisted.mockResolvedValue(false);
    const token = jwt.sign({ sub: 'user-1', jti: 'jti-abc' }, SECRET, { expiresIn: '15m' });

    const ctx = await buildContext(makeReq(`Bearer ${token}`));

    expect(mockKeyFromPayload).toHaveBeenCalled();
    expect(mockIsBlacklisted).toHaveBeenCalledWith('jti-abc');
    expect(ctx).toEqual({ userId: 'user-1', tokenKey: 'jti-abc' });
  });

  it('derives tokenKey from sub:iat when the token has no jti', async () => {
    mockIsBlacklisted.mockResolvedValue(false);
    const token = jwt.sign({ sub: 'user-2' }, SECRET, { expiresIn: '15m' });

    const ctx = await buildContext(makeReq(`Bearer ${token}`));

    expect(ctx.userId).toBe('user-2');
    expect(ctx.tokenKey).toMatch(/^user-2:\d+$/);
  });

  it('returns an empty context when the token is blacklisted', async () => {
    mockIsBlacklisted.mockResolvedValue(true);
    const token = jwt.sign({ sub: 'user-1', jti: 'jti-blacklisted' }, SECRET, {
      expiresIn: '15m',
    });

    const ctx = await buildContext(makeReq(`Bearer ${token}`));

    expect(mockIsBlacklisted).toHaveBeenCalledWith('jti-blacklisted');
    expect(ctx).toEqual({});
  });
});

describe('#1262 buildContext JWT_SECRET', () => {
  it('accepts a token signed with the validated config.JWT_SECRET', async () => {
    mockIsBlacklisted.mockResolvedValue(false);
    const token = jwt.sign({ sub: 'user-1' }, TEST_SECRET);
    const ctx = await buildContext(makeReq(`Bearer ${token}`));
    expect(ctx.userId).toBe('user-1');
  });

  it('rejects a token signed with the old hardcoded fallback secret', async () => {
    const token = jwt.sign({ sub: 'attacker' }, 'change-me-in-production');
    const ctx = await buildContext(makeReq(`Bearer ${token}`));
    expect(ctx.userId).toBeUndefined();
  });
});
