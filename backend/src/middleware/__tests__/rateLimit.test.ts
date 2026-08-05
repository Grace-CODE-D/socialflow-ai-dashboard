/**
 * rateLimit.test.ts — coverage for rateLimit.ts (issue #1242): limiter
 * creation and the shared 429 response body.
 *
 * NOTE: this file must live under middleware/__tests__/ and reference the
 * module under test as '../rateLimit' (not '../middleware/rateLimit'). The
 * "unit" Jest project maps the module path pattern `.*(/|\\)middleware(/|\\)rateLimit`
 * to a lightweight passthrough stub (src/__tests__/__mocks__/rateLimit.ts)
 * so that unrelated suites don't need a real Redis/in-memory rate limiter.
 * Requiring it via '../rateLimit' from inside this directory does not match
 * that pattern, so this suite exercises the real implementation.
 *
 * 'rate-limit-redis' is mocked to throw on import in every test below —
 * this simulates the store being unavailable so express-rate-limit falls
 * back to its deterministic in-memory MemoryStore (matching the existing
 * convention in src/__tests__/rateLimitLogger.test.ts), keeping these tests
 * free of any real Redis dependency.
 */

process.env.NODE_ENV = process.env.NODE_ENV || 'test';

import express from 'express';
import request from 'supertest';

function freshRequire<T>(modulePath: string): T {
  jest.resetModules();
  jest.mock('rate-limit-redis', () => {
    throw new Error("Cannot find module 'rate-limit-redis'");
  });
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require(modulePath) as T;
}

afterEach(() => {
  jest.unmock('rate-limit-redis');
  jest.resetModules();
});

describe('initRateLimiters — limiter creation', () => {
  it('resolves without throwing and creates all three named limiters as callable middleware', async () => {
    const mod = freshRequire<typeof import('../rateLimit')>('../rateLimit');
    await expect(mod.initRateLimiters()).resolves.toBeUndefined();

    expect(typeof mod.authLimiter).toBe('function');
    expect(typeof mod.aiLimiter).toBe('function');
    expect(typeof mod.generalLimiter).toBe('function');
  });

  it('applies a stricter threshold to authLimiter (10/15min) than generalLimiter (100/min)', async () => {
    const mod = freshRequire<typeof import('../rateLimit')>('../rateLimit');
    await mod.initRateLimiters();

    const app = express();
    app.get('/auth', mod.authLimiter, (_req, res) => res.json({ ok: true }));
    app.get('/general', mod.generalLimiter, (_req, res) => res.json({ ok: true }));

    // authLimiter allows 10 requests, then blocks the 11th.
    for (let i = 0; i < 10; i++) {
      // eslint-disable-next-line no-await-in-loop
      const res = await request(app).get('/auth');
      expect(res.status).toBe(200);
    }
    const authBlocked = await request(app).get('/auth');
    expect(authBlocked.status).toBe(429);

    // generalLimiter allows well beyond 10 requests in the same window.
    for (let i = 0; i < 10; i++) {
      // eslint-disable-next-line no-await-in-loop
      const res = await request(app).get('/general');
      expect(res.status).toBe(200);
    }
  });
});

describe('429 response body', () => {
  it('returns the structured JSON error body once the auth limiter threshold is exceeded', async () => {
    const mod = freshRequire<typeof import('../rateLimit')>('../rateLimit');
    await mod.initRateLimiters();

    const app = express();
    app.get('/auth', mod.authLimiter, (_req, res) => res.json({ ok: true }));

    for (let i = 0; i < 10; i++) {
      // eslint-disable-next-line no-await-in-loop
      await request(app).get('/auth');
    }
    const blocked = await request(app).get('/auth');

    expect(blocked.status).toBe(429);
    expect(blocked.body).toMatchObject({
      success: false,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please slow down and try again later.',
    });
    expect(typeof blocked.body.retryAfter).toBe('number');
    expect(typeof blocked.body.timestamp).toBe('string');
    expect(() => new Date(blocked.body.timestamp).toISOString()).not.toThrow();
  });
});

describe('resetLimiters', () => {
  it('clears in-memory counters so a previously blocked client can succeed again', async () => {
    const mod = freshRequire<typeof import('../rateLimit')>('../rateLimit');
    await mod.initRateLimiters();

    const app = express();
    app.get('/auth', mod.authLimiter, (_req, res) => res.json({ ok: true }));

    for (let i = 0; i < 10; i++) {
      // eslint-disable-next-line no-await-in-loop
      await request(app).get('/auth');
    }
    const blocked = await request(app).get('/auth');
    expect(blocked.status).toBe(429);

    mod.resetLimiters();

    const afterReset = await request(app).get('/auth');
    expect(afterReset.status).toBe(200);
  });

  it('is a no-op that does not throw when called before any limiter has been initialized', () => {
    const mod = freshRequire<typeof import('../rateLimit')>('../rateLimit');
    expect(() => mod.resetLimiters()).not.toThrow();
  });
});
