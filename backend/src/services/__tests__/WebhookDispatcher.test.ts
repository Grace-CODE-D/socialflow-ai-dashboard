import { attemptDelivery, assertSafeUrl, dispatchEvent, retryPendingDeliveries } from '../WebhookDispatcher';
import { encryptWebhookSecret } from '../../lib/webhookSecretCrypto';

// ── Mocks ──────────────────────────────────────────────────────────────────

jest.mock('../../lib/prisma', () => ({
  prisma: {
    webhookSubscription: { findMany: jest.fn() },
    webhookDelivery: { create: jest.fn(), update: jest.fn(), findMany: jest.fn() },
  },
}));

// createLogger must return the SAME mock instance on every call — the
// source module calls it once at import time, and tests call it again to
// grab a reference; a fresh object per call would make assertions on the
// test's reference silently never see calls made via the source's instance.
jest.mock('../../lib/logger', () => {
  const sharedLoggerMock = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
  return { createLogger: () => sharedLoggerMock };
});

const { prisma } = jest.requireMock('../../lib/prisma') as {
  prisma: {
    webhookSubscription: { findMany: jest.Mock };
    webhookDelivery: { create: jest.Mock; update: jest.Mock; findMany: jest.Mock };
  };
};

const DELIVERY_ID = 'del-1';
const URL = 'https://example.com/hook';
const SECRET = 'secret';
// Subscriptions read from prisma store the secret encrypted; attemptDelivery
// itself still takes the raw secret directly (used by tests below).
const ENCRYPTED_SECRET = encryptWebhookSecret(SECRET);
const PAYLOAD = JSON.stringify({ id: 'evt-1', version: '1.0', event: 'post.published' });

function mockFetch(ok: boolean, status = ok ? 200 : 500) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status,
    text: jest.fn().mockResolvedValue(''),
  });
}

beforeEach(() => jest.clearAllMocks());

// ── attemptDelivery ────────────────────────────────────────────────────────

describe('attemptDelivery', () => {
  it('marks delivery as success on 2xx response', async () => {
    mockFetch(true);
    prisma.webhookDelivery.update.mockResolvedValue({});

    await attemptDelivery(DELIVERY_ID, URL, SECRET, PAYLOAD, 1);

    expect(prisma.webhookDelivery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: DELIVERY_ID },
        data: expect.objectContaining({ status: 'success' }),
      }),
    );
  });

  it('schedules a retry (status=pending) on failure when below MAX_ATTEMPTS', async () => {
    mockFetch(false, 500);
    prisma.webhookDelivery.update.mockResolvedValue({});

    await attemptDelivery(DELIVERY_ID, URL, SECRET, PAYLOAD, 1);

    expect(prisma.webhookDelivery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'pending', attempts: 1 }),
      }),
    );
  });

  it('marks delivery as permanently failed after MAX_ATTEMPTS (5)', async () => {
    mockFetch(false, 500);
    prisma.webhookDelivery.update.mockResolvedValue({});

    await attemptDelivery(DELIVERY_ID, URL, SECRET, PAYLOAD, 5);

    expect(prisma.webhookDelivery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'failed', attempts: 5 }),
      }),
    );
  });

  it('marks delivery as failed when fetch throws (network error)', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network error'));
    prisma.webhookDelivery.update.mockResolvedValue({});

    await attemptDelivery(DELIVERY_ID, URL, SECRET, PAYLOAD, 5);

    expect(prisma.webhookDelivery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'failed' }),
      }),
    );
  });

  it('does not permanently fail when attempt < MAX_ATTEMPTS and fetch throws', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network error'));
    prisma.webhookDelivery.update.mockResolvedValue({});

    await attemptDelivery(DELIVERY_ID, URL, SECRET, PAYLOAD, 2);

    const call = prisma.webhookDelivery.update.mock.calls[0][0];
    expect(call.data.status).toBe('pending');
  });
});

// ── dispatchEvent ──────────────────────────────────────────────────────────

