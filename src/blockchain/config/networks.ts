export interface NetworkConfig {
  type: 'mainnet' | 'testnet' | 'custom';
  horizonUrl: string;
  networkPassphrase: string;
  sorobanRpcUrl?: string;
}

export const MAINNET_CONFIG: NetworkConfig = {
  type: 'mainnet',
  horizonUrl: 'https://horizon.stellar.org',
  networkPassphrase: 'Public Global Stellar Network ; September 2015',
  sorobanRpcUrl: 'https://mainnet.sorobanrpc.com',
};

export const TESTNET_CONFIG: NetworkConfig = {
  type: 'testnet',
  horizonUrl: 'https://horizon-testnet.stellar.org',
  networkPassphrase: 'Test SDF Network ; September 2015',
  sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
};

export const DEFAULT_NETWORK = TESTNET_CONFIG;