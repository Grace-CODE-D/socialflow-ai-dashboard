/**
 * Session Service Tests
 * Tests for session timeout functionality
 */

import { SessionService } from '../../services/sessionService';

describe('SessionService', () => {
    let sessionService: SessionService;

    beforeEach(() => {
        // Create new instance with short timeout for testing
        sessionService = new SessionService({
            timeoutDuration: 5000, // 5 seconds
            warningDuration: 2000, // 2 seconds
            activityEvents: ['click', 'keypress'],
        });

        // Clear localStorage
        localStorage.clear();
    });

    afterEach(() => {
        sessionService.endSession();
    });

    describe('Session Lifecycle', () => {
        test('should start session successfully', () => {
            sessionService.startSession();
            const state = sessionService.getSessionState();

            expect(state.isActive).toBe(true);
            expect(state.lastActivity).toBeGreaterThan(0);
            expect(state.sessionStarted).toBeGreaterThan(0);
        });

        test('should end session successfully', () => {
            sessionService.startSession();
            sessionService.endSession();
            const state = sessionService.getSessionState();

            expect(state.isActive).toBe(false);
        });

        test('should not start session twice', () => {
            sessionService.startSession();
            const consoleSpy = jest.spyOn(console, 'warn');
            sessionService.startSession();

            expect(consoleSpy).toHaveBeenCalledWith('Session already active');
        });
    });

    describe('Session Timeout', () => {
        test('should timeout after inactivity', (done) => {
            sessionService.startSession();

            sessionService.onTimeout(() => {
                const state = sessionService.getSessionState();
                expect(state.isActive).toBe(false);
                done();
            });

            // Wait for timeout (5 seconds + buffer)
        }, 6000);

        test('should show warning before timeout', (done) => {
            sessionService.startSession();

            sessionService.onWarning((remainingTime) => {
                expect(remainingTime).toBeLessThanOrEqual(2000);
                expect(remainingTime).toBeGreaterThan(0);
                done();
            });

            // Wait for warning (3 seconds)
        }, 4000);

        test('should calculate remaining time correctly', () => {
            sessionService.startSession();
            const remaining = sessionService.getRemainingTime();

            expect(remaining).toBeLessThanOrEqual(5000);
            expect(remaining).toBeGreaterThan(4000);
        });
    });

    describe('Session Refresh', () => {
        test('should refresh session', () => {
            sessionService.startSession();
            const initialActivity = sessionService.getSessionState().lastActivity;

            // Wait a bit
            setTimeout(() => {
                sessionService.refreshSession();
                const newActivity = sessionService.getSessionState().lastActivity;

                expect(newActivity).toBeGreaterThan(initialActivity);
            }, 100);
        });

        test('should reset timeout on refresh', () => {
            sessionService.startSession();

            setTimeout(() => {
                sessionService.refreshSession();
                const remaining = sessionService.getRemainingTime();

                expect(remaining).toBeGreaterThan(4500);
            }, 1000);
        });

        test('should trigger refresh callback', (done) => {
            sessionService.startSession();

            sessionService.onRefresh(() => {
                done();
            });

            sessionService.refreshSession();
        });
    });

    describe('Session Persistence', () => {
        test('should save session state to localStorage', () => {
            sessionService.startSession();

            const stored = localStorage.getItem('socialflow_session_state');
            expect(stored).toBeTruthy();

            const state = JSON.parse(stored!);
            expect(state.lastActivity).toBeGreaterThan(0);
            expect(state.sessionStarted).toBeGreaterThan(0);
        });

        test('should restore session from localStorage', () => {
            sessionService.startSession();
            const originalState = sessionService.getSessionState();

            // Create new instance
            const newService = new SessionService();
            const restored = newService.restoreSession();

            expect(restored).toBe(true);
            expect(newService.getSessionState().isActive).toBe(true);
        });

        test('should not restore expired session', () => {
            // Set old session data
            localStorage.setItem(
                'socialflow_session_state',
                JSON.stringify({
                    lastActivity: Date.now() - 10000, // 10 seconds ago
                    sessionStarted: Date.now() - 10000,
                })
            );

            const restored = sessionService.restoreSession();
            expect(restored).toBe(false);
        });
    });

    describe('Session Duration', () => {
        test('should track session duration', (done) => {
            sessionService.startSession();

            setTimeout(() => {
                const duration = sessionService.getSessionDuration();
                expect(duration).toBeGreaterThanOrEqual(100);
                expect(duration).toBeLessThan(200);
                done();
            }, 100);
        });
    });

    describe('Utility Functions', () => {
        test('should format time correctly', () => {
            expect(SessionService.formatTime(30000)).toBe('30s');
            expect(SessionService.formatTime(90000)).toBe('1m 30s');
            expect(SessionService.formatTime(125000)).toBe('2m 5s');
        });

        test('should detect near timeout', () => {
            sessionService.startSession();

            // Initially not near timeout
            expect(sessionService.isNearTimeout()).toBe(false);

            // After some time, should be near timeout
            setTimeout(() => {
                expect(sessionService.isNearTimeout()).toBe(true);
            }, 3500);
        });
    });
});
