import dotenv from 'dotenv';
import { RedisOptions } from 'ioredis';

dotenv.config();

export const getNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const getBackendPort = (): number => {
  return getNumber(process.env.BACKEND_PORT, 3001);
};

export const getRedisConnection = (): RedisOptions => {
  return {
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: getNumber(process.env.REDIS_PORT, 6379),
    password: process.env.REDIS_PASSWORD,
    db: getNumber(process.env.REDIS_DB, 0),
    maxRetriesPerRequest: null,
  };
};

export const getConfiguredQueueNames = (): string[] => {
  return (process.env.WORKER_MONITOR_QUEUES ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
};

export const getBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();

  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return fallback;
};

const parsePathList = (value: string | undefined, fallback: string[]): string[] => {
  const source = value ?? fallback.join(',');
  return source
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
};

export interface DataRetentionConfig {
  enabled: boolean;
  mode: 'archive' | 'delete';
  archiveDirectory: string;
  scheduleCron: string;
  logsRetentionDays: number;
  analyticsRetentionDays: number;
  logsPaths: string[];
  analyticsPaths: string[];
  queueName: string;
}

export const getDataRetentionConfig = (): DataRetentionConfig => {
  const mode = (process.env.DATA_RETENTION_MODE ?? 'archive').trim().toLowerCase();

  return {
    enabled: getBoolean(process.env.DATA_PRUNING_ENABLED, true),
    mode: mode === 'delete' ? 'delete' : 'archive',
    archiveDirectory: process.env.DATA_RETENTION_ARCHIVE_DIR ?? 'cold-storage',
    scheduleCron: process.env.DATA_PRUNING_CRON ?? '0 2 * * *',
    logsRetentionDays: getNumber(process.env.DATA_RETENTION_LOG_DAYS, 30),
    analyticsRetentionDays: getNumber(process.env.DATA_RETENTION_ANALYTICS_DAYS, 90),
    logsPaths: parsePathList(process.env.DATA_RETENTION_LOG_PATHS, ['logs']),
    analyticsPaths: parsePathList(process.env.DATA_RETENTION_ANALYTICS_PATHS, ['data/analytics']),
    queueName: process.env.DATA_PRUNING_QUEUE ?? 'data-pruning',
  };
};