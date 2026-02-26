import { SorobanConfig } from '../types/soroban';

export const SOROBAN_NETWORKS = {
    TESTNET: {
        rpcUrl: 'https://soroban-testnet.stellar.org',
        networkPassphrase: 'Test SDF Network ; September 2015',
    },
    MAINNET: {
        rpcUrl: 'https://soroban.stellar.org',
        networkPassphrase: 'Public Global Stellar Network ; September 2015',
    },
    FUTURENET: {
        rpcUrl: 'https://rpc-futurenet.stellar.org',
        networkPassphrase: 'Test SDF Future Network ; October 2022',
    },
} as const;

export const DEFAULT_TIMEOUT = 30000; // 30 seconds
export const DEFAULT_FEE = '100000'; // 0.01 XLM
