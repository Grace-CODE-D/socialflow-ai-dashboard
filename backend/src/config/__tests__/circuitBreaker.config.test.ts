import { DEFAULT_CIRCUIT_CONFIG, CIRCUIT_CONFIGS, FALLBACK_STRATEGIES } from '../circuitBreaker.config';

describe('DEFAULT_CIRCUIT_CONFIG', () => {
  it('has all required numeric/string fields', () => {
    expect(DEFAULT_CIRCUIT_CONFIG.timeout).toBeGreaterThan(0);
    expect(DEFAULT_CIRCUIT_CONFIG.errorThresholdPercentage).toBeGreaterThan(0);
    expect(DEFAULT_CIRCUIT_CONFIG.resetTimeout).toBeGreaterThan(0);
    expect(DEFAULT_CIRCUIT_CONFIG.rollingCountTimeout).toBeGreaterThan(0);
    expect(DEFAULT_CIRCUIT_CONFIG.rollingCountBuckets).toBeGreaterThan(0);
    expect(DEFAULT_CIRCUIT_CONFIG.volumeThreshold).toBeGreaterThan(0);
    expect(DEFAULT_CIRCUIT_CONFIG.name).toBe('default');
  });
});

describe('CIRCUIT_CONFIGS', () => {
  const expectedProviders = [
    'ai',
    'translation',
    'twitter',
    'blockchain',
    'ipfs',
    'price',
    'youtube',
    'facebook',
    'instagram',
    'tiktok',
    'linkedin',
    'notification',
  ];

  it('defines every expected provider entry', () => {
    for (const provider of expectedProviders) {
      expect(CIRCUIT_CONFIGS).toHaveProperty(provider);
    }
  });

  it.each(Object.entries(CIRCUIT_CONFIGS))('%s has valid, positive config values', (_key, cfg) => {
    expect(cfg.timeout).toBeGreaterThan(0);
    expect(cfg.errorThresholdPercentage).toBeGreaterThan(0);
    expect(cfg.errorThresholdPercentage).toBeLessThanOrEqual(100);
    expect(cfg.resetTimeout).toBeGreaterThan(0);
    expect(cfg.rollingCountTimeout).toBeGreaterThan(0);
    expect(cfg.rollingCountBuckets).toBeGreaterThan(0);
    expect(cfg.volumeThreshold).toBeGreaterThan(0);
    expect(cfg.name).toEqual(expect.stringContaining('-service'));
  });
});

describe('FALLBACK_STRATEGIES', () => {
  it('every strategy has an enabled flag and a message', () => {
    for (const [key, strategy] of Object.entries(FALLBACK_STRATEGIES)) {
      expect(typeof strategy.enabled).toBe('boolean');
      expect(typeof strategy.message).toBe('string');
      expect(strategy.message.length).toBeGreaterThan(0);
      expect(key.length).toBeGreaterThan(0);
    }
  });
});
