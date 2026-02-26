/**
 * AuthService - Manages re-authentication for sensitive operations
 * 
 * Features:
 * - Wallet signature verification for large transactions
 * - Re-authentication for account settings changes
 * - Identity verification for contract deployments
 * - Biometric authentication support
 * - Authentication cooldown mechanism
 */

export interface AuthConfig {
    largeTransactionThreshold: number; // XLM amount
    authCooldownDuration: number; // milliseconds
    maxAuthAttempts: number;
    biometricEnabled: boolean;
}

export interface AuthAttempt {
    timestamp: number;
    success: boolean;
    operation: string;
}

export interface AuthState {
    lastAuthTime: number;
    authAttempts: AuthAttempt[];
    isAuthenticated: boolean;
    cooldownUntil: number;
}

export enum SensitiveOperation {
    LARGE_TRANSACTION = 'LARGE_TRANSACTION',
    ACCOUNT_SETTINGS = 'ACCOUNT_SETTINGS',
    CONTRACT_DEPLOYMENT = 'CONTRACT_DEPLOYMENT',
    WALLET_EXPORT = 'WALLET_EXPORT',
    SECURITY_SETTINGS = 'SECURITY_SETTINGS',
}

const DEFAULT_CONFIG: AuthConfig = {
    largeTransactionThreshold: 1000, // 1000 XLM
    authCooldownDuration: 5 * 60 * 1000, // 5 minutes
    maxAuthAttempts: 3,
    biometricEnabled: false,
};

class AuthService {
    private config: AuthConfig;
    private state: AuthState;

    constructor(config: Partial<AuthConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.state = {
            lastAuthTime: 0,
            authAttempts: [],
            isAuthenticated: false,
            cooldownUntil: 0,
        };
        this.loadState();
    }

    /**
     * Check if operation requires re-authentication
     */
    requiresAuth(operation: SensitiveOperation, amount?: number): boolean {
        // Check if in cooldown
        if (this.isInCooldown()) {
            return false; // Already authenticated recently
        }

        switch (operation) {
            case SensitiveOperation.LARGE_TRANSACTION:
                return amount !== undefined && amount >= this.config.largeTransactionThreshold;

            case SensitiveOperation.ACCOUNT_SETTINGS:
            case SensitiveOperation.CONTRACT_DEPLOYMENT:
            case SensitiveOperation.WALLET_EXPORT:
            case SensitiveOperation.SECURITY_SETTINGS:
                return true;

            default:
                return false;
        }
    }

