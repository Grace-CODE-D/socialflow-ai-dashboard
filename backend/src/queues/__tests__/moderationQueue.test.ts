/**
 * moderationQueue.test.ts — coverage for the moderation queue + DLQ (issue #1239).
 *
 * queueManager is mocked so this suite never touches a real Redis/BullMQ
 * connection. (Broader DLQ-transition behavior already lives in
 * __tests__/moderationDLQ.test.ts — this file focuses on this module's own
 * queue-creation contract and the wiring-gap audit called out in #1239.)
 */

import fs from 'fs';
import path from 'path';

jest.mock('../queueManager', () => ({
  queueManager: {
    createQueue: jest.fn(() => ({ name: 'moderation' })),
    addJob: jest.fn().mockResolvedValue('job-id'),
  },
}));

import {
  MODERATION_QUEUE_NAME,
  MODERATION_DLQ_NAME,
  enqueueModeration,
  enqueueToDLQ,
} from '../moderationQueue';
import { queueManager } from '../queueManager';

const mockCreateQueue = queueManager.createQueue as jest.Mock;
const mockAddJob = queueManager.addJob as jest.Mock;

// NOTE: createQueue() runs twice at module load time (main queue + DLQ), via
// the imports above; its call history is intentionally left untouched by
// beforeEach so the "queue creation" tests below can inspect those calls.
beforeEach(() => {
  mockAddJob.mockClear().mockResolvedValue('job-id');
});

describe('moderationQueue — queue creation', () => {
  it('creates the main moderation queue with retry/backoff configuration', () => {
    expect(mockCreateQueue).toHaveBeenCalledWith(
      MODERATION_QUEUE_NAME,
      expect.objectContaining({
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: { count: 100 },
      }),
    );
  });

  it('creates the dead-letter queue to retain failed jobs indefinitely', () => {
    expect(mockCreateQueue).toHaveBeenCalledWith(
      MODERATION_DLQ_NAME,
      expect.objectContaining({
        attempts: 1,
        removeOnComplete: 1000,
        removeOnFail: false,
      }),
    );
  });
});

describe('enqueueModeration', () => {
  it('enqueues a moderate-post job keyed by postId', async () => {
    mockAddJob.mockResolvedValueOnce('mod-job-1');
    const id = await enqueueModeration('post-123');

    expect(mockAddJob).toHaveBeenCalledWith(MODERATION_QUEUE_NAME, 'moderate-post', {
      postId: 'post-123',
    });
    expect(id).toBe('mod-job-1');
  });
});

describe('enqueueToDLQ', () => {
  it('enqueues a dlq-alert job with the original job id and failure reason', async () => {
    mockAddJob.mockResolvedValueOnce('dlq-job-1');
    const id = await enqueueToDLQ('post-123', 'mod-job-1', 'moderation timed out');

    expect(mockAddJob).toHaveBeenCalledWith(
      MODERATION_DLQ_NAME,
      'dlq-alert',
      expect.objectContaining({
        postId: 'post-123',
        originalJobId: 'mod-job-1',
        failureReason: 'moderation timed out',
        enqueuedAt: expect.any(String),
      }),
    );
    expect(id).toBe('dlq-job-1');
  });
});

// ─── Wiring-gap audit (#1239) ──────────────────────────────────────────────
//
// The issue notes that ModerationService is never invoked anywhere in the
// app (see the companion issue), and that enqueueModeration() itself may
// have no callers. This test scans the actual application source (excluding
// tests) for call sites and fails loudly the day someone wires it up, at
// which point this test — and its accompanying comment — should be updated
// to describe the new caller instead of asserting there are none.
describe('moderationQueue — wiring audit', () => {
  function findApplicationCallers(): string[] {
    const srcRoot = path.resolve(__dirname, '../../');
    const skipDirs = new Set(['node_modules', '__tests__', 'dist', '.git']);
    const definingFiles = [
      path.join(srcRoot, 'queues', 'moderationQueue.ts'),
      path.join(srcRoot, 'queues', 'index.ts'),
    ];
    const callers: string[] = [];

    function walk(dir: string): void {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (skipDirs.has(entry.name)) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (entry.isFile() && full.endsWith('.ts') && !definingFiles.includes(full)) {
          const content = fs.readFileSync(full, 'utf8');
          if (/enqueueModeration\s*\(/.test(content)) {
            callers.push(path.relative(srcRoot, full));
          }
        }
      }
    }

    walk(srcRoot);
    return callers;
  }

  it('documents that enqueueModeration currently has no application callers', () => {
    // As of this test, post creation does NOT enqueue a moderation job —
    // moderationQueue.ts and its re-export in queues/index.ts are the only
    // places `enqueueModeration` appears in application source.
    expect(findApplicationCallers()).toEqual([]);
  });
});
