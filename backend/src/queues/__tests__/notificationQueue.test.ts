/**
 * notificationQueue.test.ts — coverage for the notification queue (issue #1239).
 *
 * queueManager is mocked so this suite never touches a real Redis/BullMQ
 * connection.
 */

jest.mock('../queueManager', () => ({
  queueManager: {
    createQueue: jest.fn(() => ({ name: 'notification' })),
    addJob: jest.fn().mockResolvedValue('job-id'),
    addBulkJobs: jest.fn().mockResolvedValue(['job-id-1', 'job-id-2']),
    getQueueStats: jest.fn().mockResolvedValue({
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
    }),
    getFailedJobs: jest.fn().mockResolvedValue([]),
    getWaitingJobs: jest.fn().mockResolvedValue([]),
    retryJob: jest.fn().mockResolvedValue(undefined),
  },
}));

import {
  NOTIFICATION_QUEUE_NAME,
  NotificationJobData,
  sendNotification,
  sendBulkNotifications,
  sendPushNotification,
  sendSmsNotification,
  sendInAppNotification,
  sendWebhookNotification,
  sendSlackNotification,
  sendDiscordNotification,
  scheduleNotification,
  getNotificationQueueStats,
  getFailedNotifications,
  getWaitingNotifications,
  retryFailedNotification,
} from '../notificationQueue';
import { queueManager } from '../queueManager';

const mockCreateQueue = queueManager.createQueue as jest.Mock;
const mockAddJob = queueManager.addJob as jest.Mock;
const mockAddBulkJobs = queueManager.addBulkJobs as jest.Mock;

// NOTE: createQueue() runs once at module load time (via the imports above);
// its call history is intentionally left untouched by beforeEach so the
// "queue creation" test below can inspect that one-time call.
beforeEach(() => {
  mockAddJob.mockClear().mockResolvedValue('job-id');
  mockAddBulkJobs.mockClear().mockResolvedValue(['job-id-1', 'job-id-2']);
  (queueManager.getQueueStats as jest.Mock).mockClear();
  (queueManager.getFailedJobs as jest.Mock).mockClear();
  (queueManager.getWaitingJobs as jest.Mock).mockClear();
  (queueManager.retryJob as jest.Mock).mockClear();
});

describe('notificationQueue — queue creation', () => {
  it('creates the queue with retry/backoff configuration', () => {
    expect(mockCreateQueue).toHaveBeenCalledWith(
      NOTIFICATION_QUEUE_NAME,
      expect.objectContaining({
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      }),
    );
  });
});

describe('sendNotification — priority mapping', () => {
  const base: Omit<NotificationJobData, 'metadata'> = {
    type: 'push',
    recipient: 'user-1',
    title: 'Hi',
    message: 'Hello there',
  };

  it.each([
    ['urgent', 1],
    ['high', 1],
    ['low', 3],
  ] as const)('maps %s priority metadata to BullMQ priority %d', async (priority, expected) => {
    await sendNotification({ ...base, metadata: { priority } });
    const [, , , options] = mockAddJob.mock.calls[0];
    expect(options.priority).toBe(expected);
  });

  it('defaults to normal priority (2) when metadata is absent', async () => {
    await sendNotification(base);
    const [, , , options] = mockAddJob.mock.calls[0];
    expect(options.priority).toBe(2);
  });

  it('enqueues under the send-notification job name with the full payload', async () => {
    await sendNotification(base);
    expect(mockAddJob).toHaveBeenCalledWith(
      NOTIFICATION_QUEUE_NAME,
      'send-notification',
      base,
      { priority: 2 },
    );
  });

  it('returns the job id from queueManager', async () => {
    mockAddJob.mockResolvedValueOnce('notif-job-1');
    const id = await sendNotification(base);
    expect(id).toBe('notif-job-1');
  });
});

describe('sendBulkNotifications', () => {
  it('maps each notification to a bulk job entry with its own priority', async () => {
    await sendBulkNotifications([
      { type: 'push', recipient: 'a', title: 't', message: 'm', metadata: { priority: 'urgent' } },
      { type: 'sms', recipient: 'b', title: '', message: 'm2' },
    ]);

    expect(mockAddBulkJobs).toHaveBeenCalledWith(NOTIFICATION_QUEUE_NAME, [
      {
        name: 'send-notification',
        data: { type: 'push', recipient: 'a', title: 't', message: 'm', metadata: { priority: 'urgent' } },
        options: { priority: 1 },
      },
      {
        name: 'send-notification',
        data: { type: 'sms', recipient: 'b', title: '', message: 'm2' },
        options: { priority: 2 },
      },
    ]);
  });

  it('returns the job ids from queueManager', async () => {
    mockAddBulkJobs.mockResolvedValueOnce(['a', 'b']);
    const ids = await sendBulkNotifications([]);
    expect(ids).toEqual(['a', 'b']);
  });
});

