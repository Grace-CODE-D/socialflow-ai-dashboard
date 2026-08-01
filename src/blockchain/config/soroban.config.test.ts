import { SOROBAN_NETWORKS, DEFAULT_TIMEOUT, STELLAR_POLL_TIMEOUT_MS, SorobanConfig } from './soroban.config';

describe('soroban.config', () => {
  it('defines TESTNET, MAINNET, and FUTURENET RPC configs', () => {
    expect(Object.keys(SOROBAN_NETWORKS).sort()).toEqual(['FUTURENET', 'MAINNET', 'TESTNET']);
  });

  it('each network config has an rpcUrl and networkPassphrase', () => {
    Object.values(SOROBAN_NETWORKS).forEach((config: SorobanConfig) => {
      expect(typeof config.rpcUrl).toBe('string');
      expect(config.rpcUrl.startsWith('https://')).toBe(true);
      expect(typeof config.networkPassphrase).toBe('string');
      expect(config.networkPassphrase.length).toBeGreaterThan(0);
    });
  });

  it('TESTNET uses the Soroban testnet RPC endpoint', () => {
    expect(SOROBAN_NETWORKS.TESTNET.rpcUrl).toBe('https://soroban-testnet.stellar.org');
    expect(SOROBAN_NETWORKS.TESTNET.networkPassphrase).toBe('Test SDF Network ; September 2015');
  });

  it('MAINNET uses the Soroban mainnet RPC endpoint', () => {
    expect(SOROBAN_NETWORKS.MAINNET.rpcUrl).toBe('https://soroban-mainnet.stellar.org');
    expect(SOROBAN_NETWORKS.MAINNET.networkPassphrase).toBe('Public Global Stellar Network ; September 2015');
  });

  it('FUTURENET uses the Soroban futurenet RPC endpoint', () => {
    expect(SOROBAN_NETWORKS.FUTURENET.rpcUrl).toBe('https://soroban-futurenet.stellar.org');
    expect(SOROBAN_NETWORKS.FUTURENET.networkPassphrase).toBe('Test SDF Future Network ; October 2022');
  });

  it('DEFAULT_TIMEOUT is 30 seconds', () => {
    expect(DEFAULT_TIMEOUT).toBe(30);
  });

  it('STELLAR_POLL_TIMEOUT_MS defaults to 120000ms when no override is present', () => {
    expect(STELLAR_POLL_TIMEOUT_MS).toBe(120000);
  });
});
