/**
 * SecurityMonitoringService - Monitors and logs security-relevant events
 * 
 * Features:
 * - Monitor for suspicious activity patterns
 * - Log all security-relevant events
 * - Implement anomaly detection
 * - Add security alerts for unusual behavior
 * - Create security audit trail
 */

export enum SecurityEventType {
    // Authentication Events
    LOGIN_SUCCESS = 'LOGIN_SUCCESS',
    LOGIN_FAILURE = 'LOGIN_FAILURE',
    LOGOUT = 'LOGOUT',
    SESSION_TIMEOUT = 'SESSION_TIMEOUT',
    SESSION_REFRESH = 'SESSION_REFRESH',

    // Authorization Events
    AUTH_REQUIRED = 'AUTH_REQUIRED',
    AUTH_SUCCESS = 'AUTH_SUCCESS',
    AUTH_FAILURE = 'AUTH_FAILURE',
    AUTH_COOLDOWN = 'AUTH_COOLDOWN',

    // Transaction Events
    TRANSACTION_INITIATED = 'TRANSACTION_INITIATED',
    TRANSACTION_VALIDATED = 'TRANSACTION_VALIDATED',
    TRANSACTION_REJECTED = 'TRANSACTION_REJECTED',
    TRANSACTION_SIGNED = 'TRANSACTION_SIGNED',
    TRANSACTION_SUBMITTED = 'TRANSACTION_SUBMITTED',
    TRANSACTION_FAILED = 'TRANSACTION_FAILED',

    // Rate Limiting Events
    RATE_LIMIT_WARNING = 'RATE_LIMIT_WARNING',
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
    RATE_LIMIT_RESET = 'RATE_LIMIT_RESET',

    // Security Events
    SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
    ANOMALY_DETECTED = 'ANOMALY_DETECTED',
    MALICIOUS_ADDRESS = 'MALICIOUS_ADDRESS',
    FAKE_ASSET_DETECTED = 'FAKE_ASSET_DETECTED',
    LARGE_TRANSACTION = 'LARGE_TRANSACTION',
    RAPID_TRANSACTIONS = 'RAPID_TRANSACTIONS',

    // Data Events
    DATA_ENCRYPTED = 'DATA_ENCRYPTED',
    DATA_DECRYPTED = 'DATA_DECRYPTED',
    ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',

    // Configuration Events
    CONFIG_CHANGED = 'CONFIG_CHANGED',
    SECURITY_SETTINGS_CHANGED = 'SECURITY_SETTINGS_CHANGED',
}

export enum SecuritySeverity {
    INFO = 'INFO',
    WARNING = 'WARNING',
    ERROR = 'ERROR',
    CRITICAL = 'CRITICAL',
}

export interface SecurityEvent {
    id: string;
    timestamp: number;
    type: SecurityEventType;
    severity: SecuritySeverity;
    message: string;
    metadata?: Record<string, any>;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
}

export interface SecurityAlert {
    id: string;
    timestamp: number;
    type: string;
    severity: SecuritySeverity;
    message: string;
    events: SecurityEvent[];
    acknowledged: boolean;
}

export interface AnomalyPattern {
    type: string;
    threshold: number;
    timeWindow: number; // milliseconds
    description: string;
}

export interface SecurityMetrics {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    alertsCount: number;
    anomaliesDetected: number;
    lastEventTime: number;
}

const ANOMALY_PATTERNS: AnomalyPattern[] = [
    {
        type: 'RAPID_LOGIN_ATTEMPTS',
        threshold: 5,
        timeWindow: 5 * 60 * 1000, // 5 minutes
        description: 'Multiple login attempts in short time',
    },
    {
        type: 'RAPID_TRANSACTIONS',
        threshold: 10,
        timeWindow: 10 * 60 * 1000, // 10 minutes
        description: 'Unusual number of transactions',
    },
    {
        type: 'MULTIPLE_AUTH_FAILURES',
        threshold: 3,
        timeWindow: 5 * 60 * 1000, // 5 minutes
        description: 'Multiple authentication failures',
    },
    {
        type: 'UNUSUAL_TRANSACTION_PATTERN',
        threshold: 5,
        timeWindow: 30 * 60 * 1000, // 30 minutes
        description: 'Unusual transaction pattern detected',
    },
    {
        type: 'RATE_LIMIT_VIOLATIONS',
        threshold: 3,
        timeWindow: 10 * 60 * 1000, // 10 minutes
        description: 'Multiple rate limit violations',
    },
];

class SecurityMonitoringService {
    private events: SecurityEvent[] = [];
    private alerts: SecurityAlert[] = [];
    private maxEvents: number = 1000;
    private maxAlerts: number = 100;
    private alertCallbacks: Array<(alert: SecurityAlert) => void> = [];

    constructor() {
        this.loadFromStorage();
    }

