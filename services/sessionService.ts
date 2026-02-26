/**
 * SessionService - Manages user session security
 * 
 * Features:
 * - 30-minute inactivity timeout
 * - Activity tracking (clicks, keypresses, mouse movement)
 * - Auto-disconnect on timeout
 * - Session refresh mechanism
 * - Timeout warning before disconnect
 */

export interface SessionConfig {
    timeoutDuration: number; // milliseconds
    warningDuration: number; // milliseconds before timeout to show warning
    activityEvents: string[];
}

export interface SessionState {
    isActive: boolean;
    lastActivity: number;
    sessionStarted: number;
    warningShown: boolean;
}

type SessionCallback = () => void;
type WarningCallback = (remainingTime: number) => void;

const DEFAULT_CONFIG: SessionConfig = {
    timeoutDuration: 30 * 60 * 1000, // 30 minutes
    warningDuration: 2 * 60 * 1000, // 2 minutes warning
    activityEvents: ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'],
};

class SessionService {
    private config: SessionConfig;
    private state: SessionState;
    private timeoutId: NodeJS.Timeout | null = null;
    private warningTimeoutId: NodeJS.Timeout | null = null;
    private onTimeoutCallback: SessionCallback | null = null;
    private onWarningCallback: WarningCallback | null = null;
    private onRefreshCallback: SessionCallback | null = null;
    private activityListeners: Array<{ event: string; handler: EventListener }> = [];

    constructor(config: Partial<SessionConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.state = {
            isActive: false,
            lastActivity: Date.now(),
            sessionStarted: Date.now(),
            warningShown: false,
        };
    }

    /**
     * Start session monitoring
     */
    startSession(): void {
        if (this.state.isActive) {
            console.warn('Session already active');
            return;
        }

        this.state = {
            isActive: true,
            lastActivity: Date.now(),
            sessionStarted: Date.now(),
            warningShown: false,
        };

        this.attachActivityListeners();
        this.resetTimeout();
        this.saveSessionState();

        console.log('Session started');
    }

    /**
     * End session monitoring
     */
    endSession(): void {
        if (!this.state.isActive) {
            return;
        }

        this.state.isActive = false;
        this.detachActivityListeners();
        this.clearTimeouts();
        this.clearSessionState();

        console.log('Session ended');
    }

    /**
     * Refresh session (reset timeout)
     */
    refreshSession(): void {
        if (!this.state.isActive) {
            console.warn('Cannot refresh inactive session');
            return;
        }

        this.state.lastActivity = Date.now();
        this.state.warningShown = false;
        this.resetTimeout();
        this.saveSessionState();

        if (this.onRefreshCallback) {
            this.onRefreshCallback();
        }

        console.log('Session refreshed');
    }

    /**
     * Register callback for session timeout
     */
    onTimeout(callback: SessionCallback): void {
        this.onTimeoutCallback = callback;
    }

    /**
     * Register callback for timeout warning
     */
    onWarning(callback: WarningCallback): void {
        this.onWarningCallback = callback;
    }

    /**
     * Register callback for session refresh
     */
    onRefresh(callback: SessionCallback): void {
        this.onRefreshCallback = callback;
    }

    /**
     * Get current session state
     */
    getSessionState(): SessionState {
        return { ...this.state };
    }

    /**
     * Get remaining time until timeout
     */
    getRemainingTime(): number {
        if (!this.state.isActive) {
            return 0;
        }

        const elapsed = Date.now() - this.state.lastActivity;
        const remaining = this.config.timeoutDuration - elapsed;
        return Math.max(0, remaining);
    }

    /**
     * Check if session is about to timeout
     */
    isNearTimeout(): boolean {
        const remaining = this.getRemainingTime();
        return remaining > 0 && remaining <= this.config.warningDuration;
    }

    /**
     * Attach activity listeners
     */
    private attachActivityListeners(): void {
        this.config.activityEvents.forEach((event) => {
            const handler = this.handleActivity.bind(this);
            window.addEventListener(event, handler, { passive: true });
            this.activityListeners.push({ event, handler });
        });
    }

