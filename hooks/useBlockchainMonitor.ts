/**
 * React Hook for Blockchain Monitoring
 * 
 * Provides easy integration with blockchain event monitoring
 * Handles toast notifications and balance updates automatically
 */

import { useEffect, useCallback, useState } from 'react';
import { blockchainMonitorService } from '../services/blockchainMonitorService';
import { PaymentEvent, OperationEvent } from '../types/electron';

interface UseBlockchainMonitorOptions {
    publicKey?: string;
    autoStart?: boolean;
    onPayment?: (payment: PaymentEvent) => void;
    onOperation?: (operation: OperationEvent) => void;
    onBalanceUpdate?: (publicKey: string) => void;
    showToast?: (message: string, type: 'success' | 'info' | 'error') => void;
}

export function useBlockchainMonitor(options: UseBlockchainMonitorOptions = {}) {
    const {
        publicKey,
        autoStart = true,
        onPayment,
        onOperation,
        onBalanceUpdate,
        showToast
    } = options;

    const [isMonitoring, setIsMonitoring] = useState(false);
    const [lastPayment, setLastPayment] = useState<PaymentEvent | null>(null);
    const [lastOperation, setLastOperation] = useState<OperationEvent | null>(null);
    const [monitoredAccounts, setMonitoredAccounts] = useState<string[]>([]);

    /**
     * Start monitoring
     */
    const startMonitoring = useCallback((accountPublicKey?: string) => {
        const key = accountPublicKey || publicKey;
        if (!key) {
            console.warn('[useBlockchainMonitor] No public key provided');
            return;
        }

        blockchainMonitorService.startMonitoring(key);
        setIsMonitoring(true);
    }, [publicKey]);

    /**
     * Stop monitoring
     */
    const stopMonitoring = useCallback((accountPublicKey?: string) => {
        const key = accountPublicKey || publicKey;
        if (!key) return;

        blockchainMonitorService.stopMonitoring(key);
        setIsMonitoring(false);
    }, [publicKey]);

    /**
     * Refresh monitored accounts list
     */
    const refreshMonitoredAccounts = useCallback(async () => {
        const accounts = await blockchainMonitorService.getMonitoredAccounts();
        setMonitoredAccounts(accounts);
    }, []);

    /**
     * Format payment notification message
     */
    const formatPaymentMessage = useCallback((payment: PaymentEvent): string => {
        const amount = parseFloat(payment.amount).toFixed(2);
        const asset = payment.asset;

        if (payment.isIncoming) {
            const fromShort = `${payment.from.substring(0, 4)}...${payment.from.substring(payment.from.length - 4)}`;
            return `Received ${amount} ${asset} from ${fromShort}`;
        } else if (payment.isOutgoing) {
            const toShort = `${payment.to.substring(0, 4)}...${payment.to.substring(payment.to.length - 4)}`;
            return `Sent ${amount} ${asset} to ${toShort}`;
        }

        return `Payment: ${amount} ${asset}`;
    }, []);

    /**
     * Setup event listeners
     */
    useEffect(() => {
        // Payment listener
        const unsubscribePayment = blockchainMonitorService.onPayment((payment) => {
            console.log('[useBlockchainMonitor] Payment received:', payment);
            setLastPayment(payment);

            // Show toast notification
            if (showToast) {
                const message = formatPaymentMessage(payment);
                showToast(message, payment.isIncoming ? 'success' : 'info');
            }

            // Call custom handler
            if (onPayment) {
                onPayment(payment);
            }
        });

        // Operation listener
        const unsubscribeOperation = blockchainMonitorService.onOperation((operation) => {
            console.log('[useBlockchainMonitor] Operation received:', operation);
            setLastOperation(operation);

            // Call custom handler
            if (onOperation) {
                onOperation(operation);
            }
        });

        // Balance update listener
        const unsubscribeBalance = blockchainMonitorService.onBalanceUpdate((data) => {
            console.log('[useBlockchainMonitor] Balance update needed for:', data.publicKey);

            // Show toast notification
            if (showToast) {
                showToast('Balance updated', 'info');
            }

            // Call custom handler
            if (onBalanceUpdate) {
                onBalanceUpdate(data.publicKey);
            }
        });

        // Error listener
        const unsubscribeError = blockchainMonitorService.onError((error) => {
            console.error('[useBlockchainMonitor] Error:', error);

            if (showToast) {
                showToast(`Blockchain monitoring error: ${error.error}`, 'error');
            }
        });

        // Cleanup
        return () => {
            unsubscribePayment();
            unsubscribeOperation();
            unsubscribeBalance();
            unsubscribeError();
        };
    }, [onPayment, onOperation, onBalanceUpdate, showToast, formatPaymentMessage]);

    /**
     * Auto-start monitoring
     */
    useEffect(() => {
        if (autoStart && publicKey && blockchainMonitorService.isAvailable()) {
            startMonitoring(publicKey);
        }

        return () => {
            if (publicKey) {
                stopMonitoring(publicKey);
            }
        };
    }, [publicKey, autoStart, startMonitoring, stopMonitoring]);

    /**
     * Refresh monitored accounts on mount
     */
    useEffect(() => {
        refreshMonitoredAccounts();
    }, [refreshMonitoredAccounts]);

    return {
        isMonitoring,
        isAvailable: blockchainMonitorService.isAvailable(),
        lastPayment,
        lastOperation,
        monitoredAccounts,
        startMonitoring,
        stopMonitoring,
        refreshMonitoredAccounts
    };
}
