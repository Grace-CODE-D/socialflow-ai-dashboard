/**
 * Blockchain Monitor Service
 * 
 * React-side service for managing blockchain event monitoring
 * Integrates with Electron IPC for real-time blockchain events
 */

import { PaymentEvent, OperationEvent, BalanceUpdateEvent, BlockchainError } from '../types/electron';

type PaymentCallback = (payment: PaymentEvent) => void;
type OperationCallback = (operation: OperationEvent) => void;
type BalanceUpdateCallback = (data: BalanceUpdateEvent) => void;
type ErrorCallback = (error: BlockchainError) => void;

class BlockchainMonitorService {
    private isElectron: boolean;
    private cleanupFunctions: (() => void)[] = [];
    private paymentCallbacks: Set<PaymentCallback> = new Set();
    private operationCallbacks: Set<OperationCallback> = new Set();
    private balanceUpdateCallbacks: Set<BalanceUpdateCallback> = new Set();
    private errorCallbacks: Set<ErrorCallback> = new Set();

    constructor() {
        this.isElectron = typeof window !== 'undefined' && window.electronAPI !== undefined;

        if (this.isElectron) {
            this.setupListeners();
        }
    }

    /**
     * Setup IPC listeners
     */
    private setupListeners() {
        if (!this.isElectron) return;

        // Payment events
        const cleanupPayment = window.electronAPI.blockchain.onPayment((payment) => {
            this.paymentCallbacks.forEach(callback => callback(payment));
        });
        this.cleanupFunctions.push(cleanupPayment);

        // Operation events
        const cleanupOperation = window.electronAPI.blockchain.onOperation((operation) => {
            this.operationCallbacks.forEach(callback => callback(operation));
        });
        this.cleanupFunctions.push(cleanupOperation);

        // Balance update events
        const cleanupBalance = window.electronAPI.blockchain.onBalanceUpdateNeeded((data) => {
            this.balanceUpdateCallbacks.forEach(callback => callback(data));
        });
        this.cleanupFunctions.push(cleanupBalance);

        // Error events
        const cleanupError = window.electronAPI.blockchain.onError((error) => {
            this.errorCallbacks.forEach(callback => callback(error));
        });
        this.cleanupFunctions.push(cleanupError);
    }

    /**
     * Start monitoring an account
     */
    startMonitoring(publicKey: string): void {
        if (!this.isElectron) {
            console.warn('[BlockchainMonitor] Not running in Electron, monitoring disabled');
            return;
        }

        console.log('[BlockchainMonitor] Starting monitoring for:', publicKey);
        window.electronAPI.blockchain.startMonitoring(publicKey);
    }

    /**
     * Stop monitoring an account
     */
    stopMonitoring(publicKey: string): void {
        if (!this.isElectron) return;

        console.log('[BlockchainMonitor] Stopping monitoring for:', publicKey);
        window.electronAPI.blockchain.stopMonitoring(publicKey);
    }

    /**
     * Get list of monitored accounts
     */
    async getMonitoredAccounts(): Promise<string[]> {
        if (!this.isElectron) return [];
        return await window.electronAPI.blockchain.getMonitoredAccounts();
    }

    /**
     * Get active streams count
     */
    async getActiveStreams(): Promise<number> {
        if (!this.isElectron) return 0;
        return await window.electronAPI.blockchain.getActiveStreams();
    }

    /**
     * Subscribe to payment events
     */
    onPayment(callback: PaymentCallback): () => void {
        this.paymentCallbacks.add(callback);

        return () => {
            this.paymentCallbacks.delete(callback);
        };
    }

    /**
     * Subscribe to operation events
     */
    onOperation(callback: OperationCallback): () => void {
        this.operationCallbacks.add(callback);

        return () => {
            this.operationCallbacks.delete(callback);
        };
    }

    /**
     * Subscribe to balance update events
     */
    onBalanceUpdate(callback: BalanceUpdateCallback): () => void {
        this.balanceUpdateCallbacks.add(callback);

        return () => {
            this.balanceUpdateCallbacks.delete(callback);
        };
    }

    /**
     * Subscribe to error events
     */
    onError(callback: ErrorCallback): () => void {
        this.errorCallbacks.add(callback);

        return () => {
            this.errorCallbacks.delete(callback);
        };
    }

    /**
     * Check if running in Electron
     */
    isAvailable(): boolean {
        return this.isElectron;
    }

    /**
     * Cleanup all listeners
     */
    cleanup(): void {
        this.cleanupFunctions.forEach(cleanup => cleanup());
        this.cleanupFunctions = [];
        this.paymentCallbacks.clear();
        this.operationCallbacks.clear();
        this.balanceUpdateCallbacks.clear();
        this.errorCallbacks.clear();
    }
}

export const blockchainMonitorService = new BlockchainMonitorService();
