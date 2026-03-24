import { RedisOptions } from 'ioredis';
import { Worker } from 'bullmq';
import { WorkerMonitor } from './workerMonitor';

const getNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const redisConnection: RedisOptions = {
  host: process.env.REDIS_HOST ?? '127.0.0.1',
  port: getNumber(process.env.REDIS_PORT, 6379),
  password: process.env.REDIS_PASSWORD,
  db: getNumber(process.env.REDIS_DB, 0),
  maxRetriesPerRequest: null,
};

const queueNames = (process.env.WORKER_MONITOR_QUEUES ?? '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const workerMonitor = new WorkerMonitor({
  connection: redisConnection,
  monitorIntervalMs: getNumber(process.env.WORKER_MONITOR_INTERVAL_MS, 30000),
  latencyThresholdMs: getNumber(process.env.WORKER_MONITOR_LATENCY_THRESHOLD_MS, 60000),
  stuckJobThresholdMs: getNumber(process.env.WORKER_MONITOR_STUCK_THRESHOLD_MS, 300000),
  maxRestartsPerHour: getNumber(process.env.WORKER_MONITOR_MAX_RESTARTS_PER_HOUR, 3),
  maxRecoveryAttempts: getNumber(process.env.WORKER_MONITOR_MAX_RECOVERY_ATTEMPTS, 5),
  alertHandler: async (alert) => {
    // Replace this callback with PagerDuty/Slack/email integration in production.
    console.log('[worker-monitor-alert]', JSON.stringify(alert));
  },
});

for (const queueName of queueNames) {
  workerMonitor.registerQueue(queueName);
}

export const registerMonitoredWorker = (
  workerName: string,
  queueName: string,
  workerFactory: () => Worker,
): void => {
  workerMonitor.registerWorker(workerName, queueName, workerFactory);
};

export const startWorkerMonitor = async (): Promise<void> => {
  await workerMonitor.start();
};

export const stopWorkerMonitor = async (): Promise<void> => {
  await workerMonitor.stop();
};

export const getWorkerMonitorStatus = () => {
  return workerMonitor.getStatus();
};