    /**
     * Authenticate with wallet signature
     */
    async authenticateWithWallet(
        operation: SensitiveOperation,
        signMessage: (message: string) => Promise<string>
    ): Promise<{ success: boolean; error?: string }> {
        // Check cooldown
        if (this.isInCooldown()) {
            const remaining = this.getCooldownRemaining();
            return {
                success: false,
                error: `Too many attempts. Please wait ${Math.ceil(remaining / 1000)}s`,
            };
        }

        // Check max attempts
        const recentAttempts = this.getRecentAttempts();
        if (recentAttempts.length >= this.config.maxAuthAttempts) {
            this.startCooldown();
            return {
                success: false,
                error: 'Maximum authentication attempts reached. Please try again later.',
            };
        }

        try {
            // Create challenge message
            const timestamp = Date.now();
            const challenge = this.createChallenge(operation, timestamp);

            // Request signature
            const signature = await signMessage(challenge);

            // Verify signature (in production, verify on backend)
            if (signature && signature.length > 0) {
                this.recordAuthAttempt(operation, true);
                this.state.isAuthenticated = true;
                this.state.lastAuthTime = timestamp;
                this.saveState();

                return { success: true };
            }

            this.recordAuthAttempt(operation, false);
            return {
                success: false,
                error: 'Invalid signature',
            };
        } catch (error) {
            this.recordAuthAttempt(operation, false);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Authentication failed',
            };
        }
    }

    /**
     * Authenticate with biometrics (if available)
     */
    async authenticateWithBiometrics(
        operation: SensitiveOperation
    ): Promise<{ success: boolean; error?: string }> {
        if (!this.config.biometricEnabled) {
            return {
                success: false,
                error: 'Biometric authentication not enabled',
            };
        }

        // Check if Web Authentication API is available
        if (!window.PublicKeyCredential) {
            return {
                success: false,
                error: 'Biometric authentication not supported',
            };
        }

        try {
            // Check if biometric is available
            const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();

            if (!available) {
                return {
                    success: false,
                    error: 'Biometric authentication not available on this device',
                };
            }

            // In production, implement full WebAuthn flow
            // For now, simulate biometric check
            const timestamp = Date.now();
            this.recordAuthAttempt(operation, true);
            this.state.isAuthenticated = true;
            this.state.lastAuthTime = timestamp;
            this.saveState();

            return { success: true };
        } catch (error) {
            this.recordAuthAttempt(operation, false);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Biometric authentication failed',
            };
        }
    }

    /**
     * Verify if user is currently authenticated
     */
    isAuthenticated(): boolean {
        return this.state.isAuthenticated && !this.isInCooldown();
    }

    /**
     * Clear authentication state
     */
    clearAuth(): void {
        this.state.isAuthenticated = false;
        this.state.lastAuthTime = 0;
        this.saveState();
    }

    /**
     * Check if in cooldown period
     */
    private isInCooldown(): boolean {
        return Date.now() < this.state.cooldownUntil;
    }

    /**
     * Get remaining cooldown time
     */
    getCooldownRemaining(): number {
        if (!this.isInCooldown()) {
            return 0;
        }
        return this.state.cooldownUntil - Date.now();
    }

    /**
     * Start cooldown period
     */
    private startCooldown(): void {
        this.state.cooldownUntil = Date.now() + this.config.authCooldownDuration;
        this.saveState();
    }

    /**
     * Create authentication challenge
     */
    private createChallenge(operation: SensitiveOperation, timestamp: number): string {
        return `SocialFlow Authentication\nOperation: ${operation}\nTimestamp: ${timestamp}\nPlease sign this message to verify your identity.`;
    }

    /**
     * Record authentication attempt
     */
    private recordAuthAttempt(operation: string, success: boolean): void {
        const attempt: AuthAttempt = {
            timestamp: Date.now(),
            success,
            operation,
        };

        this.state.authAttempts.push(attempt);

        // Keep only last 10 attempts
        if (this.state.authAttempts.length > 10) {
            this.state.authAttempts = this.state.authAttempts.slice(-10);
        }

        this.saveState();
    }

    /**
     * Get recent authentication attempts (last 5 minutes)
     */
    private getRecentAttempts(): AuthAttempt[] {
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        return this.state.authAttempts.filter(
            (attempt) => attempt.timestamp > fiveMinutesAgo && !attempt.success
        );
    }

    /**
     * Get authentication history
     */
    getAuthHistory(): AuthAttempt[] {
        return [...this.state.authAttempts];
    }

    /**
     * Enable biometric authentication
     */
    async enableBiometrics(): Promise<{ success: boolean; error?: string }> {
        if (!window.PublicKeyCredential) {
            return {
                success: false,
                error: 'Biometric authentication not supported',
            };
        }

        try {
            const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();

            if (!available) {
                return {
                    success: false,
                    error: 'Biometric authentication not available on this device',
                };
            }

            this.config.biometricEnabled = true;
            this.saveState();

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to enable biometrics',
            };
        }
    }

    /**
     * Disable biometric authentication
     */
    disableBiometrics(): void {
        this.config.biometricEnabled = false;
        this.saveState();
    }

    /**
     * Check if biometrics are enabled
     */
    isBiometricsEnabled(): boolean {
        return this.config.biometricEnabled;
    }

    /**
     * Save state to localStorage
     */
    private saveState(): void {
        try {
            localStorage.setItem('socialflow_auth_state', JSON.stringify({
                lastAuthTime: this.state.lastAuthTime,
                authAttempts: this.state.authAttempts,
                cooldownUntil: this.state.cooldownUntil,
                biometricEnabled: this.config.biometricEnabled,
            }));
        } catch (error) {
            console.error('Failed to save auth state:', error);
        }
    }

    /**
     * Load state from localStorage
     */
    private loadState(): void {
        try {
            const stored = localStorage.getItem('socialflow_auth_state');
            if (stored) {
                const savedState = JSON.parse(stored);
                this.state.lastAuthTime = savedState.lastAuthTime || 0;
                this.state.authAttempts = savedState.authAttempts || [];
                this.state.cooldownUntil = savedState.cooldownUntil || 0;
                this.config.biometricEnabled = savedState.biometricEnabled || false;
            }
        } catch (error) {
            console.error('Failed to load auth state:', error);
        }
    }

    /**
     * Clear all auth data
     */
    clearAllData(): void {
        this.state = {
            lastAuthTime: 0,
            authAttempts: [],
            isAuthenticated: false,
            cooldownUntil: 0,
        };
        try {
            localStorage.removeItem('socialflow_auth_state');
        } catch (error) {
            console.error('Failed to clear auth data:', error);
        }
    }
}

// Export singleton instance
export const authService = new AuthService();

// Export class for custom instances
export { AuthService };
