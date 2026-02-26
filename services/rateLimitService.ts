/**
 * RateLimitService - Implements rate limiting for transactions and API calls
 * 
 * Features:
 * - Rate limits for transaction submissions
 * - Limit API calls to external services
 * - Exponential backoff for retries
 * - Rate limit indicators
 * - Log rate limit violations
 */

export interface RateLimitConfig {
    transactionLimit: number; // transactions per minute
    apiCallLimit: number; // API calls per minute
    maxRetries: number;
    baseBackoffMs: number;
    maxBackoffMs: number;
}

export interface RateLimitStatus {
    isLimited: boolean;
    remainingRequests: number;
    resetTime: number;
    retryAfter?: number;
}

export interface RateLimitViolation {
    timestamp: number;
    type: 'TRANSACTION' | 'API_CALL';
    endpoint?: string;
    message: string;
}

interface RateLimitBucket {
    requests: number[];
    windowStart: number;
    windowSize: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
    transactionLimit: 10, // 10 transactions per minute
    apiCallLimit: 60, // 60 API calls per minute
    maxRetries: 3,
    baseBackoffMs: 1000, // 1 second
    maxBackoffMs: 32000, // 32 seconds
};

class RateLimitService {
    private config: RateLimitConfig;
    private transactionBucket: RateLimitBucket;
    private apiCallBuckets: Map<string, RateLimitBucket>;
    private violations: RateLimitViolation[];
    private retryAttempts: Map<string, number>;

    constructor(config: Partial<RateLimitConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.transactionBucket = this.createBucket(60000); // 1 minute window
        this.apiCallBuckets = new Map();
        this.violations = [];
        this.retryAttempts = new Map();
    }

    /**
     * Check if transaction can be submitted
     */
    canSubmitTransaction(): RateLimitStatus {
        return this.checkRateLimit(
            this.transactionBucket,
            this.config.transactionLimit,
            'TRANSACTION'
        );
    }

    /**
     * Record transaction submission
     */
    recordTransaction(): void {
        this.recordRequest(this.transactionBucket);
    }

    /**
     * Check if API call can be made
     */
    canMakeApiCall(endpoint: string): RateLimitStatus {
        const bucket = this.getOrCreateApiCallBucket(endpoint);
        return this.checkRateLimit(bucket, this.config.apiCallLimit, 'API_CALL', endpoint);
    }

    /**
     * Record API call
     */
    recordApiCall(endpoint: string): void {
        const bucket = this.getOrCreateApiCallBucket(endpoint);
        this.recordRequest(bucket);
    }

    /**
     * Execute with rate limiting and retry logic
     */
    async executeWithRateLimit<T>(
        fn: () => Promise<T>,
        endpoint: string,
        type: 'TRANSACTION' | 'API_CALL' = 'API_CALL'
    ): Promise<T> {
        const key = `${type}:${endpoint}`;
        const attempts = this.retryAttempts.get(key) || 0;

        // Check rate limit
        const status =
            type === 'TRANSACTION'
                ? this.canSubmitTransaction()
                : this.canMakeApiCall(endpoint);

        if (status.isLimited) {
            // If rate limited and have retries left, wait and retry
            if (attempts < this.config.maxRetries) {
                const backoffMs = this.calculateBackoff(attempts);
                console.log(`Rate limited. Retrying in ${backoffMs}ms (attempt ${attempts + 1}/${this.config.maxRetries})`);

                await this.sleep(backoffMs);
                this.retryAttempts.set(key, attempts + 1);

                return this.executeWithRateLimit(fn, endpoint, type);
            }

            // Max retries exceeded
            this.logViolation(type, endpoint, 'Max retries exceeded');
            throw new Error(`Rate limit exceeded for ${endpoint}. Please try again later.`);
        }

        try {
            // Execute function
            const result = await fn();

            // Record successful request
            if (type === 'TRANSACTION') {
                this.recordTransaction();
            } else {
                this.recordApiCall(endpoint);
            }

            // Reset retry attempts on success
            this.retryAttempts.delete(key);

            return result;
        } catch (error) {
            // If error is rate limit related, retry
            if (this.isRateLimitError(error)) {
                if (attempts < this.config.maxRetries) {
                    const backoffMs = this.calculateBackoff(attempts);
                    console.log(`Rate limit error. Retrying in ${backoffMs}ms`);

                    await this.sleep(backoffMs);
                    this.retryAttempts.set(key, attempts + 1);

                    return this.executeWithRateLimit(fn, endpoint, type);
                }

                this.logViolation(type, endpoint, 'Rate limit error - max retries exceeded');
            }

            throw error;
        }
    }

    /**
     * Calculate exponential backoff
     */
    private calculateBackoff(attempt: number): number {
        const backoff = this.config.baseBackoffMs * Math.pow(2, attempt);
        // Add jitter (random 0-1000ms) to prevent thundering herd
        const jitter = Math.random() * 1000;
        return Math.min(backoff + jitter, this.config.maxBackoffMs);
    }

