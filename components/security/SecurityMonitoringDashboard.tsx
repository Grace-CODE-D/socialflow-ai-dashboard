import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import {
    securityMonitoringService,
    SecurityEvent,
    SecurityAlert,
    SecuritySeverity,
    SecurityEventType,
} from '../../services/securityMonitoringService';

const MaterialIcon = ({ name, className }: { name: string; className?: string }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export const SecurityMonitoringDashboard: React.FC = () => {
    const [events, setEvents] = useState<SecurityEvent[]>([]);
    const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
    const [metrics, setMetrics] = useState<any>(null);
    const [selectedSeverity, setSelectedSeverity] = useState<SecuritySeverity | 'ALL'>('ALL');

    useEffect(() => {
        loadData();

        // Listen for new alerts
        securityMonitoringService.onAlert((alert) => {
            setAlerts((prev) => [alert, ...prev]);
        });

        // Refresh every 5 seconds
        const interval = setInterval(loadData, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadData = () => {
        setEvents(securityMonitoringService.getEvents(50));
        setAlerts(securityMonitoringService.getAlerts());
        setMetrics(securityMonitoringService.getMetrics());
    };

    const handleAcknowledgeAlert = (alertId: string) => {
        securityMonitoringService.acknowledgeAlert(alertId);
        loadData();
    };

    const handleClearAcknowledged = () => {
        securityMonitoringService.clearAcknowledgedAlerts();
        loadData();
    };

    const handleExportAudit = (format: 'json' | 'csv') => {
        securityMonitoringService.downloadAuditTrail(format);
    };

    const getSeverityColor = (severity: SecuritySeverity) => {
        switch (severity) {
            case SecuritySeverity.INFO:
                return 'text-blue-400 bg-blue-500/20';
            case SecuritySeverity.WARNING:
                return 'text-yellow-400 bg-yellow-500/20';
            case SecuritySeverity.ERROR:
                return 'text-orange-400 bg-orange-500/20';
            case SecuritySeverity.CRITICAL:
                return 'text-red-400 bg-red-500/20';
        }
    };

    const getEventIcon = (type: SecurityEventType) => {
        if (type.includes('LOGIN')) return 'login';
        if (type.includes('AUTH')) return 'verified_user';
        if (type.includes('TRANSACTION')) return 'send';
        if (type.includes('RATE_LIMIT')) return 'speed';
        if (type.includes('ANOMALY')) return 'warning';
        if (type.includes('ENCRYPTION')) return 'lock';
        return 'info';
    };

    const filteredEvents =
        selectedSeverity === 'ALL'
            ? events
            : events.filter((e) => e.severity === selectedSeverity);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Security Monitoring</h2>
                    <p className="text-sm text-gray-subtext mt-1">
                        Real-time security event tracking and anomaly detection
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => handleExportAudit('json')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dark-border text-gray-subtext hover:text-white hover:bg-white/5 transition-colors"
                    >
                        <MaterialIcon name="download" className="text-sm" />
                        Export JSON
                    </button>
                    <button
                        onClick={() => handleExportAudit('csv')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dark-border text-gray-subtext hover:text-white hover:bg-white/5 transition-colors"
                    >
                        <MaterialIcon name="table_chart" className="text-sm" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Metrics Overview */}
            {metrics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-subtext mb-1">Total Events</p>
                                <p className="text-2xl font-bold text-white">{metrics.totalEvents}</p>
                            </div>
                            <MaterialIcon name="event" className="text-primary-blue text-3xl" />
                        </div>
                    </Card>

                    <Card>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-subtext mb-1">Active Alerts</p>
                                <p className="text-2xl font-bold text-white">{metrics.alertsCount}</p>
                            </div>
                            <MaterialIcon name="notifications_active" className="text-orange-400 text-3xl" />
                        </div>
                    </Card>

                    <Card>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-subtext mb-1">Anomalies</p>
                                <p className="text-2xl font-bold text-white">{metrics.anomaliesDetected}</p>
                            </div>
                            <MaterialIcon name="warning" className="text-yellow-400 text-3xl" />
                        </div>
                    </Card>

                    <Card>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-subtext mb-1">Last Event</p>
                                <p className="text-sm font-medium text-white">
                                    {metrics.lastEventTime
                                        ? new Date(metrics.lastEventTime).toLocaleTimeString()
                                        : 'N/A'}
                                </p>
                            </div>
                            <MaterialIcon name="schedule" className="text-primary-teal text-3xl" />
                        </div>
                    </Card>
                </div>
            )}

            {/* Active Alerts */}
            {alerts.length > 0 && (
                <Card>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <MaterialIcon name="notifications_active" className="text-orange-400" />
                            <h3 className="text-lg font-semibold text-white">Active Alerts</h3>
                        </div>
                        <button
                            onClick={handleClearAcknowledged}
                            className="text-sm text-gray-subtext hover:text-white transition-colors"
                        >
                            Clear Acknowledged
                        </button>
                    </div>

                    <div className="space-y-3">
                        {alerts.map((alert) => (
                            <div
                                key={alert.id}
                                className={`p-4 rounded-xl border ${getSeverityColor(alert.severity)}`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-start gap-3">
                                        <MaterialIcon name="error" className="text-xl mt-0.5" />
                                        <div>
                                            <p className="font-semibold">{alert.message}</p>
                                            <p className="text-xs opacity-75 mt-1">
                                                {new Date(alert.timestamp).toLocaleString()} • {alert.events.length}{' '}
                                                related events
                                            </p>
                                        </div>
                                    </div>
                                    {!alert.acknowledged && (
                                        <button
                                            onClick={() => handleAcknowledgeAlert(alert.id)}
                                            className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium transition-colors"
                                        >
                                            Acknowledge
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Security Events */}
            <Card>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">Security Events</h3>
                    <div className="flex gap-2">
                        {['ALL', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'].map((severity) => (
                            <button
                                key={severity}
                                onClick={() => setSelectedSeverity(severity as any)}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${selectedSeverity === severity
                                        ? 'bg-primary-blue text-white'
                                        : 'bg-dark-bg text-gray-subtext hover:text-white'
                                    }`}
                            >
                                {severity}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {filteredEvents.map((event) => (
                        <div
                            key={event.id}
                            className="flex items-start gap-3 p-3 bg-dark-bg rounded-lg hover:bg-white/5 transition-colors"
                        >
                            <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${getSeverityColor(
                                    event.severity
                                )}`}
                            >
                                <MaterialIcon name={getEventIcon(event.type)} className="text-sm" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                        <p className="text-sm text-white font-medium">{event.message}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span
                                                className={`text-xs px-2 py-0.5 rounded-full ${getSeverityColor(
                                                    event.severity
                                                )}`}
                                            >
                                                {event.severity}
                                            </span>
                                            <span className="text-xs text-gray-subtext">{event.type}</span>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-subtext whitespace-nowrap">
                                        {new Date(event.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                                {event.metadata && Object.keys(event.metadata).length > 0 && (
                                    <details className="mt-2">
                                        <summary className="text-xs text-gray-subtext cursor-pointer hover:text-white">
                                            View Details
                                        </summary>
                                        <pre className="text-xs text-gray-subtext mt-2 p-2 bg-black/20 rounded overflow-x-auto">
                                            {JSON.stringify(event.metadata, null, 2)}
                                        </pre>
                                    </details>
                                )}
                            </div>
                        </div>
                    ))}

                    {filteredEvents.length === 0 && (
                        <div className="text-center py-12">
                            <MaterialIcon name="check_circle" className="text-4xl text-teal-400 mb-2" />
                            <p className="text-gray-subtext">No events found</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};
