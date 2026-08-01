/**
 * syncQueue.ts unit tests (issue #1238).
 *
 * Covers queue creation options (batch-processing retry/backoff) and the
 * priority/idempotency wiring of each helper to queueManager.
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
  },
}));

import { queueManager } from '../queueManager';
import {
  SYNC_QUEUE_NAME,
  ContractSyncJobData,
  syncAccount,
  syncTransactions,
  syncBalances,
  fullSync,
  syncContract,
  deployContract,
  batchSyncAccounts,
  schedulePeriodicSync,
  getSyncQueueStats,
  getFailedSyncJobs,
  getWaitingSyncJobs,
  retryFailedSync,
} from '../syncQueue';

// Captured immediately: the queue is created once at module load time, before
// any beforeEach runs, so we snapshot the call args here.
const createQueueCallsAtLoad = (queueManager.createQueue as jest.Mock).mock.calls.slice();

beforeEach(() => {
  (queueManager.addJob as jest.Mock).mockClear();
  (queueManager.addBulkJobs as jest.Mock).mockClear();
  (queueManager.getQueueStats as jest.Mock).mockClear();
  (queueManager.getFailedJobs as jest.Mock).mockClear();
  (queueManager.getWaitingJobs as jest.Mock).mockClear();
  (queueManager.retryJob as jest.Mock).mockClear();
});

describe('syncQueue creation', () => {
  it('is created with batch-processing retry/backoff and retention settings', () => {
    expect(createQueueCallsAtLoad).toHaveLength(1);
    const [name, options] = createQueueCallsAtLoad[0];

    expect(name).toBe(SYNC_QUEUE_NAME);
    expect(options).toMatchObject({
      attempts: 3,
      backoff: { type: 'exponential', delay: 3000 },
      removeOnComplete: 50,
      removeOnFail: 100,
    });
  });
});

describe('job helpers — priority wiring', () => {
  it('syncAccount enqueues an account sync at priority 2', async () => {
    await syncAccount('acct-1', { userId: 'u1' });

    expect(queueManager.addJob).toHaveBeenCalledWith(
      SYNC_QUEUE_NAME,
      'sync-account',
      { type: 'account', accountId: 'acct-1', metadata: { userId: 'u1' } },
      { priority: 2 },
    );
  });

  it('syncTransactions enqueues a transactions sync at priority 2 with block range', async () => {
    await syncTransactions('acct-1', 100, 200);

    expect(queueManager.addJob).toHaveBeenCalledWith(
      SYNC_QUEUE_NAME,
      'sync-transactions',
      { type: 'transactions', accountId: 'acct-1', startBlock: 100, endBlock: 200, metadata: undefined },
      { priority: 2 },
    );
  });

  it('syncBalances enqueues a balances sync at high priority (1)', async () => {
    await syncBalances('acct-1');

    const [, , , opts] = (queueManager.addJob as jest.Mock).mock.calls[0];
    expect(opts.priority).toBe(1);
  });

  it('fullSync enqueues a full sync at low priority (3)', async () => {
    await fullSync('acct-1');

    const [, , , opts] = (queueManager.addJob as jest.Mock).mock.calls[0];
    expect(opts.priority).toBe(3);
  });

  it('syncContract enqueues at priority 2', async () => {
    const data: ContractSyncJobData = {
      contractId: 'c1',
      contractType: 'campaign',
      action: 'sync',
    };

    await syncContract(data);

    expect(queueManager.addJob).toHaveBeenCalledWith(SYNC_QUEUE_NAME, 'sync-contract', data, {
      priority: 2,
    });
  });
});

describe('deployContract — deterministic idempotency key', () => {
  const data: ContractSyncJobData = {
    contractId: 'c1',
    contractType: 'campaign',
    action: 'deploy',
    metadata: { deployer: 'alice', network: 'mainnet' },
  };

  it('derives a stable jobId from contract metadata', async () => {
    await deployContract(data);

    const [, , , opts] = (queueManager.addJob as jest.Mock).mock.calls[0];
    expect(opts.jobId).toBe('deploy-campaign-c1-alice-mainnet');
    expect(opts.priority).toBe(1);
  });

  it('produces the same jobId across repeated calls with the same data, preventing duplicate deployments', async () => {
    await deployContract(data);
    await deployContract(data);

    const [firstJobId] = [(queueManager.addJob as jest.Mock).mock.calls[0][3].jobId];
    const [secondJobId] = [(queueManager.addJob as jest.Mock).mock.calls[1][3].jobId];
    expect(firstJobId).toBe(secondJobId);
  });

  it('falls back to "unknown"/"default" when deployer/network metadata is absent', async () => {
    await deployContract({ contractId: 'c2', contractType: 'nft', action: 'deploy' });

    const [, , , opts] = (queueManager.addJob as jest.Mock).mock.calls[0];
    expect(opts.jobId).toBe('deploy-nft-c2-unknown-default');
  });
});

describe('batchSyncAccounts', () => {
  it('submits an account sync job per account id at low priority', async () => {
    const jobIds = await batchSyncAccounts(['a1', 'a2']);

    expect(jobIds).toEqual(['id-1', 'id-2']);
    expect(queueManager.addBulkJobs).toHaveBeenCalledWith(SYNC_QUEUE_NAME, [
      { name: 'sync-account', data: { type: 'account', accountId: 'a1' }, options: { priority: 3 } },
      { name: 'sync-account', data: { type: 'account', accountId: 'a2' }, options: { priority: 3 } },
    ]);
  });
});

describe('schedulePeriodicSync', () => {
  it('enqueues a repeating job using the given cron pattern', async () => {
    await schedulePeriodicSync('nightly-full-sync', { type: 'full' }, '0 2 * * *');

    expect(queueManager.addJob).toHaveBeenCalledWith(
      SYNC_QUEUE_NAME,
      'nightly-full-sync',
      { type: 'full' },
      { repeat: { pattern: '0 2 * * *' } },
    );
  });
});

describe('read/management helpers', () => {
  it('getSyncQueueStats delegates to queueManager.getQueueStats', async () => {
    await getSyncQueueStats();
    expect(queueManager.getQueueStats).toHaveBeenCalledWith(SYNC_QUEUE_NAME);
  });

  it('getFailedSyncJobs delegates with the given range', async () => {
    await getFailedSyncJobs(1, 5);
    expect(queueManager.getFailedJobs).toHaveBeenCalledWith(SYNC_QUEUE_NAME, 1, 5);
  });

  it('getWaitingSyncJobs delegates with the given range', async () => {
    await getWaitingSyncJobs(0, 3);
    expect(queueManager.getWaitingJobs).toHaveBeenCalledWith(SYNC_QUEUE_NAME, 0, 3);
  });

  it('retryFailedSync delegates to queueManager.retryJob', async () => {
    await retryFailedSync('job-5');
    expect(queueManager.retryJob).toHaveBeenCalledWith(SYNC_QUEUE_NAME, 'job-5');
  });
});
