// #1262 — buildContext must validate tokens against the config-validated
// JWT_SECRET, not a hardcoded fallback string.

import jwt from 'jsonwebtoken';

const TEST_SECRET = 'test-secret-that-is-at-least-32-chars!!';

jest.mock('../../config/config', () => ({
  config: { JWT_SECRET: 'test-secret-that-is-at-least-32-chars!!' },
}));

jest.mock('../../services/AuthBlacklistService', () => ({
  AuthBlacklistService: {
    isBlacklisted: jest.fn().mockResolvedValue(false),
    keyFromPayload: jest.fn().mockReturnValue('mock-key'),
  },
}));

import { buildContext } from '../context';

function makeReq(token?: string) {
  return {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  } as any;
}

describe('#1262 buildContext JWT_SECRET', () => {
  it('accepts a token signed with the validated config.JWT_SECRET', async () => {
    const token = jwt.sign({ sub: 'user-1' }, TEST_SECRET);
    const ctx = await buildContext({ req: makeReq(token) });
    expect(ctx.userId).toBe('user-1');
  });

  it('rejects a token signed with the old hardcoded fallback secret', async () => {
    const token = jwt.sign({ sub: 'attacker' }, 'change-me-in-production');
    const ctx = await buildContext({ req: makeReq(token) });
    expect(ctx.userId).toBeUndefined();
  });

  it('returns an empty context when no Authorization header is present', async () => {
    const ctx = await buildContext({ req: makeReq() });
    expect(ctx).toEqual({});
  });
});