    /**
     * Log a security event
     */
    logEvent(
        type: SecurityEventType,
        severity: SecuritySeverity,
        message: string,
        metadata?: Record<string, any>
    ): SecurityEvent {
        const event: SecurityEvent = {
            id: this.generateId(),
            timestamp: Date.now(),
            type,
            severity,
            message,
            metadata,
            userId: this.getCurrentUserId(),
            ipAddress: this.getClientIpAddress(),
            userAgent: navigator.userAgent,
        };

        this.events.push(event);

        // Keep only last N events
        if (this.events.length > this.maxEvents) {
            this.events = this.events.slice(-this.maxEvents);
        }

        // Save to storage
        this.saveToStorage();

        // Check for anomalies
        this.checkForAnomalies(event);

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.log(`[Security] ${severity} - ${type}: ${message}`, metadata);
        }

        return event;
    }

    /**
     * Create a security alert
     */
    createAlert(
        type: string,
        severity: SecuritySeverity,
        message: string,
        relatedEvents: SecurityEvent[]
    ): SecurityAlert {
        const alert: SecurityAlert = {
            id: this.generateId(),
            timestamp: Date.now(),
            type,
            severity,
            message,
            events: relatedEvents,
            acknowledged: false,
        };

        this.alerts.push(alert);

        // Keep only last N alerts
        if (this.alerts.length > this.maxAlerts) {
            this.alerts = this.alerts.slice(-this.maxAlerts);
        }

        // Save to storage
        this.saveToStorage();

        // Trigger alert callbacks
        this.alertCallbacks.forEach((callback) => callback(alert));

        // Log critical alerts
        if (severity === SecuritySeverity.CRITICAL) {
            console.error(`[Security Alert] ${type}: ${message}`);
        }

        return alert;
    }

    /**
     * Check for anomalies based on patterns
     */
    private checkForAnomalies(newEvent: SecurityEvent): void {
        ANOMALY_PATTERNS.forEach((pattern) => {
            const relevantEvents = this.getRecentEvents(pattern.timeWindow, this.getPatternEventTypes(pattern.type));

            if (relevantEvents.length >= pattern.threshold) {
                // Anomaly detected
                this.logEvent(
                    SecurityEventType.ANOMALY_DETECTED,
                    SecuritySeverity.WARNING,
                    `Anomaly detected: ${pattern.description}`,
                    {
                        pattern: pattern.type,
                        eventCount: relevantEvents.length,
                        threshold: pattern.threshold,
                        timeWindow: pattern.timeWindow,
                    }
                );

                // Create alert
                this.createAlert(
                    pattern.type,
                    SecuritySeverity.WARNING,
                    `${pattern.description} (${relevantEvents.length} events in ${pattern.timeWindow / 60000} minutes)`,
                    relevantEvents
                );
            }
        });
    }

    /**
     * Get event types relevant to a pattern
     */
    private getPatternEventTypes(patternType: string): SecurityEventType[] {
        switch (patternType) {
            case 'RAPID_LOGIN_ATTEMPTS':
                return [SecurityEventType.LOGIN_FAILURE, SecurityEventType.LOGIN_SUCCESS];
            case 'RAPID_TRANSACTIONS':
                return [SecurityEventType.TRANSACTION_SUBMITTED];
            case 'MULTIPLE_AUTH_FAILURES':
                return [SecurityEventType.AUTH_FAILURE];
            case 'UNUSUAL_TRANSACTION_PATTERN':
                return [
                    SecurityEventType.TRANSACTION_INITIATED,
                    SecurityEventType.TRANSACTION_REJECTED,
                    SecurityEventType.LARGE_TRANSACTION,
                ];
            case 'RATE_LIMIT_VIOLATIONS':
                return [SecurityEventType.RATE_LIMIT_EXCEEDED];
            default:
                return [];
        }
    }

    /**
     * Get recent events within time window
     */
    private getRecentEvents(timeWindow: number, types?: SecurityEventType[]): SecurityEvent[] {
        const cutoff = Date.now() - timeWindow;
        return this.events.filter((event) => {
            const isRecent = event.timestamp > cutoff;
            const matchesType = !types || types.includes(event.type);
            return isRecent && matchesType;
        });
    }

    /**
     * Get all events
     */
    getEvents(limit?: number, types?: SecurityEventType[]): SecurityEvent[] {
        let filtered = types ? this.events.filter((e) => types.includes(e.type)) : this.events;
        return limit ? filtered.slice(-limit).reverse() : filtered.slice().reverse();
    }

    /**
     * Get events by severity
     */
    getEventsBySeverity(severity: SecuritySeverity, limit?: number): SecurityEvent[] {
        const filtered = this.events.filter((e) => e.severity === severity);
        return limit ? filtered.slice(-limit).reverse() : filtered.slice().reverse();
    }

    /**
     * Get events by time range
     */
    getEventsByTimeRange(startTime: number, endTime: number): SecurityEvent[] {
        return this.events
            .filter((e) => e.timestamp >= startTime && e.timestamp <= endTime)
            .reverse();
    }

    /**
     * Get all alerts
     */
    getAlerts(includeAcknowledged: boolean = false): SecurityAlert[] {
        const filtered = includeAcknowledged
            ? this.alerts
            : this.alerts.filter((a) => !a.acknowledged);
        return filtered.slice().reverse();
    }

    /**
     * Acknowledge an alert
     */
    acknowledgeAlert(alertId: string): void {
        const alert = this.alerts.find((a) => a.id === alertId);
        if (alert) {
            alert.acknowledged = true;
            this.saveToStorage();
        }
    }

    /**
     * Clear acknowledged alerts
     */
    clearAcknowledgedAlerts(): void {
        this.alerts = this.alerts.filter((a) => !a.acknowledged);
        this.saveToStorage();
    }

    /**
     * Get security metrics
     */
    getMetrics(): SecurityMetrics {
        const eventsByType: Record<string, number> = {};
        const eventsBySeverity: Record<string, number> = {};

        this.events.forEach((event) => {
            eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
            eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
        });

        return {
            totalEvents: this.events.length,
            eventsByType,
            eventsBySeverity,
            alertsCount: this.alerts.filter((a) => !a.acknowledged).length,
            anomaliesDetected: this.events.filter((e) => e.type === SecurityEventType.ANOMALY_DETECTED)
                .length,
            lastEventTime: this.events.length > 0 ? this.events[this.events.length - 1].timestamp : 0,
        };
    }

    /**
     * Register alert callback
     */
    onAlert(callback: (alert: SecurityAlert) => void): void {
        this.alertCallbacks.push(callback);
    }

    /**
     * Export audit trail
     */
    exportAuditTrail(format: 'json' | 'csv' = 'json'): string {
        if (format === 'csv') {
            return this.exportAsCSV();
        }
        return JSON.stringify(
            {
                exportDate: new Date().toISOString(),
                events: this.events,
                alerts: this.alerts,
                metrics: this.getMetrics(),
            },
            null,
            2
        );
    }

    /**
     * Export as CSV
     */
    private exportAsCSV(): string {
        const headers = [
            'Timestamp',
            'Type',
            'Severity',
            'Message',
            'User ID',
            'IP Address',
            'User Agent',
        ];
        const rows = this.events.map((event) => [
            new Date(event.timestamp).toISOString(),
            event.type,
            event.severity,
            event.message,
            event.userId || '',
            event.ipAddress || '',
            event.userAgent || '',
        ]);

        return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    }

    /**
     * Download audit trail
     */
    downloadAuditTrail(format: 'json' | 'csv' = 'json'): void {
        const content = this.exportAuditTrail(format);
        const blob = new Blob([content], {
            type: format === 'json' ? 'application/json' : 'text/csv',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `security-audit-${Date.now()}.${format}`;
        link.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Clear all events
     */
    clearEvents(): void {
        this.events = [];
        this.saveToStorage();
    }

    /**
     * Clear all alerts
     */
    clearAlerts(): void {
        this.alerts = [];
        this.saveToStorage();
    }

    /**
     * Generate unique ID
     */
    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get current user ID (placeholder)
     */
    private getCurrentUserId(): string | undefined {
        // In production, get from auth service
        return undefined;
    }

    /**
     * Get client IP address (placeholder)
     */
    private getClientIpAddress(): string | undefined {
        // In production, get from server or API
        return undefined;
    }

    /**
     * Save to localStorage
     */
    private saveToStorage(): void {
        try {
            localStorage.setItem(
                'security_monitoring_events',
                JSON.stringify(this.events.slice(-this.maxEvents))
            );
            localStorage.setItem(
                'security_monitoring_alerts',
                JSON.stringify(this.alerts.slice(-this.maxAlerts))
            );
        } catch (error) {
            console.error('Failed to save security monitoring data:', error);
        }
    }

    /**
     * Load from localStorage
     */
    private loadFromStorage(): void {
        try {
            const eventsData = localStorage.getItem('security_monitoring_events');
            const alertsData = localStorage.getItem('security_monitoring_alerts');

            if (eventsData) {
                this.events = JSON.parse(eventsData);
            }
            if (alertsData) {
                this.alerts = JSON.parse(alertsData);
            }
        } catch (error) {
            console.error('Failed to load security monitoring data:', error);
        }
    }

    /**
     * Get suspicious activity summary
     */
    getSuspiciousActivitySummary(): {
        recentAnomalies: SecurityEvent[];
        activeAlerts: SecurityAlert[];
        criticalEvents: SecurityEvent[];
    } {
        const last24Hours = Date.now() - 24 * 60 * 60 * 1000;

        return {
            recentAnomalies: this.events
                .filter(
                    (e) =>
                        e.type === SecurityEventType.ANOMALY_DETECTED && e.timestamp > last24Hours
                )
                .slice(-10)
                .reverse(),
            activeAlerts: this.alerts.filter((a) => !a.acknowledged).slice(-10).reverse(),
            criticalEvents: this.events
                .filter((e) => e.severity === SecuritySeverity.CRITICAL && e.timestamp > last24Hours)
                .slice(-10)
                .reverse(),
        };
    }
}

// Export singleton instance
export const securityMonitoringService = new SecurityMonitoringService();

// Export class for custom instances
export { SecurityMonitoringService };
