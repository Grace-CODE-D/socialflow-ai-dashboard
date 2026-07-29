/**
 * twitterWebhookQueue.ts unit tests (issue #1238).
 *
 * Covers queue creation options (retry/backoff, retention), the worker's
 * concurrency and failure-handler wiring, event dispatch, and the raw
 * Twitter Account Activity payload → internal job mapping.
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

const dispatchEvent = jest.fn();
jest.mock('../../services/WebhookDispatcher', () => ({ dispatchEvent }));

import {
  twitterWebhookQueue,
  startTwitterWebhookWorker,
  mapTwitterEvent,
} from '../twitterWebhookQueue';

interface FakeWorkerHandle {
  name: string;
  opts: { concurrency?: number };
  handlers: Record<string, Array<(...args: unknown[]) => unknown>>;
  processor: (job: unknown) => Promise<unknown>;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('twitterWebhookQueue creation', () => {
  it('is created with retry/backoff and retention settings', () => {
    const queue = twitterWebhookQueue as unknown as {
      name: string;
      opts: { defaultJobOptions: unknown };
    };

    expect(queue.name).toBe('twitter-webhook-events');
    expect(queue.opts.defaultJobOptions).toEqual({
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 200,
      removeOnFail: 500,
    });
  });
});

describe('startTwitterWebhookWorker', () => {
  it('creates a worker on the twitter-webhook-events queue with concurrency 5', () => {
    const worker = startTwitterWebhookWorker() as unknown as FakeWorkerHandle;

    expect(worker.name).toBe('twitter-webhook-events');
    expect(worker.opts.concurrency).toBe(5);
  });

  it("wires a 'failed' handler that does not throw", () => {
    const worker = startTwitterWebhookWorker() as unknown as FakeWorkerHandle;

    expect(worker.handlers.failed).toHaveLength(1);
    expect(() => worker.handlers.failed[0]({ id: 'job-1' }, new Error('boom'))).not.toThrow();
  });

  it('dispatches the event to internal webhook subscribers', async () => {
    const worker = startTwitterWebhookWorker() as unknown as FakeWorkerHandle;
    const job = {
      id: 'job-1',
      data: {
        eventType: 'twitter.follow',
        payload: { source: { id: '123' } },
        receivedAt: '2026-07-29T00:00:00.000Z',
      },
    };

    await worker.processor(job);

    expect(dispatchEvent).toHaveBeenCalledWith(
      'twitter.follow',
      { source: { id: '123' } },
      'twitter',
    );
  });
});

describe('mapTwitterEvent', () => {
  it('maps follow_events to twitter.follow, distinguishing unfollow', () => {
    const jobs = mapTwitterEvent({
      follow_events: [{ type: 'follow' }, { type: 'unfollow' }],
    });

    expect(jobs).toHaveLength(2);
    expect(jobs[0].eventType).toBe('twitter.follow');
    expect(jobs[1].eventType).toBe('twitter.unfollow');
  });

  it('maps tweet_create_events to twitter.mention', () => {
    const jobs = mapTwitterEvent({
      tweet_create_events: [{ entities: { user_mentions: [{ id: 1 }] } }],
    });

    expect(jobs).toHaveLength(1);
    expect(jobs[0].eventType).toBe('twitter.mention');
  });

  it('maps favorite_events to twitter.like', () => {
    const jobs = mapTwitterEvent({ favorite_events: [{ id: 'fav-1' }] });

    expect(jobs).toHaveLength(1);
    expect(jobs[0].eventType).toBe('twitter.like');
  });

  it('maps direct_message_events to twitter.dm', () => {
    const jobs = mapTwitterEvent({ direct_message_events: [{ id: 'dm-1' }] });

    expect(jobs).toHaveLength(1);
    expect(jobs[0].eventType).toBe('twitter.dm');
  });

  it('maps tweet_delete_events to twitter.tweet_delete', () => {
    const jobs = mapTwitterEvent({ tweet_delete_events: [{ id: 'del-1' }] });

    expect(jobs).toHaveLength(1);
    expect(jobs[0].eventType).toBe('twitter.tweet_delete');
  });

  it('returns an empty array for an unrecognized payload', () => {
    expect(mapTwitterEvent({})).toEqual([]);
  });

  it('stamps every mapped job with the same receivedAt timestamp', () => {
    const jobs = mapTwitterEvent({
      favorite_events: [{ id: 'fav-1' }],
      direct_message_events: [{ id: 'dm-1' }],
    });

    expect(jobs[0].receivedAt).toBe(jobs[1].receivedAt);
  });
});
