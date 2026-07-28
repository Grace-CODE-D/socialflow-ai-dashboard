import { NETWORKS, DEFAULT_NETWORK, NetworkConfig } from './networks';

describe('networks config', () => {
  it('defines TESTNET, MAINNET, and FUTURENET', () => {
    expect(Object.keys(NETWORKS).sort()).toEqual(['FUTURENET', 'MAINNET', 'TESTNET']);
  });

  it('each network config has the required fields', () => {
    Object.values(NETWORKS).forEach((config: NetworkConfig) => {
      expect(typeof config.horizonUrl).toBe('string');
      expect(config.horizonUrl.startsWith('https://')).toBe(true);
      expect(typeof config.networkPassphrase).toBe('string');
      expect(config.networkPassphrase.length).toBeGreaterThan(0);
      expect(typeof config.name).toBe('string');
    });
  });

  it('TESTNET points at the Stellar testnet horizon', () => {
    expect(NETWORKS.TESTNET.horizonUrl).toBe('https://horizon-testnet.stellar.org');
    expect(NETWORKS.TESTNET.networkPassphrase).toBe('Test SDF Network ; September 2015');
    expect(NETWORKS.TESTNET.name).toBe('Testnet');
  });

  it('MAINNET points at the Stellar public network', () => {
    expect(NETWORKS.MAINNET.horizonUrl).toBe('https://horizon.stellar.org');
    expect(NETWORKS.MAINNET.networkPassphrase).toBe('Public Global Stellar Network ; September 2015');
    expect(NETWORKS.MAINNET.name).toBe('Mainnet');
  });

  it('FUTURENET points at the Stellar futurenet', () => {
    expect(NETWORKS.FUTURENET.horizonUrl).toBe('https://horizon-futurenet.stellar.org');
    expect(NETWORKS.FUTURENET.networkPassphrase).toBe('Test SDF Future Network ; October 2022');
    expect(NETWORKS.FUTURENET.name).toBe('Futurenet');
  });

  it('DEFAULT_NETWORK is TESTNET', () => {
    expect(DEFAULT_NETWORK).toBe(NETWORKS.TESTNET);
  });
});
