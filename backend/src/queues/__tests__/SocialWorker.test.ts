/**
 * SocialWorker.ts unit tests (issue #1238).
 *
 * Covers the platform-agnostic retry/backoff worker: Retry-After /
 * x-rate-limit-reset header parsing, exponential fallback backoff on
 * network errors and unheadered 429s, exhaustion into a RateLimitError,
 * and non-retryable error handling.
 *
 * All tests use tiny backoff/maxDelay values so retries resolve in
 * milliseconds instead of exercising the real multi-second/minute delays.
 */

import { createSocialWorker, extractRetryDelay, SocialWorkerJob } from '../SocialWorker';
import { RateLimitError } from '../../lib/errors';

function makeResponse(opts: {
  ok?: boolean;
  status?: number;
  headers?: Record<string, string>;
  text?: string;
}): Response {
  return {
    ok: opts.ok ?? true,
    status: opts.status ?? 200,
    headers: new Headers(opts.headers || {}),
    text: jest.fn().mockResolvedValue(opts.text ?? ''),
  } as unknown as Response;
}

describe('extractRetryDelay', () => {
  it('parses a numeric Retry-After header as seconds', () => {
    expect(extractRetryDelay(new Headers({ 'retry-after': '2' }))).toBe(2000);
  });

  it('parses an HTTP-date Retry-After header as a positive delay', () => {
    const future = new Date(Date.now() + 5000).toUTCString();
    const delay = extractRetryDelay(new Headers({ 'retry-after': future }));

    expect(delay).not.toBeNull();
    expect(delay as number).toBeGreaterThan(0);
  });

  it('parses x-rate-limit-reset as a unix timestamp when epoch-scale', () => {
    const resetAt = Math.floor((Date.now() + 10_000) / 1000);
    const delay = extractRetryDelay(new Headers({ 'x-rate-limit-reset': String(resetAt) }));

    expect(delay).not.toBeNull();
    expect(delay as number).toBeGreaterThan(0);
  });

  it('parses x-rate-limit-reset as a seconds-delta when not epoch-scale', () => {
    expect(extractRetryDelay(new Headers({ 'x-rate-limit-reset': '5' }))).toBe(5000);
  });

  it('returns null when neither header is present', () => {
    expect(extractRetryDelay(new Headers())).toBeNull();
  });
});

describe('createSocialWorker().run', () => {
  it('returns the transformed result on the first successful attempt', async () => {
    const worker = createSocialWorker();
    const execute = jest.fn().mockResolvedValue(makeResponse({ ok: true }));
    const transform = jest.fn().mockResolvedValue({ id: 'ok' });

    const result = await worker.run({ id: 'job-1', execute, transform } as SocialWorkerJob<unknown>);

    expect(result).toEqual({ jobId: 'job-1', result: { id: 'ok' }, attempts: 1 });
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('retries after a network error using fallback exponential backoff', async () => {
    const worker = createSocialWorker({ maxAttempts: 3, fallbackBackoffMs: 1, maxDelayMs: 5 });
    const execute = jest
      .fn()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(makeResponse({ ok: true }));
    const transform = jest.fn().mockResolvedValue('done');

    const result = await worker.run({ id: 'job-2', execute, transform } as SocialWorkerJob<unknown>);

    expect(result).toEqual({ jobId: 'job-2', result: 'done', attempts: 2 });
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it('honors the platform Retry-After delay on a 429 before succeeding', async () => {
    const worker = createSocialWorker({ maxAttempts: 3, fallbackBackoffMs: 1, maxDelayMs: 5 });
    const execute = jest
      .fn()
      .mockResolvedValueOnce(
        makeResponse({ ok: false, status: 429, headers: { 'retry-after': '1' } }),
      )
      .mockResolvedValueOnce(makeResponse({ ok: true }));
    const transform = jest.fn().mockResolvedValue('done');

    const result = await worker.run({ id: 'job-3', execute, transform } as SocialWorkerJob<unknown>);

    expect(result.result).toBe('done');
    expect(result.attempts).toBe(2);
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it('falls back to exponential backoff on a 429 with no platform delay header', async () => {
    const worker = createSocialWorker({ maxAttempts: 3, fallbackBackoffMs: 1, maxDelayMs: 5 });
    const execute = jest
      .fn()
      .mockResolvedValueOnce(makeResponse({ ok: false, status: 429 }))
      .mockResolvedValueOnce(makeResponse({ ok: true }));
    const transform = jest.fn().mockResolvedValue('done');

    const result = await worker.run({ id: 'job-4', execute, transform } as SocialWorkerJob<unknown>);

    expect(result.result).toBe('done');
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it('returns a RateLimitError after exhausting attempts on sustained 429s', async () => {
    const worker = createSocialWorker({ maxAttempts: 2, fallbackBackoffMs: 1, maxDelayMs: 5 });
    const execute = jest
      .fn()
      .mockResolvedValue(makeResponse({ ok: false, status: 429, headers: { 'retry-after': '1' } }));
    const transform = jest.fn();

    const result = await worker.run({ id: 'job-5', execute, transform } as SocialWorkerJob<unknown>);

    expect(result.error).toBeInstanceOf(RateLimitError);
    expect(result.attempts).toBe(2);
    expect(transform).not.toHaveBeenCalled();
  });

  it('returns immediately (no retry) on a non-retryable error status', async () => {
    const worker = createSocialWorker({ maxAttempts: 5 });
    const execute = jest
      .fn()
      .mockResolvedValue(makeResponse({ ok: false, status: 500, text: 'server exploded' }));
    const transform = jest.fn();

    const result = await worker.run({ id: 'job-6', execute, transform } as SocialWorkerJob<unknown>);

    expect(execute).toHaveBeenCalledTimes(1);
    expect(result.error?.message).toMatch(/500/);
    expect(result.error?.message).toMatch(/server exploded/);
    expect(result.attempts).toBe(1);
  });

  it('returns the transform error when transform throws after a successful response', async () => {
    const worker = createSocialWorker();
    const execute = jest.fn().mockResolvedValue(makeResponse({ ok: true }));
    const transform = jest.fn().mockRejectedValue(new Error('bad payload'));

    const result = await worker.run({ id: 'job-7', execute, transform } as SocialWorkerJob<unknown>);

    expect(result.error?.message).toBe('bad payload');
    expect(result.attempts).toBe(1);
  });
});
