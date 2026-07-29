/**
 * socialQueue.ts unit tests (issue #1238).
 *
 * Covers queue creation options (rate-limit friendly retry/backoff) and
 * wiring of each helper to queueManager / the shared enqueue utility.
 */

jest.mock('../queueManager', () => ({
  queueManager: {
    createQueue: jest.fn((name: string, opts: unknown) => ({ name, opts })),
    addJob: jest.fn().mockResolvedValue('job-id'),
    getQueueStats: jest
      .fn()
      .mockResolvedValue({ waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 }),
    getFailedJobs: jest.fn().mockResolvedValue([]),
    retryJob: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../lib/traceContext', () => ({
  captureTraceContext: jest.fn(() => ({ traceparent: '00-fixed-trace-01' })),
}));

import { queueManager } from '../queueManager';
import {
  SOCIAL_QUEUE_NAME,
  SocialJobData,
  enqueueSocialJob,
  scheduleSocialPost,
  getSocialQueueStats,
  getFailedSocialJobs,
  retryFailedSocialJob,
} from '../socialQueue';

// Captured immediately: the queue is created once at module load time, before
// any beforeEach runs, so we snapshot the call args here.
const createQueueCallsAtLoad = (queueManager.createQueue as jest.Mock).mock.calls.slice();

const basePost: SocialJobData = {
  type: 'publish-post',
  platform: 'twitter',
  userId: 'user-1',
  payload: { content: 'hello world' },
};

beforeEach(() => {
  (queueManager.addJob as jest.Mock).mockClear();
  (queueManager.getQueueStats as jest.Mock).mockClear();
  (queueManager.getFailedJobs as jest.Mock).mockClear();
  (queueManager.retryJob as jest.Mock).mockClear();
});

describe('socialQueue creation', () => {
  it('is created with rate-limit friendly retry/backoff and retention settings', () => {
    expect(createQueueCallsAtLoad).toHaveLength(1);
    const [name, options] = createQueueCallsAtLoad[0];

    expect(name).toBe(SOCIAL_QUEUE_NAME);
    expect(options).toMatchObject({
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    });
  });
});

describe('enqueueSocialJob', () => {
  it('enqueues the job under its type as the job name, with trace context attached', async () => {
    const id = await enqueueSocialJob(basePost);

    expect(id).toBe('job-id');
    expect(queueManager.addJob).toHaveBeenCalledWith(
      SOCIAL_QUEUE_NAME,
      'publish-post',
      expect.objectContaining({ ...basePost, traceContext: { traceparent: '00-fixed-trace-01' } }),
      expect.objectContaining({ priority: 2 }),
    );
  });

  it('honors a custom priority', async () => {
    await enqueueSocialJob(basePost, 1);

    const [, , , opts] = (queueManager.addJob as jest.Mock).mock.calls[0];
    expect(opts.priority).toBe(1);
  });
});

describe('scheduleSocialPost', () => {
  it('schedules the post with a positive computed delay for a future time', async () => {
    const at = new Date(Date.now() + 60_000);

    await scheduleSocialPost(basePost, at);

    const [queueName, jobName, , opts] = (queueManager.addJob as jest.Mock).mock.calls[0];
    expect(queueName).toBe(SOCIAL_QUEUE_NAME);
    expect(jobName).toBe('publish-post');
    expect(opts.delay).toBeGreaterThan(0);
  });

  it('rejects scheduling a post in the past', async () => {
    const at = new Date(Date.now() - 60_000);

    await expect(scheduleSocialPost(basePost, at)).rejects.toThrow(/future/i);
    expect(queueManager.addJob).not.toHaveBeenCalled();
  });
});

describe('read helpers', () => {
  it('getSocialQueueStats delegates to queueManager.getQueueStats', async () => {
    await getSocialQueueStats();
    expect(queueManager.getQueueStats).toHaveBeenCalledWith(SOCIAL_QUEUE_NAME);
  });

  it('getFailedSocialJobs delegates with the given range', async () => {
    await getFailedSocialJobs(2, 8);
    expect(queueManager.getFailedJobs).toHaveBeenCalledWith(SOCIAL_QUEUE_NAME, 2, 8);
  });

  it('retryFailedSocialJob delegates to queueManager.retryJob', async () => {
    await retryFailedSocialJob('job-9');
    expect(queueManager.retryJob).toHaveBeenCalledWith(SOCIAL_QUEUE_NAME, 'job-9');
  });
});