    /**
     * Detach activity listeners
     */
    private detachActivityListeners(): void {
        this.activityListeners.forEach(({ event, handler }) => {
            window.removeEventListener(event, handler);
        });
        this.activityListeners = [];
    }

    /**
     * Handle user activity
     */
    private handleActivity(): void {
        if (!this.state.isActive) {
            return;
        }

        const now = Date.now();
        const timeSinceLastActivity = now - this.state.lastActivity;

        // Only update if more than 1 second has passed (debounce)
        if (timeSinceLastActivity > 1000) {
            this.state.lastActivity = now;
            this.state.warningShown = false;
            this.resetTimeout();
            this.saveSessionState();
        }
    }

    /**
     * Reset timeout timers
     */
    private resetTimeout(): void {
        this.clearTimeouts();

        // Set warning timeout
        const warningTime = this.config.timeoutDuration - this.config.warningDuration;
        this.warningTimeoutId = setTimeout(() => {
            this.showWarning();
        }, warningTime);

        // Set session timeout
        this.timeoutId = setTimeout(() => {
            this.handleTimeout();
        }, this.config.timeoutDuration);
    }

    /**
     * Clear all timeouts
     */
    private clearTimeouts(): void {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        if (this.warningTimeoutId) {
            clearTimeout(this.warningTimeoutId);
            this.warningTimeoutId = null;
        }
    }

    /**
     * Show timeout warning
     */
    private showWarning(): void {
        if (!this.state.isActive || this.state.warningShown) {
            return;
        }

        this.state.warningShown = true;
        const remainingTime = this.getRemainingTime();

        if (this.onWarningCallback) {
            this.onWarningCallback(remainingTime);
        }

        console.warn(`Session timeout warning: ${Math.floor(remainingTime / 1000)}s remaining`);
    }

    /**
     * Handle session timeout
     */
    private handleTimeout(): void {
        if (!this.state.isActive) {
            return;
        }

        console.log('Session timeout - disconnecting');
        this.endSession();

        if (this.onTimeoutCallback) {
            this.onTimeoutCallback();
        }
    }

    /**
     * Save session state to localStorage
     */
    private saveSessionState(): void {
        try {
            localStorage.setItem('socialflow_session_state', JSON.stringify({
                lastActivity: this.state.lastActivity,
                sessionStarted: this.state.sessionStarted,
            }));
        } catch (error) {
            console.error('Failed to save session state:', error);
        }
    }

    /**
     * Clear session state from localStorage
     */
    private clearSessionState(): void {
        try {
            localStorage.removeItem('socialflow_session_state');
        } catch (error) {
            console.error('Failed to clear session state:', error);
        }
    }

    /**
     * Restore session from localStorage
     */
    restoreSession(): boolean {
        try {
            const stored = localStorage.getItem('socialflow_session_state');
            if (!stored) {
                return false;
            }

            const savedState = JSON.parse(stored);
            const timeSinceLastActivity = Date.now() - savedState.lastActivity;

            // If last activity was within timeout duration, restore session
            if (timeSinceLastActivity < this.config.timeoutDuration) {
                this.state.lastActivity = savedState.lastActivity;
                this.state.sessionStarted = savedState.sessionStarted;
                this.startSession();
                return true;
            }

            // Session expired
            this.clearSessionState();
            return false;
        } catch (error) {
            console.error('Failed to restore session:', error);
            return false;
        }
    }

    /**
     * Get session duration
     */
    getSessionDuration(): number {
        if (!this.state.isActive) {
            return 0;
        }
        return Date.now() - this.state.sessionStarted;
    }

    /**
     * Format time for display
     */
    static formatTime(milliseconds: number): string {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        if (minutes > 0) {
            return `${minutes}m ${remainingSeconds}s`;
        }
        return `${remainingSeconds}s`;
    }
}

// Export singleton instance
export const sessionService = new SessionService();

// Export class for custom instances
export { SessionService };
