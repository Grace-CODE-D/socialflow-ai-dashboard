import React, { useState, useEffect } from 'react';
import { rateLimitService, RateLimitStatus } from '../../services/rateLimitService';

interface RateLimitIndicatorProps {
    type: 'transaction' | 'api';
    endpoint?: string;
    showDetails?: boolean;
}

const MaterialIcon = ({ name, className }: { name: string; className?: string }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export const RateLimitIndicator: React.FC<RateLimitIndicatorProps> = ({
    type,
    endpoint,
    showDetails = false,
}) => {
    const [status, setStatus] = useState<RateLimitStatus | null>(null);
    const [timeUntilReset, setTimeUntilReset] = useState<string>('');

    useEffect(() => {
        const updateStatus = () => {
            const newStatus =
                type === 'transaction'
                    ? rateLimitService.canSubmitTransaction()
                    : endpoint
                        ? rateLimitService.canMakeApiCall(endpoint)
                        : null;

            setStatus(newStatus);

            if (newStatus) {
                setTimeUntilReset(rateLimitService.getTimeUntilReset(newStatus.resetTime));
            }
        };

        updateStatus();
        const interval = setInterval(updateStatus, 1000);

        return () => clearInterval(interval);
    }, [type, endpoint]);

    if (!status) {
        return null;
    }

    const config = rateLimitService.getConfig();
    const limit = type === 'transaction' ? config.transactionLimit : config.apiCallLimit;
    const percentage = rateLimitService.getRateLimitPercentage(status, limit);

    const getStatusColor = () => {
        if (status.isLimited) return 'text-red-400 bg-red-500/20';
        if (percentage > 80) return 'text-orange-400 bg-orange-500/20';
        if (percentage > 50) return 'text-yellow-400 bg-yellow-500/20';
        return 'text-teal-400 bg-teal-500/20';
    };

    const getProgressColor = () => {
        if (status.isLimited) return 'bg-red-500';
        if (percentage > 80) return 'bg-orange-500';
        if (percentage > 50) return 'bg-yellow-500';
        return 'bg-teal-500';
    };

    if (!showDetails) {
        // Compact indicator
        return (
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
                <MaterialIcon name={status.isLimited ? 'block' : 'check_circle'} className="text-sm" />
                {status.remainingRequests}/{limit}
            </div>
        );
    }

    // Detailed indicator
    return (
        <div className="bg-dark-surface border border-dark-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <MaterialIcon
                        name={type === 'transaction' ? 'send' : 'api'}
                        className="text-primary-blue"
                    />
                    <span className="text-white font-medium">
                        {type === 'transaction' ? 'Transaction' : 'API'} Rate Limit
                    </span>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
                    {status.isLimited ? 'LIMITED' : 'ACTIVE'}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-subtext mb-1">
                    <span>
                        {limit - status.remainingRequests} / {limit} requests
                    </span>
                    <span>{percentage}%</span>
                </div>
                <div className="w-full h-2 bg-dark-bg rounded-full overflow-hidden">
                    <div
                        className={`h-full ${getProgressColor()} transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>

            {/* Status Info */}
            <div className="flex items-center justify-between text-xs">
                <span className="text-gray-subtext">
                    {status.isLimited ? 'Resets in:' : 'Window resets in:'}
                </span>
                <span className="text-white font-medium">{timeUntilReset}</span>
            </div>

            {/* Rate Limited Message */}
            {status.isLimited && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-start gap-2">
                        <MaterialIcon name="error" className="text-red-400 text-sm mt-0.5" />
                        <p className="text-xs text-red-400">
                            Rate limit exceeded. Please wait {timeUntilReset} before trying again.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

// Compact version for toolbar/header
export const RateLimitBadge: React.FC<{ type: 'transaction' | 'api' }> = ({ type }) => {
    return <RateLimitIndicator type={type} showDetails={false} />;
};

// Full panel version
export const RateLimitPanel: React.FC = () => {
    const [violations, setViolations] = useState<any[]>([]);

    useEffect(() => {
        setViolations(rateLimitService.getViolations(5));
    }, []);

    const handleClearViolations = () => {
        rateLimitService.clearViolations();
        setViolations([]);
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <RateLimitIndicator type="transaction" showDetails={true} />
                <RateLimitIndicator type="api" endpoint="horizon" showDetails={true} />
            </div>

            {/* Violations Log */}
            {violations.length > 0 && (
                <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <MaterialIcon name="history" className="text-orange-400" />
                            <h3 className="text-lg font-semibold text-white">Recent Violations</h3>
                        </div>
                        <button
                            onClick={handleClearViolations}
                            className="text-sm text-gray-subtext hover:text-white transition-colors"
                        >
                            Clear
                        </button>
                    </div>

                    <div className="space-y-2">
                        {violations.map((violation, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-dark-bg rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <MaterialIcon
                                        name={violation.type === 'TRANSACTION' ? 'send' : 'api'}
                                        className="text-orange-400"
                                    />
                                    <div>
                                        <p className="text-sm text-white">{violation.message}</p>
                                        {violation.endpoint && (
                                            <p className="text-xs text-gray-subtext">{violation.endpoint}</p>
                                        )}
                                    </div>
                                </div>
                                <span className="text-xs text-gray-subtext">
                                    {new Date(violation.timestamp).toLocaleTimeString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
