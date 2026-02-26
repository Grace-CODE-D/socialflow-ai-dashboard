import React, { useState, useEffect } from 'react';
import { sessionService, SessionService } from '../../services/sessionService';

interface SessionTimeoutWarningProps {
    onRefresh: () => void;
    onLogout: () => void;
}

const MaterialIcon = ({ name, className }: { name: string; className?: string }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export const SessionTimeoutWarning: React.FC<SessionTimeoutWarningProps> = ({
    onRefresh,
    onLogout,
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [remainingTime, setRemainingTime] = useState(0);

    useEffect(() => {
        // Listen for timeout warning
        sessionService.onWarning((time) => {
            setIsVisible(true);
            setRemainingTime(time);
        });

        // Update remaining time every second
        const interval = setInterval(() => {
            if (isVisible) {
                const remaining = sessionService.getRemainingTime();
                setRemainingTime(remaining);

                if (remaining <= 0) {
                    setIsVisible(false);
                }
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isVisible]);

    const handleRefresh = () => {
        sessionService.refreshSession();
        setIsVisible(false);
        onRefresh();
    };

    const handleLogout = () => {
        sessionService.endSession();
        setIsVisible(false);
        onLogout();
    };

    if (!isVisible) {
        return null;
    }

    const formattedTime = SessionService.formatTime(remainingTime);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-dark-surface border border-dark-border rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-scale-in">
                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <MaterialIcon name="schedule" className="text-4xl text-orange-400" />
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-white text-center mb-3">
                    Session Timeout Warning
                </h2>

                {/* Message */}
                <p className="text-gray-subtext text-center mb-6">
                    Your session will expire in <span className="text-orange-400 font-bold">{formattedTime}</span> due to inactivity.
                    Would you like to continue your session?
                </p>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-dark-bg rounded-full mb-8 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-1000"
                        style={{
                            width: `${(remainingTime / (2 * 60 * 1000)) * 100}%`,
                        }}
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                    <button
                        onClick={handleLogout}
                        className="flex-1 px-6 py-3 rounded-xl border border-dark-border text-gray-subtext hover:text-white hover:bg-white/5 transition-colors font-medium"
                    >
                        Logout
                    </button>
                    <button
                        onClick={handleRefresh}
                        className="flex-1 px-6 py-3 rounded-xl bg-primary-blue text-white hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-500/20"
                    >
                        Continue Session
                    </button>
                </div>

                {/* Info */}
                <p className="text-xs text-gray-subtext text-center mt-6">
                    Sessions automatically expire after 30 minutes of inactivity for your security.
                </p>
            </div>
        </div>
    );
};
