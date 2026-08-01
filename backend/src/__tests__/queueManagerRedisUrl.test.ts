/**
 * Verifies that queueManager's Redis connection is sourced exclusively from
 * the validated config object (config.REDIS_URL / config.REDIS_HOST etc.)
 * rather than reading process.env directly.
 */

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    quit: jest.fn().mockResolvedValue('OK'),
    on: jest.fn(),
  }));
});

jest.mock('bullmq', () => ({
  Queue: jest.fn(),
  Worker: jest.fn(),
  QueueEvents: jest.fn(),
}));

afterEach(() => {
  jest.resetModules();
});

describe('queueManager – Redis connection source', () => {
  it('uses config.REDIS_URL when set, ignoring raw process.env.REDIS_URL', () => {
    // A REDIS_URL on process.env that differs from the validated config value —
    // the connection must be derived from config, not process.env directly.
    process.env.REDIS_URL = 'redis://should-not-be-used:9999';

    jest.doMock('../config/config', () => ({
      config: {
        REDIS_URL: 'rediss://configured-host:6380',
        REDIS_HOST: '127.0.0.1',
        REDIS_PORT: 6379,
        REDIS_PASSWORD: undefined,
      },
    }));

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { redisConnection } = require('../queues/queueManager');

    expect(redisConnection.host).toBe('configured-host');
    expect(redisConnection.port).toBe(6380);
    expect(redisConnection.tls).toEqual({});

    delete process.env.REDIS_URL;
  });

  it('falls back to config.REDIS_HOST/PORT when config.REDIS_URL is unset', () => {
    delete process.env.REDIS_URL;

    jest.doMock('../config/config', () => ({
      config: {
        REDIS_URL: undefined,
        REDIS_HOST: 'fallback-host',
        REDIS_PORT: 6111,
        REDIS_PASSWORD: undefined,
      },
    }));

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { redisConnection } = require('../queues/queueManager');

    expect(redisConnection.host).toBe('fallback-host');
    expect(redisConnection.port).toBe(6111);
  });
});
