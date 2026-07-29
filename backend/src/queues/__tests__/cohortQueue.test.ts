/**
 * cohortQueue.test.ts — coverage for the cohort-recompute queue (issue #1239).
 *
 * queueManager is mocked so this suite never touches a real Redis/BullMQ
 * connection.
 */

jest.mock('../queueManager', () => ({
  queueManager: {
    createQueue: jest.fn(() => ({ name: 'cohort' })),
    addJob: jest.fn().mockResolvedValue('job-id'),
    getQueueStats: jest.fn().mockResolvedValue({
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
    }),
  },
}));

import {
  COHORT_QUEUE_NAME,
  cohortQueue,
  enqueueCohortCompute,
  scheduleDailyCohortJob,
  scheduleWeeklyCohortJob,
  getCohortQueueStats,
} from '../cohortQueue';
import { queueManager } from '../queueManager';

const mockCreateQueue = queueManager.createQueue as jest.Mock;
const mockAddJob = queueManager.addJob as jest.Mock;

// NOTE: createQueue() runs once at module load time (via the imports above);
// its call history is intentionally left untouched by beforeEach so the
// "queue creation" test below can inspect that one-time call.
beforeEach(() => {
  mockAddJob.mockClear().mockResolvedValue('job-id');
  (queueManager.getQueueStats as jest.Mock).mockClear();
});

describe('cohortQueue — queue creation', () => {
  it('creates the queue with retry/backoff configuration', () => {
    expect(mockCreateQueue).toHaveBeenCalledWith(
      COHORT_QUEUE_NAME,
      expect.objectContaining({
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 50,
        removeOnFail: 100,
      }),
    );
  });

  it('exports the created queue handle', () => {
    expect(cohortQueue).toBeDefined();
  });
});

describe('enqueueCohortCompute', () => {
  it('enqueues a one-off recompute with an empty payload by default', async () => {
    await enqueueCohortCompute();
    expect(mockAddJob).toHaveBeenCalledWith(COHORT_QUEUE_NAME, 'compute-cohorts', {});
  });

  it('forwards a scoped organizationId', async () => {
    await enqueueCohortCompute({ organizationId: 'org-1', triggeredBy: 'manual' });
    expect(mockAddJob).toHaveBeenCalledWith(COHORT_QUEUE_NAME, 'compute-cohorts', {
      organizationId: 'org-1',
      triggeredBy: 'manual',
    });
  });

  it('returns the job id from queueManager', async () => {
    mockAddJob.mockResolvedValueOnce('cohort-job-1');
    const id = await enqueueCohortCompute();
    expect(id).toBe('cohort-job-1');
  });
});

describe('scheduleDailyCohortJob', () => {
  it('schedules a repeating daily job at midnight UTC', async () => {
    await scheduleDailyCohortJob();
    expect(mockAddJob).toHaveBeenCalledWith(
      COHORT_QUEUE_NAME,
      'compute-cohorts',
      { triggeredBy: 'daily' },
      { repeat: { pattern: '0 0 * * *' } },
    );
  });
});

describe('scheduleWeeklyCohortJob', () => {
  it('schedules a repeating weekly job on Monday at 1 AM UTC', async () => {
    await scheduleWeeklyCohortJob();
    expect(mockAddJob).toHaveBeenCalledWith(
      COHORT_QUEUE_NAME,
      'compute-cohorts',
      { triggeredBy: 'weekly' },
      { repeat: { pattern: '0 1 * * 1' } },
    );
  });
});

describe('getCohortQueueStats', () => {
  it('delegates to queueManager.getQueueStats for the cohort queue', async () => {
    await getCohortQueueStats();
    expect(queueManager.getQueueStats).toHaveBeenCalledWith(COHORT_QUEUE_NAME);
  });
});