    /**
     * Check rate limit for a bucket
     */
    private checkRateLimit(
        bucket: RateLimitBucket,
        limit: number,
        type: 'TRANSACTION' | 'API_CALL',
        endpoint?: string
    ): RateLimitStatus {
        this.cleanupBucket(bucket);

        const currentRequests = bucket.requests.length;
        const isLimited = currentRequests >= limit;

        if (isLimited) {
            this.logViolation(type, endpoint, `Rate limit exceeded: ${currentRequests}/${limit}`);
        }

        const resetTime = bucket.windowStart + bucket.windowSize;
        const retryAfter = isLimited ? resetTime - Date.now() : undefined;

        return {
            isLimited,
            remainingRequests: Math.max(0, limit - currentRequests),
            resetTime,
            retryAfter,
        };
    }

    /**
     * Record a request in the bucket
     */
    private recordRequest(bucket: RateLimitBucket): void {
        this.cleanupBucket(bucket);
        bucket.requests.push(Date.now());
    }

    /**
     * Create a new rate limit bucket
     */
    private createBucket(windowSize: number): RateLimitBucket {
        return {
            requests: [],
            windowStart: Date.now(),
            windowSize,
        };
    }

    /**
     * Get or create API call bucket for endpoint
     */
    private getOrCreateApiCallBucket(endpoint: string): RateLimitBucket {
        if (!this.apiCallBuckets.has(endpoint)) {
            this.apiCallBuckets.set(endpoint, this.createBucket(60000)); // 1 minute window
        }
        return this.apiCallBuckets.get(endpoint)!;
    }

    /**
     * Clean up old requests from bucket
     */
    private cleanupBucket(bucket: RateLimitBucket): void {
        const now = Date.now();
        const windowStart = now - bucket.windowSize;

        // Remove requests outside the window
        bucket.requests = bucket.requests.filter((timestamp) => timestamp > windowStart);

        // Update window start if needed
        if (bucket.requests.length === 0) {
            bucket.windowStart = now;
        }
    }

    /**
     * Check if error is rate limit related
     */
    private isRateLimitError(error: any): boolean {
        if (!error) return false;

        const message = error.message?.toLowerCase() || '';
        const status = error.status || error.statusCode;

        return (
            status === 429 ||
            message.includes('rate limit') ||
            message.includes('too many requests') ||
            message.includes('throttle')
        );
    }

    /**
     * Log rate limit violation
     */
    private logViolation(
        type: 'TRANSACTION' | 'API_CALL',
        endpoint: string | undefined,
        message: string
    ): void {
        const violation: RateLimitViolation = {
            timestamp: Date.now(),
            type,
            endpoint,
            message,
        };

        this.violations.push(violation);

        // Keep only last 100 violations
        if (this.violations.length > 100) {
            this.violations = this.violations.slice(-100);
        }

        // Save to localStorage
        this.saveViolations();

        console.warn(`[Rate Limit] ${type} - ${message}`, endpoint);
    }

    /**
     * Get rate limit violations
     */
    getViolations(limit: number = 10): RateLimitViolation[] {
        return this.violations.slice(-limit).reverse();
    }

    /**
     * Clear violations
     */
    clearViolations(): void {
        this.violations = [];
        try {
            localStorage.removeItem('rate_limit_violations');
        } catch (error) {
            console.error('Failed to clear violations:', error);
        }
    }

    /**
     * Get rate limit status for all endpoints
     */
    getAllStatus(): {
        transactions: RateLimitStatus;
        apiCalls: Map<string, RateLimitStatus>;
    } {
        const transactions = this.canSubmitTransaction();
        const apiCalls = new Map<string, RateLimitStatus>();

        this.apiCallBuckets.forEach((bucket, endpoint) => {
            apiCalls.set(
                endpoint,
                this.checkRateLimit(bucket, this.config.apiCallLimit, 'API_CALL', endpoint)
            );
        });

        return { transactions, apiCalls };
    }

    /**
     * Reset rate limits (for testing)
     */
    reset(): void {
        this.transactionBucket = this.createBucket(60000);
        this.apiCallBuckets.clear();
        this.retryAttempts.clear();
    }

    /**
     * Update configuration
     */
    updateConfig(config: Partial<RateLimitConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Get current configuration
     */
    getConfig(): RateLimitConfig {
        return { ...this.config };
    }

    /**
     * Sleep utility
     */
    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Save violations to localStorage
     */
    private saveViolations(): void {
        try {
            localStorage.setItem('rate_limit_violations', JSON.stringify(this.violations));
        } catch (error) {
            console.error('Failed to save violations:', error);
        }
    }

    /**
     * Load violations from localStorage
     */
    private loadViolations(): void {
        try {
            const stored = localStorage.getItem('rate_limit_violations');
            if (stored) {
                this.violations = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to load violations:', error);
        }
    }

    /**
     * Get formatted time until reset
     */
    getTimeUntilReset(resetTime: number): string {
        const ms = resetTime - Date.now();
        if (ms <= 0) return '0s';

        const seconds = Math.ceil(ms / 1000);
        if (seconds < 60) return `${seconds}s`;

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    }

    /**
     * Get rate limit percentage
     */
    getRateLimitPercentage(status: RateLimitStatus, limit: number): number {
        return Math.round(((limit - status.remainingRequests) / limit) * 100);
    }
}

// Export singleton instance
export const rateLimitService = new RateLimitService();

// Export class for custom instances
export { RateLimitService };
