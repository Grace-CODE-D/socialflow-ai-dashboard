/**
 * WebhookQueue.ts unit tests (issue #1237).
 *
 * Covers the queue's retention options and the worker's concurrency,
 * failure-handler wiring, and delivery processor — including the
 * "fetch secret at delivery time" behavior for rotated webhook secrets.
 */

jest.mock('bullmq', () => {
  class FakeQueue {
    public name: string;
    public opts: unknown;
    constructor(name: string, opts: unknown) {
      this.name = name;
      this.opts = opts;
    }
  }

  class FakeWorker {
    public name: string;
    public processor: (job: unknown) => unknown;
    public opts: unknown;
    public handlers: Record<string, Array<(...args: unknown[]) => unknown>> = {};

    constructor(name: string, processor: (job: unknown) => unknown, opts: unknown) {
      this.name = name;
      this.processor = processor;
      this.opts = opts;
    }

    on(event: string, cb: (...args: unknown[]) => unknown) {
      this.handlers[event] = this.handlers[event] || [];
      this.handlers[event].push(cb);
      return this;
    }
  }

  return { Queue: FakeQueue, Worker: FakeWorker };
});

jest.mock('../../config/runtime', () => ({
  getRedisConnection: jest.fn(() => ({ host: 'localhost', port: 6379 })),
}));

jest.mock('../../lib/prisma', () => ({
  prisma: {
    webhookDelivery: { findUnique: jest.fn() },
  },
}));

jest.mock('../../services/WebhookDispatcher', () => ({
  attemptDelivery: jest.fn(),
}));

import { webhookQueue, startWebhookWorker } from '../WebhookQueue';
import { prisma } from '../../lib/prisma';
import { attemptDelivery } from '../../services/WebhookDispatcher';

interface FakeWorkerHandle {
  name: string;
  opts: { concurrency?: number };
  handlers: Record<string, Array<(...args: unknown[]) => unknown>>;
  processor: (job: unknown) => Promise<unknown>;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('webhookQueue', () => {
  it('is created against the webhook-deliveries queue with a bounded retention policy', () => {
    const queue = webhookQueue as unknown as { name: string; opts: { defaultJobOptions: unknown } };

    expect(queue.name).toBe('webhook-deliveries');
    expect(queue.opts.defaultJobOptions).toEqual({
      removeOnComplete: 100,
      removeOnFail: 500,
    });
  });
});

describe('startWebhookWorker', () => {
  it('creates a worker on the webhook-deliveries queue with concurrency 10', () => {
    const worker = startWebhookWorker() as unknown as FakeWorkerHandle;

    expect(worker.name).toBe('webhook-deliveries');
    expect(worker.opts.concurrency).toBe(10);
  });

  it("wires a 'failed' handler that does not throw", () => {
    const worker = startWebhookWorker() as unknown as FakeWorkerHandle;

    expect(worker.handlers.failed).toHaveLength(1);
    expect(() => worker.handlers.failed[0]({ id: 'job-1' }, new Error('boom'))).not.toThrow();
  });

  it('fetches the current secret at delivery time and calls attemptDelivery', async () => {
    (prisma.webhookDelivery.findUnique as jest.Mock).mockResolvedValueOnce({
      subscription: { secret: 'current-secret' },
    });
    const worker = startWebhookWorker() as unknown as FakeWorkerHandle;
    const job = {
      data: { deliveryId: 'd1', url: 'https://example.com/hook', payload: '{"a":1}', attempt: 2 },
    };

    await worker.processor(job);

    expect(prisma.webhookDelivery.findUnique).toHaveBeenCalledWith({
      where: { id: 'd1' },
      select: { subscription: { select: { secret: true } } },
    });
    expect(attemptDelivery).toHaveBeenCalledWith(
      'd1',
      'https://example.com/hook',
      'current-secret',
      '{"a":1}',
      2,
    );
  });

  it('skips delivery without error when the delivery record is missing', async () => {
    (prisma.webhookDelivery.findUnique as jest.Mock).mockResolvedValueOnce(null);
    const worker = startWebhookWorker() as unknown as FakeWorkerHandle;
    const job = {
      data: { deliveryId: 'missing', url: 'https://example.com/hook', payload: '{}', attempt: 1 },
    };

    await expect(worker.processor(job)).resolves.toBeUndefined();
    expect(attemptDelivery).not.toHaveBeenCalled();
  });
});
