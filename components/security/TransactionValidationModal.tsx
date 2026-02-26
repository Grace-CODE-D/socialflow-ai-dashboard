import React from 'react';
import {
    ValidationResult,
    TransactionParams,
} from '../../services/transactionValidationService';

interface TransactionValidationModalProps {
    isOpen: boolean;
    validation: ValidationResult;
    transaction: TransactionParams;
    onConfirm: () => void;
    onCancel: () => void;
}

const MaterialIcon = ({ name, className }: { name: string; className?: string }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export const TransactionValidationModal: React.FC<TransactionValidationModalProps> = ({
    isOpen,
    validation,
    transaction,
    onConfirm,
    onCancel,
}) => {
    if (!isOpen) {
        return null;
    }

    const getRiskColor = () => {
        switch (validation.riskLevel) {
            case 'LOW':
                return 'text-teal-400 bg-teal-500/20 border-teal-500/20';
            case 'MEDIUM':
                return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/20';
            case 'HIGH':
                return 'text-orange-400 bg-orange-500/20 border-orange-500/20';
            case 'CRITICAL':
                return 'text-red-400 bg-red-500/20 border-red-500/20';
        }
    };

    const getRiskIcon = () => {
        switch (validation.riskLevel) {
            case 'LOW':
                return 'check_circle';
            case 'MEDIUM':
                return 'warning';
            case 'HIGH':
                return 'error';
            case 'CRITICAL':
                return 'dangerous';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-dark-surface border border-dark-border rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Transaction Validation</h2>
                    <div className={`px-4 py-2 rounded-xl border ${getRiskColor()} font-semibold flex items-center gap-2`}>
                        <MaterialIcon name={getRiskIcon()} />
                        {validation.riskLevel} RISK
                    </div>
                </div>

                {/* Transaction Details */}
                <div className="bg-dark-bg rounded-xl p-6 mb-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Transaction Details</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-subtext">Destination:</span>
                            <span className="text-white font-mono text-sm break-all ml-4">
                                {transaction.destination}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-subtext">Amount:</span>
                            <span className="text-white font-semibold">
                                {transaction.amount} {transaction.asset?.code || 'XLM'}
                            </span>
                        </div>
                        {transaction.asset && (
                            <div className="flex justify-between">
                                <span className="text-gray-subtext">Asset Issuer:</span>
                                <span className="text-white font-mono text-sm break-all ml-4">
                                    {transaction.asset.issuer}
                                </span>
                            </div>
                        )}
                        {transaction.memo && (
                            <div className="flex justify-between">
                                <span className="text-gray-subtext">Memo:</span>
                                <span className="text-white">{transaction.memo}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Errors */}
                {validation.errors.length > 0 && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 mb-6">
                        <div className="flex items-start gap-3 mb-4">
                            <MaterialIcon name="error" className="text-red-400 text-2xl" />
                            <div>
                                <h3 className="text-lg font-semibold text-red-400 mb-1">
                                    Critical Issues Found
                                </h3>
                                <p className="text-sm text-gray-subtext">
                                    The following issues must be resolved before proceeding
                                </p>
                            </div>
                        </div>
                        <ul className="space-y-2">
                            {validation.errors.map((error, index) => (
                                <li key={index} className="flex items-start gap-2 text-red-400">
                                    <MaterialIcon name="close" className="text-sm mt-0.5" />
                                    <span className="text-sm">{error}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Warnings */}
                {validation.warnings.length > 0 && (
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-6 mb-6">
                        <div className="flex items-start gap-3 mb-4">
                            <MaterialIcon name="warning" className="text-orange-400 text-2xl" />
                            <div>
                                <h3 className="text-lg font-semibold text-orange-400 mb-1">Warnings</h3>
                                <p className="text-sm text-gray-subtext">
                                    Please review these warnings carefully
                                </p>
                            </div>
                        </div>
                        <ul className="space-y-2">
                            {validation.warnings.map((warning, index) => (
                                <li key={index} className="flex items-start gap-2 text-orange-400">
                                    <MaterialIcon name="info" className="text-sm mt-0.5" />
                                    <span className="text-sm">{warning}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Success Message */}
                {validation.isValid && validation.warnings.length === 0 && (
                    <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-6 mb-6">
                        <div className="flex items-center gap-3">
                            <MaterialIcon name="check_circle" className="text-teal-400 text-2xl" />
                            <div>
                                <h3 className="text-lg font-semibold text-teal-400 mb-1">
                                    Transaction Validated
                                </h3>
                                <p className="text-sm text-gray-subtext">
                                    No issues found. Transaction is safe to proceed.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Security Tips */}
                <div className="bg-primary-blue/10 border border-primary-blue/20 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <MaterialIcon name="lightbulb" className="text-primary-blue" />
                        <div>
                            <p className="text-sm text-white font-medium mb-1">Security Tips</p>
                            <ul className="text-xs text-gray-subtext space-y-1">
                                <li>• Always verify the destination address carefully</li>
                                <li>• Double-check the transaction amount</li>
                                <li>• Ensure you trust the asset issuer</li>
                                <li>• Include a memo when sending to exchanges</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-6 py-3 rounded-xl border border-dark-border text-gray-subtext hover:text-white hover:bg-white/5 transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={!validation.isValid}
                        className={`flex-1 px-6 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${validation.isValid
                                ? 'bg-primary-blue text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20'
                                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        <MaterialIcon name="verified_user" />
                        {validation.isValid ? 'Confirm Transaction' : 'Cannot Proceed'}
                    </button>
                </div>

                {/* Disclaimer */}
                <p className="text-xs text-gray-subtext text-center mt-6">
                    By confirming, you acknowledge that you have reviewed and verified all transaction
                    details. Transactions on the blockchain are irreversible.
                </p>
            </div>
        </div>
    );
};
