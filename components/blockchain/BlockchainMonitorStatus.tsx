import React, { useEffect, useState } from 'react';
import { useBlockchainMonitor } from '../../hooks/useBlockchainMonitor';
import { useToast } from '../../contexts/ToastContext';

const MaterialIcon = ({ name, className }: { name: string; className?: string }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

interface BlockchainMonitorStatusProps {
    publicKey?: string;
    onBalanceUpdate?: () => void;
}

export const BlockchainMonitorStatus: React.FC<BlockchainMonitorStatusProps> = ({
    publicKey,
    onBalanceUpdate
}) => {
    const { showToast } = useToast();
    const [balanceRefreshKey, setBalanceRefreshKey] = useState(0);

    const {
        isMonitoring,
        isAvailable,
        lastPayment,
        monitoredAccounts,
        startMonitoring,
        stopMonitoring
    } = useBlockchainMonitor({
        publicKey,
        autoStart: true,
        showToast,
        onBalanceUpdate: (updatedPublicKey) => {
            console.log('[BlockchainMonitorStatus] Balance update for:', updatedPublicKey);

            // Trigger balance refresh
            setBalanceRefreshKey(prev => prev + 1);

            // Call parent callback
            if (onBalanceUpdate) {
                onBalanceUpdate();
            }
        }
    });

    // Trigger balance refresh when key changes
    useEffect(() => {
        if (balanceRefreshKey > 0 && onBalanceUpdate) {
            // Delay to allow blockchain to settle
            const timer = setTimeout(() => {
                onBalanceUpdate();
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [balanceRefreshKey, onBalanceUpdate]);

    if (!isAvailable) {
        return null; // Not running in Electron
    }

    return (
        <div className="flex items-center gap-2 px-3 py-2 bg-dark-surface rounded-xl border border-dark-border">
            <div className="relative">
                <MaterialIcon
                    name="sensors"
                    className={`text-sm ${isMonitoring ? 'text-primary-teal' : 'text-gray-500'}`}
                />
                {isMonitoring && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary-teal rounded-full animate-pulse" />
                )}
            </div>

            <div className="flex flex-col">
                <span className="text-xs font-medium text-white">
                    {isMonitoring ? 'Monitoring Active' : 'Monitoring Inactive'}
                </span>
                {monitoredAccounts.length > 0 && (
                    <span className="text-[10px] text-gray-subtext">
                        {monitoredAccounts.length} account{monitoredAccounts.length !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {publicKey && (
                <button
                    onClick={() => isMonitoring ? stopMonitoring() : startMonitoring()}
                    className="ml-2 p-1 hover:bg-white/5 rounded-lg transition-colors"
                    title={isMonitoring ? 'Stop monitoring' : 'Start monitoring'}
                >
                    <MaterialIcon
                        name={isMonitoring ? 'pause' : 'play_arrow'}
                        className="text-sm text-gray-400 hover:text-white"
                    />
                </button>
            )}
        </div>
    );
};
