import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { authService } from '../../services/authService';
import { sessionService } from '../../services/sessionService';
import { encryptionService } from '../../services/encryptionService';

const MaterialIcon = ({ name, className }: { name: string; className?: string }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export const SecuritySettings: React.FC = () => {
    const [biometricsEnabled, setBiometricsEnabled] = useState(false);
    const [encryptionEnabled, setEncryptionEnabled] = useState(false);
    const [sessionActive, setSessionActive] = useState(false);
    const [authHistory, setAuthHistory] = useState<any[]>([]);
    const [isEnablingBiometrics, setIsEnablingBiometrics] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        // Load current settings
        setBiometricsEnabled(authService.isBiometricsEnabled());
        setEncryptionEnabled(encryptionService.isReady());
        setSessionActive(sessionService.getSessionState().isActive);
        setAuthHistory(authService.getAuthHistory().slice(-5).reverse());
    }, []);

    const handleEnableBiometrics = async () => {
        setIsEnablingBiometrics(true);
        setMessage(null);

        try {
            const result = await authService.enableBiometrics();

            if (result.success) {
                setBiometricsEnabled(true);
                setMessage({ type: 'success', text: 'Biometric authentication enabled successfully' });
            } else {
                setMessage({ type: 'error', text: result.error || 'Failed to enable biometrics' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred while enabling biometrics' });
        } finally {
            setIsEnablingBiometrics(false);
        }
    };

    const handleDisableBiometrics = () => {
        authService.disableBiometrics();
        setBiometricsEnabled(false);
        setMessage({ type: 'success', text: 'Biometric authentication disabled' });
    };

    const handleClearAuthHistory = () => {
        if (confirm('Are you sure you want to clear authentication history?')) {
            authService.clearAllData();
            setAuthHistory([]);
            setMessage({ type: 'success', text: 'Authentication history cleared' });
        }
    };

    const handleRefreshSession = () => {
        sessionService.refreshSession();
        setMessage({ type: 'success', text: 'Session refreshed successfully' });
    };

    const formatTimestamp = (timestamp: number) => {
        return new Date(timestamp).toLocaleString();
    };

    const getOperationIcon = (operation: string) => {
        switch (operation) {
            case 'LARGE_TRANSACTION':
                return 'payments';
            case 'CONTRACT_DEPLOYMENT':
                return 'code';
            case 'ACCOUNT_SETTINGS':
                return 'settings';
            default:
                return 'lock';
        }
    };

    return (
        <div className="space-y-6">
            {/* Message Banner */}
            {message && (
                <div
                    className={`p-4 rounded-xl border ${message.type === 'success'
                            ? 'bg-teal-500/10 border-teal-500/20 text-teal-400'
                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                        } animate-fade-in`}
                >
                    <div className="flex items-center gap-3">
                        <MaterialIcon name={message.type === 'success' ? 'check_circle' : 'error'} />
                        <p className="text-sm">{message.text}</p>
                    </div>
                </div>
            )}

            {/* Session Management */}
            <Card>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary-blue/20 flex items-center justify-center">
                            <MaterialIcon name="schedule" className="text-primary-blue text-2xl" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Session Management</h3>
                            <p className="text-sm text-gray-subtext">30-minute inactivity timeout</p>
                        </div>
                    </div>
                    <div
                        className={`px-3 py-1 rounded-full text-xs font-medium ${sessionActive
                                ? 'bg-teal-500/20 text-teal-400'
                                : 'bg-gray-500/20 text-gray-400'
                            }`}
                    >
                        {sessionActive ? 'Active' : 'Inactive'}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-dark-bg rounded-xl">
                        <div>
                            <p className="text-white font-medium">Auto-disconnect on timeout</p>
                            <p className="text-xs text-gray-subtext">Automatically log out after 30 minutes of inactivity</p>
                        </div>
                        <div className="w-12 h-6 bg-primary-blue rounded-full relative cursor-pointer">
                            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                        </div>
                    </div>

                    {sessionActive && (
                        <div className="flex items-center justify-between p-4 bg-dark-bg rounded-xl">
                            <div>
                                <p className="text-white font-medium">Time remaining</p>
                                <p className="text-xs text-gray-subtext">
                                    {Math.floor(sessionService.getRemainingTime() / 60000)} minutes
                                </p>
                            </div>
                            <button
                                onClick={handleRefreshSession}
                                className="px-4 py-2 rounded-lg bg-primary-blue text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                            >
                                Refresh
                            </button>
                        </div>
                    )}
                </div>
            </Card>

            {/* Biometric Authentication */}
            <Card>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary-teal/20 flex items-center justify-center">
                            <MaterialIcon name="fingerprint" className="text-primary-teal text-2xl" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Biometric Authentication</h3>
                            <p className="text-sm text-gray-subtext">Use fingerprint or face ID</p>
                        </div>
                    </div>
                    <div
                        className={`px-3 py-1 rounded-full text-xs font-medium ${biometricsEnabled
                                ? 'bg-teal-500/20 text-teal-400'
                                : 'bg-gray-500/20 text-gray-400'
                            }`}
                    >
                        {biometricsEnabled ? 'Enabled' : 'Disabled'}
                    </div>
                </div>

                <div className="space-y-4">
                    <p className="text-sm text-gray-subtext">
                        Enable biometric authentication for quick and secure access to sensitive operations.
                    </p>

                    {!biometricsEnabled ? (
                        <button
                            onClick={handleEnableBiometrics}
                            disabled={isEnablingBiometrics}
                            className="w-full px-6 py-3 rounded-xl bg-primary-teal text-white hover:bg-teal-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isEnablingBiometrics ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Enabling...
                                </>
                            ) : (
                                <>
                                    <MaterialIcon name="fingerprint" />
                                    Enable Biometrics
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={handleDisableBiometrics}
                            className="w-full px-6 py-3 rounded-xl border border-dark-border text-gray-subtext hover:text-white hover:bg-white/5 transition-colors font-medium"
                        >
                            Disable Biometrics
                        </button>
                    )}
                </div>
            </Card>

            {/* Data Encryption */}
            <Card>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                            <MaterialIcon name="lock" className="text-purple-400 text-2xl" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Data Encryption</h3>
                            <p className="text-sm text-gray-subtext">Encrypt sensitive data</p>
                        </div>
                    </div>
                    <div
                        className={`px-3 py-1 rounded-full text-xs font-medium ${encryptionEnabled
                                ? 'bg-teal-500/20 text-teal-400'
                                : 'bg-gray-500/20 text-gray-400'
                            }`}
                    >
                        {encryptionEnabled ? 'Active' : 'Inactive'}
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-dark-bg rounded-lg">
                        <div className="flex items-center gap-3">
                            <MaterialIcon name="storage" className="text-purple-400" />
                            <span className="text-sm text-white">localStorage encryption</span>
                        </div>
                        <MaterialIcon name="check_circle" className="text-teal-400" />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-dark-bg rounded-lg">
                        <div className="flex items-center gap-3">
                            <MaterialIcon name="database" className="text-purple-400" />
                            <span className="text-sm text-white">IndexedDB encryption</span>
                        </div>
                        <MaterialIcon name="check_circle" className="text-teal-400" />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-dark-bg rounded-lg">
                        <div className="flex items-center gap-3">
                            <MaterialIcon name="swap_horiz" className="text-purple-400" />
                            <span className="text-sm text-white">IPC message encryption</span>
                        </div>
                        <MaterialIcon name="check_circle" className="text-teal-400" />
                    </div>
                </div>
            </Card>

            {/* Authentication History */}
            <Card>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                            <MaterialIcon name="history" className="text-orange-400 text-2xl" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Authentication History</h3>
                            <p className="text-sm text-gray-subtext">Recent authentication attempts</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClearAuthHistory}
                        className="text-sm text-gray-subtext hover:text-white transition-colors"
                    >
                        Clear History
                    </button>
                </div>

                <div className="space-y-3">
                    {authHistory.length === 0 ? (
                        <p className="text-center text-gray-subtext py-8">No authentication history</p>
                    ) : (
                        authHistory.map((attempt, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-4 bg-dark-bg rounded-xl"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${attempt.success
                                                ? 'bg-teal-500/20'
                                                : 'bg-red-500/20'
                                            }`}
                                    >
                                        <MaterialIcon
                                            name={getOperationIcon(attempt.operation)}
                                            className={attempt.success ? 'text-teal-400' : 'text-red-400'}
                                        />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium text-sm">
                                            {attempt.operation.replace(/_/g, ' ')}
                                        </p>
                                        <p className="text-xs text-gray-subtext">
                                            {formatTimestamp(attempt.timestamp)}
                                        </p>
                                    </div>
                                </div>
                                <div
                                    className={`px-3 py-1 rounded-full text-xs font-medium ${attempt.success
                                            ? 'bg-teal-500/20 text-teal-400'
                                            : 'bg-red-500/20 text-red-400'
                                        }`}
                                >
                                    {attempt.success ? 'Success' : 'Failed'}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    );
};
