import { OfflineQueue } from '../OfflineQueue';

function makeRedis(overrides: Record<string, vi.Mock> = {}) {
  return {
    eval: vi.fn().mockResolvedValue(1),
    hvals: vi.fn().mockResolvedValue([]),
    hdel: vi.fn().mockResolvedValue(1),
    hlen: vi.fn().mockResolvedValue(0),
    del: vi.fn().mockResolvedValue(1),
    ...overrides,
  };
}

// A fake Redis client whose `eval` actually enforces the enqueue script's
// check-then-set atomically (synchronously) against an in-memory hash, so
// concurrency tests exercise real atomicity semantics rather than a mock
// that always says "yes".
function makeAtomicRedis() {
  const store = new Map<string, string>();
  return {
    eval: vi.fn((_script: string, _numKeys: number, _key: string, maxSize: number, field: string, value: string) => {
      if (store.size >= Number(maxSize)) return Promise.resolve(0);
      store.set(field, value);
      return Promise.resolve(1);
    }),
    hvals: vi.fn(() => Promise.resolve(Array.from(store.values()))),
    hdel: vi.fn((_key: string, field: string) => {
      store.delete(field);
      return Promise.resolve(1);
    }),
    hlen: vi.fn(() => Promise.resolve(store.size)),
    del: vi.fn(() => {
      store.clear();
      return Promise.resolve(1);
    }),
  };
}

