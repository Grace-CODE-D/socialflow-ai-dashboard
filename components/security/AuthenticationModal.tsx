import React, { useState } from 'react';
import { authService, SensitiveOperation } from '../../services/authService';

interface AuthenticationModalProps {
    isOpen: boolean;
    operation: SensitiveOperation;
    operationDetails?: string;
    onAuthenticate: () => void;
    onCancel: () => void;
    signMessage: (message: string) => Promise<string>;
}

const MaterialIcon = ({ name, className }: { name: string; className?: string }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export const AuthenticationModal: React.FC<AuthenticationModalProps> = ({
    isOpen,
    operation,
    operationDetails,
    onAuthenticate,
    onCancel,
    signMessage,
}) => {
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [authMethod, setAuthMethod] = useState<'wallet' | 'biometric'>('wallet');

    if (!isOpen) {
        return null;
    }

    const handleWalletAuth = async () => {
        setIsAuthenticating(true);
        setError(null);

        try {
            const result = await authService.authenticateWithWallet(operation, signMessage);

            if (result.success) {
                onAuthenticate();
            } else {
                setError(result.error || 'Authentication failed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Authentication failed');
        } finally {
            setIsAuthenticating(false);
        }
    };

    const handleBiometricAuth = async () => {
        setIsAuthenticating(true);
        setError(null);

        try {
            const result = await authService.authenticateWithBiometrics(operation);

            if (result.success) {
                onAuthenticate();
            } else {
                setError(result.error || 'Biometric authentication failed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Biometric authentication failed');
        } finally {
            setIsAuthenticating(false);
        }
    };

    const getOperationIcon = () => {
        switch (operation) {
            case SensitiveOperation.LARGE_TRANSACTION:
                return 'payments';
            case SensitiveOperation.CONTRACT_DEPLOYMENT:
                return 'code';
            case SensitiveOperation.ACCOUNT_SETTINGS:
                return 'settings';
            case SensitiveOperation.WALLET_EXPORT:
                return 'download';
            case SensitiveOperation.SECURITY_SETTINGS:
                return 'security';
            default:
                return 'lock';
        }
    };

    const getOperationTitle = () => {
        switch (operation) {
            case SensitiveOperation.LARGE_TRANSACTION:
                return 'Confirm Large Transaction';
            case SensitiveOperation.CONTRACT_DEPLOYMENT:
                return 'Confirm Contract Deployment';
            case SensitiveOperation.ACCOUNT_SETTINGS:
                return 'Confirm Settings Change';
            case SensitiveOperation.WALLET_EXPORT:
                return 'Confirm Wallet Export';
            case SensitiveOperation.SECURITY_SETTINGS:
                return 'Confirm Security Change';
            default:
                return 'Authentication Required';
        }
    };

    const cooldownRemaining = authService.getCooldownRemaining();
    const isInCooldown = cooldownRemaining > 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-dark-surface border border-dark-border rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-scale-in">
                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary-blue/20 flex items-center justify-center">
                    <MaterialIcon name={getOperationIcon()} className="text-4xl text-primary-blue" />
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-white text-center mb-3">
                    {getOperationTitle()}
                </h2>

                {/* Details */}
                {operationDetails && (
                    <p className="text-gray-subtext text-center mb-6">
                        {operationDetails}
                    </p>
                )}

                {/* Security Message */}
                <div className="bg-primary-blue/10 border border-primary-blue/20 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <MaterialIcon name="shield" className="text-primary-blue mt-0.5" />
                        <div>
                            <p className="text-sm text-white font-medium mb-1">Security Verification</p>
                            <p className="text-xs text-gray-subtext">
                                This operation requires authentication to protect your account and assets.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <MaterialIcon name="error" className="text-red-400 mt-0.5" />
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    </div>
                )}

                {/* Cooldown Warning */}
                {isInCooldown && (
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <MaterialIcon name="schedule" className="text-orange-400 mt-0.5" />
                            <p className="text-sm text-orange-400">
                                Too many attempts. Please wait {Math.ceil(cooldownRemaining / 1000)} seconds.
                            </p>
                        </div>
                    </div>
                )}

                {/* Authentication Methods */}
                {!isInCooldown && (
                    <div className="space-y-3 mb-6">
                        {/* Wallet Authentication */}
                        <button
                            onClick={handleWalletAuth}
                            disabled={isAuthenticating || authMethod !== 'wallet'}
                            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${authMethod === 'wallet'
                                    ? 'border-primary-blue bg-primary-blue/10'
                                    : 'border-dark-border hover:border-primary-blue/50'
                                } ${isAuthenticating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary-blue/20 flex items-center justify-center">
                                    <MaterialIcon name="account_balance_wallet" className="text-primary-blue" />
                                </div>
                                <div className="text-left">
                                    <p className="text-white font-medium">Wallet Signature</p>
                                    <p className="text-xs text-gray-subtext">Sign with your connected wallet</p>
                                </div>
                            </div>
                            {isAuthenticating && authMethod === 'wallet' && (
                                <div className="w-5 h-5 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
                            )}
                        </button>

                        {/* Biometric Authentication */}
                        {authService.isBiometricsEnabled() && (
                            <button
                                onClick={handleBiometricAuth}
                                disabled={isAuthenticating || authMethod !== 'biometric'}
                                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${authMethod === 'biometric'
                                        ? 'border-primary-teal bg-primary-teal/10'
                                        : 'border-dark-border hover:border-primary-teal/50'
                                    } ${isAuthenticating ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary-teal/20 flex items-center justify-center">
                                        <MaterialIcon name="fingerprint" className="text-primary-teal" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-white font-medium">Biometric</p>
                                        <p className="text-xs text-gray-subtext">Use fingerprint or face ID</p>
                                    </div>
                                </div>
                                {isAuthenticating && authMethod === 'biometric' && (
                                    <div className="w-5 h-5 border-2 border-primary-teal border-t-transparent rounded-full animate-spin" />
                                )}
                            </button>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-4">
                    <button
                        onClick={onCancel}
                        disabled={isAuthenticating}
                        className="flex-1 px-6 py-3 rounded-xl border border-dark-border text-gray-subtext hover:text-white hover:bg-white/5 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                    {!isInCooldown && (
                        <button
                            onClick={authMethod === 'wallet' ? handleWalletAuth : handleBiometricAuth}
                            disabled={isAuthenticating}
                            className="flex-1 px-6 py-3 rounded-xl bg-primary-blue text-white hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isAuthenticating ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Authenticating...
                                </>
                            ) : (
                                <>
                                    <MaterialIcon name="verified_user" />
                                    Authenticate
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Info */}
                <p className="text-xs text-gray-subtext text-center mt-6">
                    Your authentication is valid for 5 minutes after verification.
                </p>
            </div>
        </div>
    );
};
