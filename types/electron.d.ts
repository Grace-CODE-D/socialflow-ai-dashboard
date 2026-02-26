/**
 * Type definitions for Electron API exposed via preload script
 */

export interface PaymentEvent {
    id: string;
    type: string;
    amount: string;
    asset: string;
    from: string;
    to: string;
    isIncoming: boolean;
    isOutgoing: boolean;
    transactionHash: string;
    createdAt: string;
    memo?: string;
    memoType?: string;
}

export interface OperationEvent {
    id: string;
    type: string;
    transactionHash: string;
    createdAt: string;
    sourceAccount: string;
    // Type-specific fields
    startingBalance?: string;
    account?: string;
    amount?: string;
    asset?: string;
    from?: string;
    to?: string;
    assetIssuer?: string;
    limit?: string;
    price?: string;
}

export interface BalanceUpdateEvent {
    publicKey: string;
}

export interface BlockchainError {
    type: string;
    error: string;
    publicKey: string;
}

export interface BlockchainAPI {
    startMonitoring: (publicKey: string) => void;
    stopMonitoring: (publicKey: string) => void;
    getMonitoredAccounts: () => Promise<string[]>;
    getActiveStreams: () => Promise<number>;
    onPayment: (callback: (data: PaymentEvent) => void) => () => void;
    onOperation: (callback: (data: OperationEvent) => void) => () => void;
    onBalanceUpdateNeeded: (callback: (data: BalanceUpdateEvent) => void) => () => void;
    onError: (callback: (data: BlockchainError) => void) => () => void;
}

export interface ElectronAPI {
    sendMessage: (channel: string, data: any) => void;
    blockchain: BlockchainAPI;
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}

export { };
