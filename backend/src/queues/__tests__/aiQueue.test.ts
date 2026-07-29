/**
 * aiQueue.test.ts — coverage for the AI generation queue (issue #1239).
 *
 * queueManager, the shared enqueue helpers, and trace-context capture are all
 * mocked so this suite never touches a real Redis/BullMQ connection.
 */

jest.mock('../queueManager', () => ({
  queueManager: {
    createQueue: jest.fn(() => ({ name: 'ai-generation' })),
    getQueueStats: jest.fn().mockResolvedValue({
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
    }),
    getFailedJobs: jest.fn().mockResolvedValue([]),
    retryJob: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../utils/queue', () => ({
  enqueue: jest.fn().mockResolvedValue('job-id'),
  enqueueAt: jest.fn().mockResolvedValue('job-id-at'),
}));

jest.mock('../../lib/traceContext', () => ({
  captureTraceContext: jest.fn(() => ({ traceparent: '00-mock-trace-00' })),
}));

import {
  AI_QUEUE_NAME,
  AIJobData,
  enqueueAIJob,
  scheduleAIJob,
  getAIQueueStats,
  getFailedAIJobs,
  retryFailedAIJob,
} from '../aiQueue';
import { queueManager } from '../queueManager';
import { enqueue, enqueueAt } from '../../utils/queue';
import { captureTraceContext } from '../../lib/traceContext';

const mockCreateQueue = queueManager.createQueue as jest.Mock;
const mockEnqueue = enqueue as jest.Mock;
const mockEnqueueAt = enqueueAt as jest.Mock;

const baseJob: AIJobData = {
  type: 'generate-caption',
  prompt: 'Write a caption',
  userId: 'user-1',
};

// NOTE: aiQueue.ts calls queueManager.createQueue() exactly once, at module
// load time (above, via the `import` statements). We intentionally never
// clear mockCreateQueue's call history so the "queue creation" assertions
// below can inspect that one-time call.
beforeEach(() => {
  mockEnqueue.mockClear().mockResolvedValue('job-id');
  mockEnqueueAt.mockClear().mockResolvedValue('job-id-at');
  (queueManager.getQueueStats as jest.Mock).mockClear();
  (queueManager.getFailedJobs as jest.Mock).mockClear();
  (queueManager.retryJob as jest.Mock).mockClear();
  (captureTraceContext as jest.Mock).mockReturnValue({ traceparent: '00-mock-trace-00' });
});

describe('aiQueue — queue creation', () => {
  it('creates the queue with high-priority retry/backoff configuration', () => {
    expect(mockCreateQueue).toHaveBeenCalledWith(
      AI_QUEUE_NAME,
      expect.objectContaining({
        attempts: 5,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 50,
        removeOnFail: 200,
      }),
    );
  });
});

describe('enqueueAIJob', () => {
  it('enqueues under the job type name with a captured trace context', async () => {
    await enqueueAIJob(baseJob);

    expect(mockEnqueue).toHaveBeenCalledWith(
      AI_QUEUE_NAME,
      'generate-caption',
      { ...baseJob, traceContext: { traceparent: '00-mock-trace-00' } },
      { priority: 1 },
    );
  });

  it('defaults to priority 1 when none is given', async () => {
    await enqueueAIJob(baseJob);
    const [, , , options] = mockEnqueue.mock.calls[0];
    expect(options.priority).toBe(1);
  });

  it('passes through a custom priority', async () => {
    await enqueueAIJob(baseJob, 5);
    const [, , , options] = mockEnqueue.mock.calls[0];
    expect(options.priority).toBe(5);
  });

  it('returns the job id from enqueue', async () => {
    mockEnqueue.mockResolvedValueOnce('specific-job-id');
    const id = await enqueueAIJob(baseJob);
    expect(id).toBe('specific-job-id');
  });
});

describe('scheduleAIJob', () => {
  it('schedules the job at the given time via enqueueAt', async () => {
    const at = new Date(Date.now() + 60_000);
    await scheduleAIJob(baseJob, at);

    expect(mockEnqueueAt).toHaveBeenCalledWith(AI_QUEUE_NAME, 'generate-caption', baseJob, at);
  });
});

describe('getAIQueueStats', () => {
  it('delegates to queueManager.getQueueStats for the AI queue', async () => {
    await getAIQueueStats();
    expect(queueManager.getQueueStats).toHaveBeenCalledWith(AI_QUEUE_NAME);
  });
});

describe('getFailedAIJobs', () => {
  it('uses default pagination when no args are given', async () => {
    await getFailedAIJobs();
    expect(queueManager.getFailedJobs).toHaveBeenCalledWith(AI_QUEUE_NAME, 0, 20);
  });

  it('forwards custom start/end pagination', async () => {
    await getFailedAIJobs(10, 30);
    expect(queueManager.getFailedJobs).toHaveBeenCalledWith(AI_QUEUE_NAME, 10, 30);
  });
});

describe('retryFailedAIJob', () => {
  it('delegates to queueManager.retryJob with the AI queue name and job id', async () => {
    await retryFailedAIJob('job-42');
    expect(queueManager.retryJob).toHaveBeenCalledWith(AI_QUEUE_NAME, 'job-42');
  });
});