describe('typed notification helpers', () => {
  it('sendPushNotification sends a push-typed notification', async () => {
    await sendPushNotification('user-1', 'Title', 'Message');
    expect(mockAddJob).toHaveBeenCalledWith(
      NOTIFICATION_QUEUE_NAME,
      'send-notification',
      expect.objectContaining({ type: 'push', recipient: 'user-1', title: 'Title', message: 'Message' }),
      expect.any(Object),
    );
  });

  it('sendSmsNotification sends an sms-typed notification with an empty title', async () => {
    await sendSmsNotification('+15551234567', 'Text body');
    expect(mockAddJob).toHaveBeenCalledWith(
      NOTIFICATION_QUEUE_NAME,
      'send-notification',
      expect.objectContaining({ type: 'sms', recipient: '+15551234567', title: '', message: 'Text body' }),
      expect.any(Object),
    );
  });

  it('sendInAppNotification sends an in_app-typed notification', async () => {
    await sendInAppNotification('user-1', 'Title', 'Message');
    expect(mockAddJob).toHaveBeenCalledWith(
      NOTIFICATION_QUEUE_NAME,
      'send-notification',
      expect.objectContaining({ type: 'in_app', recipient: 'user-1' }),
      expect.any(Object),
    );
  });

  it('sendWebhookNotification serializes the payload into the message', async () => {
    await sendWebhookNotification('https://example.com/hook', { foo: 'bar' });
    const [, , data] = mockAddJob.mock.calls[0];
    expect(data.type).toBe('webhook');
    expect(data.recipient).toBe('https://example.com/hook');
    expect(JSON.parse(data.message)).toEqual({ foo: 'bar' });
  });

  it('sendSlackNotification sends a slack-typed notification', async () => {
    await sendSlackNotification('https://hooks.slack.com/x', 'hello');
    expect(mockAddJob).toHaveBeenCalledWith(
      NOTIFICATION_QUEUE_NAME,
      'send-notification',
      expect.objectContaining({ type: 'slack', recipient: 'https://hooks.slack.com/x', message: 'hello' }),
      expect.any(Object),
    );
  });

  it('sendDiscordNotification sends a discord-typed notification', async () => {
    await sendDiscordNotification('https://discord.com/api/webhooks/x', 'hello');
    expect(mockAddJob).toHaveBeenCalledWith(
      NOTIFICATION_QUEUE_NAME,
      'send-notification',
      expect.objectContaining({ type: 'discord', recipient: 'https://discord.com/api/webhooks/x', message: 'hello' }),
      expect.any(Object),
    );
  });
});

describe('scheduleNotification', () => {
  const base: NotificationJobData = {
    type: 'push',
    recipient: 'user-1',
    title: 'Title',
    message: 'Message',
  };

  it('enqueues with a delay computed from the scheduled time', async () => {
    const scheduledFor = new Date(Date.now() + 60_000);
    await scheduleNotification(base, scheduledFor);

    const [, , , options] = mockAddJob.mock.calls[0];
    expect(options.delay).toBeGreaterThan(0);
    expect(options.delay).toBeLessThanOrEqual(60_000);
  });

  it('rejects a scheduled time in the past without enqueuing', async () => {
    const past = new Date(Date.now() - 60_000);
    await expect(scheduleNotification(base, past)).rejects.toThrow(
      'Scheduled time must be in the future',
    );
    expect(mockAddJob).not.toHaveBeenCalled();
  });
});

describe('read/retry helpers', () => {
  it('getNotificationQueueStats delegates to queueManager.getQueueStats', async () => {
    await getNotificationQueueStats();
    expect(queueManager.getQueueStats).toHaveBeenCalledWith(NOTIFICATION_QUEUE_NAME);
  });

  it('getFailedNotifications uses default pagination', async () => {
    await getFailedNotifications();
    expect(queueManager.getFailedJobs).toHaveBeenCalledWith(NOTIFICATION_QUEUE_NAME, 0, 20);
  });

  it('getWaitingNotifications forwards custom pagination', async () => {
    await getWaitingNotifications(5, 15);
    expect(queueManager.getWaitingJobs).toHaveBeenCalledWith(NOTIFICATION_QUEUE_NAME, 5, 15);
  });

  it('retryFailedNotification delegates to queueManager.retryJob', async () => {
    await retryFailedNotification('job-99');
    expect(queueManager.retryJob).toHaveBeenCalledWith(NOTIFICATION_QUEUE_NAME, 'job-99');
  });
});