describe('OfflineQueue', () => {
  describe('constructor', () => {
    it('initialises without redis (in-memory only)', () => {
      const q = new OfflineQueue();
      expect(q).toBeDefined();
    });

    it('initialises with a redis client', () => {
      const redis = makeRedis();
      const q = new OfflineQueue(redis);
      expect(q).toBeDefined();
    });
  });

  describe('queueTransaction (in-memory)', () => {
    it('returns a unique string id', async () => {
      const q = new OfflineQueue();
      const id = await q.queueTransaction('xdr-data-1');
      expect(typeof id).toBe('string');
      expect(id).toMatch(/^tx_/);
    });

    it('stores multiple transactions', async () => {
      const q = new OfflineQueue();
      await q.queueTransaction('xdr-1');
      await q.queueTransaction('xdr-2');
      const all = await q.getQueuedTransactions();
      expect(all).toHaveLength(2);
    });

    it('throws when queue exceeds max size', async () => {
      const q = new OfflineQueue(undefined, 2);
      await q.queueTransaction('xdr-1');
      await q.queueTransaction('xdr-2');
      await expect(q.queueTransaction('xdr-3')).rejects.toThrow(/full/);
    });

    it('rejects concurrent calls beyond MAX_QUEUE_SIZE without exceeding the cap', async () => {
      const q = new OfflineQueue(undefined, 5);
      const results = await Promise.allSettled(
        Array.from({ length: 20 }, (_, i) => q.queueTransaction(`xdr-${i}`))
      );
      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');
      expect(fulfilled).toHaveLength(5);
      expect(rejected).toHaveLength(15);
      expect(await q.getQueueSize()).toBe(5);
    });
  });

  describe('queueTransaction (redis)', () => {
    it('atomically checks and writes via a Lua eval script', async () => {
      const redis = makeRedis();
      const q = new OfflineQueue(redis);
      await q.queueTransaction('xdr-redis');
      expect(redis.eval).toHaveBeenCalled();
    });

    it('falls back to in-memory when redis.eval rejects', async () => {
      const redis = makeRedis({ eval: vi.fn().mockRejectedValue(new Error('redis down')) });
      const q = new OfflineQueue(redis);
      const id = await q.queueTransaction('xdr-fallback');
      expect(typeof id).toBe('string');
    });

    it('throws without falling back when the queue is reported full', async () => {
      const redis = makeRedis({ eval: vi.fn().mockResolvedValue(0) });
      const q = new OfflineQueue(redis, 1);
      await expect(q.queueTransaction('xdr-full')).rejects.toThrow(/full/);
    });

    it('rejects concurrent calls beyond MAX_QUEUE_SIZE using atomic redis eval', async () => {
      const redis = makeAtomicRedis();
      const q = new OfflineQueue(redis, 5);
      const results = await Promise.allSettled(
        Array.from({ length: 20 }, (_, i) => q.queueTransaction(`xdr-${i}`))
      );
      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');
      expect(fulfilled).toHaveLength(5);
      expect(rejected).toHaveLength(15);
      expect(await redis.hlen()).toBe(5);
    });
  });

  describe('getQueuedTransactions', () => {
    it('returns in-memory queue when redis not set', async () => {
      const q = new OfflineQueue();
      await q.queueTransaction('xdr-a');
      const txs = await q.getQueuedTransactions();
      expect(txs[0].xdr).toBe('xdr-a');
    });

    it('parses items from the redis hash', async () => {
      const entry = { id: 'tx_1', xdr: 'xdr-r', timestamp: Date.now() };
      const redis = makeRedis({ hvals: vi.fn().mockResolvedValue([JSON.stringify(entry)]) });
      const q = new OfflineQueue(redis);
      const txs = await q.getQueuedTransactions();
      expect(txs[0].xdr).toBe('xdr-r');
    });

    it('falls back to in-memory when redis.hvals rejects', async () => {
      const redis = makeRedis({ hvals: vi.fn().mockRejectedValue(new Error('redis fail')) });
      const q = new OfflineQueue(redis);
      await q.queueTransaction('xdr-mem');
      const txs = await q.getQueuedTransactions();
      expect(Array.isArray(txs)).toBe(true);
    });
  });

  describe('removeTransaction', () => {
    it('removes from in-memory queue', async () => {
      const q = new OfflineQueue();
      const id = await q.queueTransaction('xdr-remove');
      await q.removeTransaction(id);
      const txs = await q.getQueuedTransactions();
      expect(txs.find((t) => t.id === id)).toBeUndefined();
    });

    it('deletes via a single O(1) hash field delete, without scanning the full list', async () => {
      const redis = makeRedis();
      const q = new OfflineQueue(redis);
      await q.removeTransaction('tx_abc');
      expect(redis.hdel).toHaveBeenCalledWith(expect.any(String), 'tx_abc');
      expect(redis.hvals).not.toHaveBeenCalled();
    });
  });

  describe('clearQueue', () => {
    it('empties the in-memory queue', async () => {
      const q = new OfflineQueue();
      await q.queueTransaction('xdr-1');
      await q.clearQueue();
      expect(await q.getQueuedTransactions()).toHaveLength(0);
    });

    it('calls redis.del when redis is set', async () => {
      const redis = makeRedis();
      const q = new OfflineQueue(redis);
      await q.clearQueue();
      expect(redis.del).toHaveBeenCalled();
    });
  });

  describe('getQueueSize', () => {
    it('returns in-memory length without redis', async () => {
      const q = new OfflineQueue();
      await q.queueTransaction('xdr-sz');
      expect(await q.getQueueSize()).toBe(1);
    });

    it('returns redis hlen value', async () => {
      const redis = makeRedis({ hlen: vi.fn().mockResolvedValue(5) });
      const q = new OfflineQueue(redis);
      expect(await q.getQueueSize()).toBe(5);
    });

    it('falls back to in-memory when redis.hlen rejects', async () => {
      const redis = makeRedis({ hlen: vi.fn().mockRejectedValue(new Error('fail')) });
      const q = new OfflineQueue(redis);
      expect(await q.getQueueSize()).toBe(0);
    });
  });

  describe('restoreFromRedis', () => {
    it('no-ops without redis', async () => {
      const q = new OfflineQueue();
      await expect(q.restoreFromRedis()).resolves.toBeUndefined();
    });

    it('populates in-memory queue from redis', async () => {
      const entry = { id: 'tx_restore', xdr: 'xdr-restored', timestamp: Date.now() };
      const redis = makeRedis({ hvals: vi.fn().mockResolvedValue([JSON.stringify(entry)]) });
      const q = new OfflineQueue(redis);
      await q.restoreFromRedis();
      const txs = await q.getQueuedTransactions();
      expect(txs[0].xdr).toBe('xdr-restored');
    });

    it('does not throw when redis.hvals rejects during restore', async () => {
      const redis = makeRedis({ hvals: vi.fn().mockRejectedValue(new Error('down')) });
      const q = new OfflineQueue(redis);
      await expect(q.restoreFromRedis()).resolves.toBeUndefined();
    });
  });
});
