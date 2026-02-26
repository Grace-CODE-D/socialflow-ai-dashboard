/**
 * Authentication Service Tests
 * Tests for re-authentication flows
 */

import { AuthService, SensitiveOperation } from '../../services/authService';

describe('AuthService', () => {
    let authService: AuthService;

    beforeEach(() => {
        authService = new AuthService({
            largeTransactionThreshold: 1000,
            authCooldownDuration: 5000, // 5 seconds for testing
            maxAuthAttempts: 3,
            biometricEnabled: false,
        });

        localStorage.clear();
    });

    describe('Authentication Requirements', () => {
        test('should require auth for large transactions', () => {
            const required = authService.requiresAuth(
                SensitiveOperation.LARGE_TRANSACTION,
                1500
            );
            expect(required).toBe(true);
        });

        test('should not require auth for small transactions', () => {
            const required = authService.requiresAuth(
                SensitiveOperation.LARGE_TRANSACTION,
                500
            );
            expect(required).toBe(false);
        });

        test('should require auth for account settings', () => {
            const required = authService.requiresAuth(SensitiveOperation.ACCOUNT_SETTINGS);
            expect(required).toBe(true);
        });

        test('should require auth for contract deployment', () => {
            const required = authService.requiresAuth(SensitiveOperation.CONTRACT_DEPLOYMENT);
            expect(required).toBe(true);
        });
    });

    describe('Wallet Authentication', () => {
        test('should authenticate with valid signature', async () => {
            const mockSign = jest.fn().mockResolvedValue('valid_signature');

            const result = await authService.authenticateWithWallet(
                SensitiveOperation.LARGE_TRANSACTION,
                mockSign
            );

            expect(result.success).toBe(true);
            expect(mockSign).toHaveBeenCalled();
            expect(authService.isAuthenticated()).toBe(true);
        });

        test('should fail authentication with invalid signature', async () => {
            const mockSign = jest.fn().mockResolvedValue('');

            const result = await authService.authenticateWithWallet(
                SensitiveOperation.LARGE_TRANSACTION,
                mockSign
            );

            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid signature');
            expect(authService.isAuthenticated()).toBe(false);
        });

        test('should fail authentication on error', async () => {
            const mockSign = jest.fn().mockRejectedValue(new Error('User rejected'));

            const result = await authService.authenticateWithWallet(
                SensitiveOperation.LARGE_TRANSACTION,
                mockSign
            );

            expect(result.success).toBe(false);
            expect(result.error).toBe('User rejected');
        });

        test('should record successful authentication', async () => {
            const mockSign = jest.fn().mockResolvedValue('valid_signature');

            await authService.authenticateWithWallet(
                SensitiveOperation.LARGE_TRANSACTION,
                mockSign
            );

            const history = authService.getAuthHistory();
            expect(history.length).toBeGreaterThan(0);
            expect(history[history.length - 1].success).toBe(true);
        });

        test('should record failed authentication', async () => {
            const mockSign = jest.fn().mockResolvedValue('');

            await authService.authenticateWithWallet(
                SensitiveOperation.LARGE_TRANSACTION,
                mockSign
            );

            const history = authService.getAuthHistory();
            expect(history.length).toBeGreaterThan(0);
            expect(history[history.length - 1].success).toBe(false);
        });
    });

    describe('Authentication Cooldown', () => {
        test('should activate cooldown after max attempts', async () => {
            const mockSign = jest.fn().mockResolvedValue('');

            // Fail 3 times
            for (let i = 0; i < 3; i++) {
                await authService.authenticateWithWallet(
                    SensitiveOperation.LARGE_TRANSACTION,
                    mockSign
                );
            }

            // Next attempt should be blocked
            const result = await authService.authenticateWithWallet(
                SensitiveOperation.LARGE_TRANSACTION,
                mockSign
            );

            expect(result.success).toBe(false);
            expect(result.error).toContain('Too many attempts');
        });

        test('should calculate cooldown remaining time', async () => {
            const mockSign = jest.fn().mockResolvedValue('');

            // Trigger cooldown
            for (let i = 0; i < 3; i++) {
                await authService.authenticateWithWallet(
                    SensitiveOperation.LARGE_TRANSACTION,
                    mockSign
                );
            }

            const remaining = authService.getCooldownRemaining();
            expect(remaining).toBeGreaterThan(0);
            expect(remaining).toBeLessThanOrEqual(5000);
        });

        test('should allow auth after cooldown expires', async (done) => {
            const mockSign = jest.fn().mockResolvedValue('');

            // Trigger cooldown
            for (let i = 0; i < 3; i++) {
                await authService.authenticateWithWallet(
                    SensitiveOperation.LARGE_TRANSACTION,
                    mockSign
                );
            }

            // Wait for cooldown to expire
            setTimeout(async () => {
                mockSign.mockResolvedValue('valid_signature');
                const result = await authService.authenticateWithWallet(
                    SensitiveOperation.LARGE_TRANSACTION,
                    mockSign
                );

                expect(result.success).toBe(true);
                done();
            }, 5500);
        }, 6000);
    });

    describe('Biometric Authentication', () => {
        test('should fail if biometrics not enabled', async () => {
            const result = await authService.authenticateWithBiometrics(
                SensitiveOperation.LARGE_TRANSACTION
            );

            expect(result.success).toBe(false);
            expect(result.error).toBe('Biometric authentication not enabled');
        });

        test('should enable biometrics if available', async () => {
            // Mock WebAuthn API
            (global as any).PublicKeyCredential = {
                isUserVerifyingPlatformAuthenticatorAvailable: jest
                    .fn()
                    .mockResolvedValue(true),
            };

            const result = await authService.enableBiometrics();
            expect(result.success).toBe(true);
            expect(authService.isBiometricsEnabled()).toBe(true);
        });

        test('should disable biometrics', async () => {
            // Enable first
            (global as any).PublicKeyCredential = {
                isUserVerifyingPlatformAuthenticatorAvailable: jest
                    .fn()
                    .mockResolvedValue(true),
            };
            await authService.enableBiometrics();

            // Then disable
            authService.disableBiometrics();
            expect(authService.isBiometricsEnabled()).toBe(false);
        });
    });

    describe('Authentication State', () => {
        test('should clear authentication', async () => {
            const mockSign = jest.fn().mockResolvedValue('valid_signature');

            await authService.authenticateWithWallet(
                SensitiveOperation.LARGE_TRANSACTION,
                mockSign
            );

            expect(authService.isAuthenticated()).toBe(true);

            authService.clearAuth();
            expect(authService.isAuthenticated()).toBe(false);
        });

        test('should persist auth state', async () => {
            const mockSign = jest.fn().mockResolvedValue('valid_signature');

            await authService.authenticateWithWallet(
                SensitiveOperation.LARGE_TRANSACTION,
                mockSign
            );

            // Create new instance
            const newService = new AuthService();
            const history = newService.getAuthHistory();

            expect(history.length).toBeGreaterThan(0);
        });
    });

    describe('Authentication History', () => {
        test('should track authentication history', async () => {
            const mockSign = jest.fn().mockResolvedValue('valid_signature');

            await authService.authenticateWithWallet(
                SensitiveOperation.LARGE_TRANSACTION,
                mockSign
            );

            await authService.authenticateWithWallet(
                SensitiveOperation.ACCOUNT_SETTINGS,
                mockSign
            );

            const history = authService.getAuthHistory();
            expect(history.length).toBe(2);
        });

        test('should limit history to 10 entries', async () => {
            const mockSign = jest.fn().mockResolvedValue('valid_signature');

            // Add 15 entries
            for (let i = 0; i < 15; i++) {
                await authService.authenticateWithWallet(
                    SensitiveOperation.LARGE_TRANSACTION,
                    mockSign
                );
            }

            const history = authService.getAuthHistory();
            expect(history.length).toBe(10);
        });

        test('should clear all auth data', () => {
            authService.clearAllData();

            const history = authService.getAuthHistory();
            expect(history.length).toBe(0);
            expect(authService.isAuthenticated()).toBe(false);
        });
    });
});
