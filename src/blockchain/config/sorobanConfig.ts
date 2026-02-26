/**
 * Soroban Network Configuration
 * Defines RPC endpoints and network settings for Stellar Soroban
 */

export enum SorobanNetwork {
  TESTNET = 'TESTNET',
  MAINNET = 'MAINNET',
  FUTURENET = 'FUTURENET',
  STANDALONE = 'STANDALONE'
}

export interface NetworkConfig {
  rpcUrl: string;
  networkPassphrase: string;
  name: string;
}

export const SOROBAN_NETWORKS: Record<SorobanNetwork, NetworkConfig> = {
  [SorobanNetwork.TESTNET]: {
    rpcUrl: 'https://soroban-testnet.stellar.org',
    networkPassphrase: 'Test SDF Network ; September 2015',
    name: 'Testnet'
  },
  [SorobanNetwork.MAINNET]: {
    rpcUrl: 'https://soroban.stellar.org',
    networkPassphrase: 'Public Global Stellar Network ; September 2015',
    name: 'Mainnet'
  },
  [SorobanNetwork.FUTURENET]: {
    rpcUrl: 'https://rpc-futurenet.stellar.org',
    networkPassphrase: 'Test SDF Future Network ; October 2022',
    name: 'Futurenet'
  },
  [SorobanNetwork.STANDALONE]: {
    rpcUrl: 'http://localhost:8000/soroban/rpc',
    networkPassphrase: 'Standalone Network ; February 2017',
    name: 'Standalone'
  }
};

export const DEFAULT_NETWORK = SorobanNetwork.TESTNET;
export const CONNECTION_TIMEOUT = 30000; // 30 seconds
export const RECONNECT_INTERVAL = 5000; // 5 seconds
export const MAX_RECONNECT_ATTEMPTS = 5;
