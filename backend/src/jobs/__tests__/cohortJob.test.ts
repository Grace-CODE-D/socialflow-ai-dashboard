/**
 * cohortJob unit tests (issue #1235).
 *
 * Verifies the job processor calls CohortService.computeCohorts with the
 * expected arguments, handles rejection, and covers the Monday
 * daily/weekly hand-off behavior.
 */

jest.mock('../../services/CohortService', () => ({
  cohortService: {
    computeCohorts: jest.fn(),
    invalidateCache: jest.fn(),
  },
}));

jest.mock('../../queues/queueManager', () => ({
  redisClient: {
    exists: jest.fn(),
    set: jest.fn(),
  },
}));

import { Job } from 'bullmq';
import {
  processCohortJob,
  dailyCompleteKey,
  isMonday,
} from '../cohortJob';
import { cohortService } from '../../services/CohortService';
import { redisClient } from '../../queues/queueManager';
import { CohortJobData } from '../../queues/cohortQueue';

function makeJob(data: Partial<CohortJobData> = {}): Job<CohortJobData> {
  return {
    id: 'job-1',
    data: { triggeredBy: 'manual', ...data },
  } as unknown as Job<CohortJobData>;
}

const mockResult = {
  totalUsers: 42,
  segments: [
    { cohort: 'power', count: 10 },
    { cohort: 'casual', count: 32 },
  ],
  computedAt: new Date('2026-01-01T00:00:00.000Z'),
};

beforeEach(() => {
  jest.clearAllMocks();
  (cohortService.computeCohorts as jest.Mock).mockResolvedValue(mockResult);
  (redisClient.exists as jest.Mock).mockResolvedValue(0);
  (redisClient.set as jest.Mock).mockResolvedValue('OK');
});

describe('processCohortJob', () => {
  it('invalidates the cache then computes cohorts for the given organization', async () => {
    const job = makeJob({ organizationId: 'org-1', triggeredBy: 'manual' });

    await processCohortJob(job);

    expect(cohortService.invalidateCache).toHaveBeenCalledWith('org-1');
    expect(cohortService.computeCohorts).toHaveBeenCalledWith('org-1');
  });

  it('returns a summary with job metadata and the computed segments', async () => {
    const job = makeJob({ organizationId: 'org-1' });

    const summary = (await processCohortJob(job)) as Record<string, unknown>;

    expect(summary).toMatchObject({
      jobId: 'job-1',
      triggeredBy: 'manual',
      organizationId: 'org-1',
      totalUsers: 42,
      segments: [
        { cohort: 'power', count: 10 },
        { cohort: 'casual', count: 32 },
      ],
      computedAt: mockResult.computedAt.toISOString(),
    });
  });

  it('defaults organizationId to "global" when the job omits it', async () => {
    const job = makeJob({});

    const summary = (await processCohortJob(job)) as Record<string, unknown>;

    expect(summary.organizationId).toBe('global');
    expect(cohortService.computeCohorts).toHaveBeenCalledWith(undefined);
  });

  it('propagates rejection from CohortService.computeCohorts', async () => {
    (cohortService.computeCohorts as jest.Mock).mockRejectedValueOnce(new Error('db down'));
    const job = makeJob({ organizationId: 'org-1' });

    await expect(processCohortJob(job)).rejects.toThrow('db down');
  });

  it('writes the daily-complete redis key with a 2 hour TTL after a daily-triggered run', async () => {
    const now = new Date('2026-07-27T00:05:00.000Z');
    const job = makeJob({ triggeredBy: 'daily' });

    await processCohortJob(job, now);

    expect(redisClient.set).toHaveBeenCalledWith(dailyCompleteKey(now), '1', 'EX', 7_200);
  });

  it('does not write the daily-complete key for manual or weekly runs', async () => {
    const job = makeJob({ triggeredBy: 'manual' });

    await processCohortJob(job, new Date('2026-07-27T00:05:00.000Z'));

    expect(redisClient.set).not.toHaveBeenCalled();
  });
});

describe('processCohortJob — weekly/Monday hand-off', () => {
  it('waits for and proceeds once the daily-complete key appears', async () => {
    (redisClient.exists as jest.Mock).mockResolvedValueOnce(0).mockResolvedValueOnce(1);
    const monday = new Date('2026-07-27T01:00:00.000Z');
    const job = makeJob({ triggeredBy: 'weekly' });

    const summary = (await processCohortJob(job, monday, { pollMs: 1, timeoutMs: 200 })) as Record<
      string,
      unknown
    >;

    expect(redisClient.exists).toHaveBeenCalledWith(dailyCompleteKey(monday));
    expect(cohortService.computeCohorts).toHaveBeenCalled();
    expect(summary.triggeredBy).toBe('weekly');
  });

  it('throws when the daily job never completes before the timeout, without computing cohorts', async () => {
    (redisClient.exists as jest.Mock).mockResolvedValue(0);
    const monday = new Date('2026-07-27T01:00:00.000Z');
    const job = makeJob({ triggeredBy: 'weekly' });

    await expect(
      processCohortJob(job, monday, { pollMs: 5, timeoutMs: 20 }),
    ).rejects.toThrow(/timed out waiting for daily job/i);
    expect(cohortService.computeCohorts).not.toHaveBeenCalled();
  });

  it('does not wait when triggeredBy is weekly but the date is not a Monday', async () => {
    const tuesday = new Date('2026-07-28T01:00:00.000Z');
    const job = makeJob({ triggeredBy: 'weekly' });

    await processCohortJob(job, tuesday);

    expect(redisClient.exists).not.toHaveBeenCalled();
    expect(cohortService.computeCohorts).toHaveBeenCalled();
  });
});

describe('isMonday', () => {
  it('returns true for a UTC Monday', () => {
    expect(isMonday(new Date('2026-07-27T00:00:00.000Z'))).toBe(true);
  });

  it('returns false for a non-Monday', () => {
    expect(isMonday(new Date('2026-07-28T00:00:00.000Z'))).toBe(false);
  });
});

describe('dailyCompleteKey', () => {
  it('formats the key using the UTC date portion', () => {
    expect(dailyCompleteKey(new Date('2026-07-27T23:59:59.000Z'))).toBe(
      'cohort:daily-complete:2026-07-27',
    );
  });
});