describe('dispatchEvent', () => {
  it('creates a delivery row per active subscriber and fires delivery', async () => {
    prisma.webhookSubscription.findMany.mockResolvedValue([
      { id: 'sub-1', url: URL, secret: ENCRYPTED_SECRET },
    ]);
    prisma.webhookDelivery.create.mockResolvedValue({ id: DELIVERY_ID });
    mockFetch(true);
    prisma.webhookDelivery.update.mockResolvedValue({});

    await dispatchEvent('post.published' as any, { postId: '1' });

    expect(prisma.webhookDelivery.create).toHaveBeenCalledTimes(1);
    expect(prisma.webhookDelivery.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ subscriptionId: 'sub-1', status: 'pending' }),
      }),
    );
  });

  it('does nothing when there are no active subscribers', async () => {
    prisma.webhookSubscription.findMany.mockResolvedValue([]);

    await dispatchEvent('post.published' as any, {});

    expect(prisma.webhookDelivery.create).not.toHaveBeenCalled();
  });

  it('logs an error instead of swallowing when attemptDelivery rejects unexpectedly', async () => {
    const { createLogger } = jest.requireMock('../../lib/logger') as {
      createLogger: () => { info: jest.Mock; warn: jest.Mock; error: jest.Mock };
    };
    const loggerInstance = createLogger();

    prisma.webhookSubscription.findMany.mockResolvedValue([
      { id: 'sub-2', url: URL, secret: ENCRYPTED_SECRET },
    ]);
    prisma.webhookDelivery.create.mockResolvedValue({ id: 'del-2' });
    // Make fetch throw so attemptDelivery itself throws past its own try/catch
    global.fetch = jest.fn().mockRejectedValue(new Error('catastrophic'));
    // Make prisma.update also reject so error bubbles out of attemptDelivery
    prisma.webhookDelivery.update.mockRejectedValue(new Error('db failure'));

    await dispatchEvent('post.published' as any, {});
    // Allow the fire-and-forget chain (including the real async DNS lookup
    // inside assertSafeUrl) to settle — a single setImmediate isn't enough.
    for (let i = 0; i < 50 && loggerInstance.error.mock.calls.length === 0; i++) {
      await new Promise((r) => setTimeout(r, 20));
    }

    expect(loggerInstance.error).toHaveBeenCalledWith(
      expect.stringContaining('fire-and-forget'),
      expect.objectContaining({ deliveryId: 'del-2', subscriptionId: 'sub-2' }),
    );
  });

  it('signs the outbound delivery with the decrypted raw secret, not the stored ciphertext', async () => {
    const crypto = require('crypto');

    prisma.webhookSubscription.findMany.mockResolvedValue([
      { id: 'sub-3', url: URL, secret: ENCRYPTED_SECRET },
    ]);
    prisma.webhookDelivery.create.mockResolvedValue({ id: 'del-3' });
    mockFetch(true);
    prisma.webhookDelivery.update.mockResolvedValue({});

    await dispatchEvent('post.published' as any, { postId: '1' });
    for (let i = 0; i < 50 && (global.fetch as jest.Mock).mock.calls.length === 0; i++) {
      await new Promise((r) => setTimeout(r, 20));
    }

    const [, options] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit];
    const actualBody = (
      prisma.webhookDelivery.create.mock.calls[0][0] as { data: { payload: string } }
    ).data.payload;
    const expected =
      'sha256=' + crypto.createHmac('sha256', SECRET).update(actualBody).digest('hex');

    expect((options.headers as Record<string, string>)['X-SocialFlow-Signature']).toBe(expected);
    // Sanity check: signing with the raw stored ciphertext would NOT match.
    const wrongSig =
      'sha256=' + crypto.createHmac('sha256', ENCRYPTED_SECRET).update(actualBody).digest('hex');
    expect((options.headers as Record<string, string>)['X-SocialFlow-Signature']).not.toBe(wrongSig);
  });
});

// ── assertSafeUrl (SSRF protection) ───────────────────────────────────────

describe('assertSafeUrl', () => {
  it('rejects a webhook URL pointing at the cloud metadata endpoint', async () => {
    await expect(assertSafeUrl('https://169.254.169.254/latest/meta-data/')).rejects.toThrow(
      /blocked address/,
    );
  });

  it('rejects a webhook URL pointing at loopback', async () => {
    await expect(assertSafeUrl('https://127.0.0.1/')).rejects.toThrow(/blocked address/);
  });

  it('rejects a webhook URL using a non-https scheme', async () => {
    await expect(assertSafeUrl('http://example.com/hook')).rejects.toThrow(/https/);
  });

  it('allows a webhook URL pointing at a public https address', async () => {
    await expect(assertSafeUrl('https://example.com/hook')).resolves.toBeUndefined();
  });
});

describe('attemptDelivery — SSRF re-validation at delivery time', () => {
  it('blocks delivery to the cloud metadata endpoint and marks it failed without calling fetch', async () => {
    global.fetch = jest.fn();
    prisma.webhookDelivery.update.mockResolvedValue({});

    await attemptDelivery(DELIVERY_ID, 'https://169.254.169.254/latest/meta-data/', SECRET, PAYLOAD, 1);

    expect(global.fetch).not.toHaveBeenCalled();
    expect(prisma.webhookDelivery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'failed', nextRetryAt: null }),
      }),
    );
  });

  it('blocks delivery to loopback and marks it failed without calling fetch', async () => {
    global.fetch = jest.fn();
    prisma.webhookDelivery.update.mockResolvedValue({});

    await attemptDelivery(DELIVERY_ID, 'https://127.0.0.1/hook', SECRET, PAYLOAD, 1);

    expect(global.fetch).not.toHaveBeenCalled();
    expect(prisma.webhookDelivery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'failed', nextRetryAt: null }),
      }),
    );
  });
});

// ── retryPendingDeliveries ─────────────────────────────────────────────────

describe('retryPendingDeliveries', () => {
  it('re-attempts each due delivery', async () => {
    prisma.webhookDelivery.findMany.mockResolvedValue([
      {
        id: DELIVERY_ID,
        payload: PAYLOAD,
        attempts: 1,
        subscription: { url: URL, secret: ENCRYPTED_SECRET },
      },
    ]);
    mockFetch(true);
    prisma.webhookDelivery.update.mockResolvedValue({});

    await retryPendingDeliveries();

    expect(prisma.webhookDelivery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'success' }),
      }),
    );
  });
});
