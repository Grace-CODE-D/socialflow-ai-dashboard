import {
  getNumber,
  getBoolean,
  getBackendPort,
  getRedisConnection,
  getConfiguredQueueNames,
  getAdminIpWhitelist,
  getDataRetentionConfig,
} from '../runtime';

describe('getNumber', () => {
  it('returns the parsed value when valid and positive', () => {
    expect(getNumber('42', 1)).toBe(42);
  });

  it('returns the fallback when the value is undefined', () => {
    expect(getNumber(undefined, 7)).toBe(7);
  });

  it('returns the fallback when the value is not finite', () => {
    expect(getNumber('not-a-number', 7)).toBe(7);
  });

  it('returns the fallback when the value is zero or negative', () => {
    expect(getNumber('0', 7)).toBe(7);
    expect(getNumber('-5', 7)).toBe(7);
  });
});

describe('getBoolean', () => {
  it('returns the fallback when value is falsy', () => {
    expect(getBoolean(undefined, true)).toBe(true);
    expect(getBoolean('', false)).toBe(false);
  });

  it.each(['1', 'true', 'yes', 'on', 'TRUE', ' On '])('treats "%s" as true', (value) => {
    expect(getBoolean(value, false)).toBe(true);
  });

  it.each(['0', 'false', 'no', 'off', 'FALSE'])('treats "%s" as false', (value) => {
    expect(getBoolean(value, true)).toBe(false);
  });

  it('returns the fallback for unrecognized values', () => {
    expect(getBoolean('maybe', true)).toBe(true);
    expect(getBoolean('maybe', false)).toBe(false);
  });
});

describe('getBackendPort', () => {
  it('returns the configured backend port', () => {
    expect(getBackendPort()).toBe(3001);
  });
});

describe('getRedisConnection', () => {
  it('builds a RedisOptions object from config', () => {
    const conn = getRedisConnection();
    expect(conn.host).toBe('127.0.0.1');
    expect(conn.port).toBe(6379);
    expect(conn.db).toBe(0);
    expect(conn.maxRetriesPerRequest).toBeNull();
  });

  it('leaves tls undefined when REDIS_TLS is not enabled', () => {
    expect(getRedisConnection().tls).toBeUndefined();
  });
});

describe('getConfiguredQueueNames', () => {
  it('returns a parsed, trimmed, non-empty list of queue names', () => {
    const names = getConfiguredQueueNames();
    expect(Array.isArray(names)).toBe(true);
    for (const name of names) {
      expect(name).toBe(name.trim());
      expect(name.length).toBeGreaterThan(0);
    }
  });
});

describe('getAdminIpWhitelist', () => {
  const original = process.env.ADMIN_IP_WHITELIST;

  afterEach(() => {
    if (original === undefined) delete process.env.ADMIN_IP_WHITELIST;
    else process.env.ADMIN_IP_WHITELIST = original;
  });

  it('returns an empty array when ADMIN_IP_WHITELIST is unset', () => {
    delete process.env.ADMIN_IP_WHITELIST;
    expect(getAdminIpWhitelist()).toEqual([]);
  });

  it('returns an empty array when ADMIN_IP_WHITELIST is an empty string', () => {
    process.env.ADMIN_IP_WHITELIST = '';
    expect(getAdminIpWhitelist()).toEqual([]);
  });

  it('parses a comma-separated list and trims whitespace', () => {
    process.env.ADMIN_IP_WHITELIST = ' 10.0.0.1, 10.0.0.2 ,10.0.0.3';
    expect(getAdminIpWhitelist()).toEqual(['10.0.0.1', '10.0.0.2', '10.0.0.3']);
  });

  it('drops empty entries caused by trailing/duplicate commas', () => {
    process.env.ADMIN_IP_WHITELIST = '10.0.0.1,,10.0.0.2,';
    expect(getAdminIpWhitelist()).toEqual(['10.0.0.1', '10.0.0.2']);
  });
});

describe('getDataRetentionConfig', () => {
  it('returns a fully populated DataRetentionConfig from defaults', () => {
    const cfg = getDataRetentionConfig();
    expect(cfg.mode).toMatch(/^(archive|delete)$/);
    expect(typeof cfg.enabled).toBe('boolean');
    expect(typeof cfg.dryRun).toBe('boolean');
    expect(Array.isArray(cfg.logsPaths)).toBe(true);
    expect(Array.isArray(cfg.analyticsPaths)).toBe(true);
    expect(cfg.logsPaths.length).toBeGreaterThan(0);
    expect(cfg.analyticsPaths.length).toBeGreaterThan(0);
    expect(cfg.queueName).toBe('data-pruning');
  });

  it('honors DATA_RETENTION_LOG_PATHS / ANALYTICS_PATHS overrides', () => {
    const prevLogs = process.env.DATA_RETENTION_LOG_PATHS;
    const prevAnalytics = process.env.DATA_RETENTION_ANALYTICS_PATHS;
    process.env.DATA_RETENTION_LOG_PATHS = 'a,b';
    process.env.DATA_RETENTION_ANALYTICS_PATHS = 'c';

    const cfg = getDataRetentionConfig();
    expect(cfg.logsPaths).toEqual(['a', 'b']);
    expect(cfg.analyticsPaths).toEqual(['c']);

    if (prevLogs === undefined) delete process.env.DATA_RETENTION_LOG_PATHS;
    else process.env.DATA_RETENTION_LOG_PATHS = prevLogs;
    if (prevAnalytics === undefined) delete process.env.DATA_RETENTION_ANALYTICS_PATHS;
    else process.env.DATA_RETENTION_ANALYTICS_PATHS = prevAnalytics;
  });
});
