/**
 * Covers that lib/redis.ts builds its singleton ioredis client from the
 * validated runtime config rather than raw process.env access.
 */

const mockRedisCtor = jest.fn();

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation((opts: any) => {
    mockRedisCtor(opts);
    return { __opts: opts };
  });
});

jest.mock('../../config/runtime', () => ({
  getRedisConnection: jest.fn().mockReturnValue({
    host: '127.0.0.1',
    port: 6379,
    db: 0,
  }),
}));

describe('lib/redis', () => {
  it('constructs the ioredis client using getRedisConnection()', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { redis } = require('../redis');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getRedisConnection } = require('../../config/runtime');

    expect(getRedisConnection).toHaveBeenCalled();
    expect(mockRedisCtor).toHaveBeenCalledWith({
      host: '127.0.0.1',
      port: 6379,
      db: 0,
    });
    expect(redis).toBeDefined();
  });
});
