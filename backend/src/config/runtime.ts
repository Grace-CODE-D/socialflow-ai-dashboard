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