/**
 * payoutQueue.ts unit tests (issue #1237).
 *
 * payoutJob.ts (the processor) already has tests, but the queue definition
 * and job-scheduling helpers in payoutQueue.ts did not. Covers the queue
 * creation options and the wiring of each helper to queueManager.
 */

jest.mock('../queueManager', () => ({
  queueManager: {
    createQueue: jest.fn((name: string, opts: unknown) => ({ name, opts })),
    addJob: jest.fn().mockResolvedValue('job-id'),
    addBulkJobs: jest.fn().mockResolvedValue(['id-1', 'id-2']),
    getQueueStats: jest
      .fn()
      .mockResolvedValue({ waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 }),
    getFailedJobs: jest.fn().mockResolvedValue([]),
    getWaitingJobs: jest.fn().mockResolvedValue([]),
    retryJob: jest.fn().mockResolvedValue(undefined),
    removeJob: jest.fn().mockResolvedValue(undefined),
  },
}));

import { queueManager } from '../queueManager';
import {
  PAYOUT_QUEUE_NAME,
  PayoutJobData,
  ScheduledPayoutData,
  processPayout,
  schedulePayout,
  scheduleRecurringPayout,
  processBatchPayouts,
  getPayoutQueueStats,
  getFailedPayouts,
  getWaitingPayouts,
  retryFailedPayout,
  cancelPayout,
} from '../payoutQueue';

// Captured immediately: the queue is created once at module load time, before
// any beforeEach runs, so we snapshot the call args here.
const createQueueCallsAtLoad = (queueManager.createQueue as jest.Mock).mock.calls.slice();

const validPayout: PayoutJobData = {
  groupId: 'grp-1',
  amount: 100,
  recipient: 'alice@example.com',
  recipientType: 'paypal',
  currency: 'USD',
};

beforeEach(() => {
  (queueManager.addJob as jest.Mock).mockClear();
  (queueManager.addBulkJobs as jest.Mock).mockClear();
  (queueManager.getQueueStats as jest.Mock).mockClear();
  (queueManager.getFailedJobs as jest.Mock).mockClear();
  (queueManager.getWaitingJobs as jest.Mock).mockClear();
  (queueManager.retryJob as jest.Mock).mockClear();
  (queueManager.removeJob as jest.Mock).mockClear();
});

describe('payoutQueue creation', () => {
  it('creates the payout queue with high-reliability options', () => {
    expect(createQueueCallsAtLoad).toHaveLength(1);
    const [name, options] = createQueueCallsAtLoad[0];

    expect(name).toBe(PAYOUT_QUEUE_NAME);
    expect(options).toMatchObject({
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: false,
      removeOnFail: false,
    });
  });
});

describe('processPayout', () => {
  it('enqueues an immediate payout with high priority', async () => {
    const jobId = await processPayout(validPayout);

    expect(jobId).toBe('job-id');
    expect(queueManager.addJob).toHaveBeenCalledWith(
      PAYOUT_QUEUE_NAME,
      'process-payout',
      validPayout,
      { priority: 1 },
    );
  });
});

describe('schedulePayout', () => {
  it('enqueues a future payout with a positive computed delay and lower priority', async () => {
    const future = new Date(Date.now() + 60_000);

    const jobId = await schedulePayout(validPayout, future);

    expect(jobId).toBe('job-id');
    expect(queueManager.addJob).toHaveBeenCalledTimes(1);
    const [queueName, jobName, data, options] = (queueManager.addJob as jest.Mock).mock.calls[0];
    expect(queueName).toBe(PAYOUT_QUEUE_NAME);
    expect(jobName).toBe('process-payout');
    expect(data).toBe(validPayout);
    expect(options.priority).toBe(2);
    expect(options.delay).toBeGreaterThan(0);
  });

  it('rejects scheduling a payout in the past', async () => {
    const past = new Date(Date.now() - 60_000);

    await expect(schedulePayout(validPayout, past)).rejects.toThrow(/future/i);
    expect(queueManager.addJob).not.toHaveBeenCalled();
  });
});

describe('scheduleRecurringPayout', () => {
  it('throws when no recurring configuration is provided', async () => {
    const data = { ...validPayout, scheduledFor: new Date() } as ScheduledPayoutData;

    await expect(scheduleRecurringPayout(data)).rejects.toThrow(/recurring configuration/i);
  });

  it('schedules a single daily job with a generated cron expression within the window', async () => {
    const scheduledFor = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const endDate = new Date(scheduledFor.getTime() + 12 * 60 * 60 * 1000); // 12h window — fits exactly one daily run
    const data: ScheduledPayoutData = {
      ...validPayout,
      scheduledFor,
      recurring: { frequency: 'daily', endDate },
    };

    const jobIds = await scheduleRecurringPayout(data);

    expect(jobIds).toEqual(['job-id']);
    expect(queueManager.addJob).toHaveBeenCalledTimes(1);
    const [, , , options] = (queueManager.addJob as jest.Mock).mock.calls[0];
    expect(options.priority).toBe(2);
    expect(options.repeat.cron).toMatch(/^\d+ \d+ \* \* \*$/);
  });

  it('does not set a repeat option for non-daily frequencies', async () => {
    const scheduledFor = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const endDate = new Date(scheduledFor.getTime() + 1000); // window shorter than the weekly interval
    const data: ScheduledPayoutData = {
      ...validPayout,
      scheduledFor,
      recurring: { frequency: 'weekly', endDate },
    };

    await scheduleRecurringPayout(data);

    expect(queueManager.addJob).toHaveBeenCalledTimes(1);
    const [, , , options] = (queueManager.addJob as jest.Mock).mock.calls[0];
    expect(options.repeat).toBeUndefined();
  });
});

describe('processBatchPayouts', () => {
  it('submits all payouts as bulk jobs with high priority', async () => {
    const payouts = [validPayout, { ...validPayout, recipient: 'bob@example.com' }];

    const jobIds = await processBatchPayouts(payouts);

    expect(jobIds).toEqual(['id-1', 'id-2']);
    expect(queueManager.addBulkJobs).toHaveBeenCalledWith(
      PAYOUT_QUEUE_NAME,
      payouts.map((payout) => ({
        name: 'process-payout',
        data: payout,
        options: { priority: 1 },
      })),
    );
  });
});

describe('read/management helpers', () => {
  it('getPayoutQueueStats delegates to queueManager.getQueueStats', async () => {
    await getPayoutQueueStats();
    expect(queueManager.getQueueStats).toHaveBeenCalledWith(PAYOUT_QUEUE_NAME);
  });

  it('getFailedPayouts delegates with the given range', async () => {
    await getFailedPayouts(5, 15);
    expect(queueManager.getFailedJobs).toHaveBeenCalledWith(PAYOUT_QUEUE_NAME, 5, 15);
  });

  it('getWaitingPayouts delegates with the given range', async () => {
    await getWaitingPayouts(1, 2);
    expect(queueManager.getWaitingJobs).toHaveBeenCalledWith(PAYOUT_QUEUE_NAME, 1, 2);
  });

  it('retryFailedPayout delegates to queueManager.retryJob', async () => {
    await retryFailedPayout('job-42');
    expect(queueManager.retryJob).toHaveBeenCalledWith(PAYOUT_QUEUE_NAME, 'job-42');
  });

  it('cancelPayout delegates to queueManager.removeJob', async () => {
    await cancelPayout('job-42');
    expect(queueManager.removeJob).toHaveBeenCalledWith(PAYOUT_QUEUE_NAME, 'job-42');
  });
});
