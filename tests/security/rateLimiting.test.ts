/**
 * Rate Limiting Service Tests
 */

import { RateLimitService } from '../../services/rateLimitService';

describe('RateLimitService', () => {
    let service: RateLimitService;

    beforeEach(() => {
        service = new RateLimitService({
            transactionLimit: 5, // 5 per minute for testing
            apiCallLimit: 10, // 10 per minute for testing
            maxRetries: 3,
            baseBackoffMs: 100,
            maxBackoffMs: 1000,
        });
        localStorage.clear();
    });

    describe('Transaction Rate Limiting', () => {
        test('should allow transactions within limit', () => {
            for (let i = 0; i < 5; i++) {
                const status = service.canSubmitTransaction();
                expect(status.isLimited).toBe(false);
                service.recordTransaction();
            }
        });

        test('should block transactions exceeding limit', () => {
            // Submit 5 transactions (at limit)
            for (let i = 0; i < 5; i++) {
                service.recordTransaction();
            }

            // 6th should be blocked
            const status = service.canSubmitTransaction();
            expect(status.isLimited).toBe(true);
            expect(status.remainingRequests).toBe(0);
        });

        test('should calculate remaining requests correctly', () => {
            service.recordTransaction();
            service.recordTransaction();

            const status = service.canSubmitTransaction();
            expect(status.remainingRequests).toBe(3);
        });

        test('should provide retry after time', () => {
            // Hit limit
            for (let i = 0; i < 5; i++) {
                service.recordTransaction();
            }

            const status = service.canSubmitTransaction();
            expect(status.retryAfter).toBeGreaterThan(0);
        });
    });

    describe('API Call Rate Limiting', () => {
        test('should allow API calls within limit', () => {
            for (let i = 0; i < 10; i++) {
                const status = service.canMakeApiCall('test-endpoint');
                expect(status.isLimited).toBe(false);
                service.recordApiCall('test-endpoint');
            }
        });

        test('should block API calls exceeding limit', () => {
            // Submit 10 calls (at limit)
            for (let i = 0; i < 10; i++) {
                service.recordApiCall('test-endpoint');
            }

            // 11th should be blocked
            const status = service.canMakeApiCall('test-endpoint');
            expect(status.isLimited).toBe(true);
        });

        test('should track different endpoints separately', () => {
            // Fill endpoint1
            for (let i = 0; i < 10; i++) {
                service.recordApiCall('endpoint1');
            }

            // endpoint2 should still be available
            const status = service.canMakeApiCall('endpoint2');
            expect(status.isLimited).toBe(false);
        });
    });

    describe('Exponential Backoff', () => {
        test('should calculate backoff correctly', async () => {
            const mockFn = jest.fn().mockRejectedValue({ status: 429 });

            try {
                await service.executeWithRateLimit(mockFn, 'test', 'API_CALL');
            } catch (error) {
                // Expected to fail after retries
            }

            // Should have tried 4 times (initial + 3 retries)
            expect(mockFn).toHaveBeenCalledTimes(4);
        });

        test('should succeed after retry', async () => {
            let attempts = 0;
            const mockFn = jest.fn().mockImplementation(() => {
                attempts++;
                if (attempts < 3) {
                    return Promise.reject({ status: 429 });
                }
                return Promise.resolve('success');
            });

            const result = await service.executeWithRateLimit(mockFn, 'test', 'API_CALL');
            expect(result).toBe('success');
            expect(mockFn).toHaveBeenCalledTimes(3);
        });

        test('should fail after max retries', async () => {
            const mockFn = jest.fn().mockRejectedValue({ status: 429 });

            await expect(
                service.executeWithRateLimit(mockFn, 'test', 'API_CALL')
            ).rejects.toThrow('Rate limit exceeded');
        });
    });

    describe('Violation Logging', () => {
        test('should log violations', () => {
            // Hit limit
            for (let i = 0; i < 5; i++) {
                service.recordTransaction();
            }

            // Trigger violation
            service.canSubmitTransaction();

            const violations = service.getViolations();
            expect(violations.length).toBeGreaterThan(0);
            expect(violations[0].type).toBe('TRANSACTION');
        });

        test('should clear violations', () => {
            // Create violations
            for (let i = 0; i < 5; i++) {
                service.recordTransaction();
            }
            service.canSubmitTransaction();

            service.clearViolations();

            const violations = service.getViolations();
            expect(violations.length).toBe(0);
        });

        test('should limit violations to 100', () => {
            // Create many violations
            for (let i = 0; i < 150; i++) {
                for (let j = 0; j < 5; j++) {
                    service.recordTransaction();
                }
                service.canSubmitTransaction();
                service.reset(); // Reset to create more violations
            }

            const violations = service.getViolations(200);
            expect(violations.length).toBeLessThanOrEqual(100);
        });
    });

    describe('Rate Limit Status', () => {
        test('should get all status', () => {
            service.recordTransaction();
            service.recordApiCall('endpoint1');

            const status = service.getAllStatus();

            expect(status.transactions).toBeDefined();
            expect(status.apiCalls).toBeDefined();
            expect(status.apiCalls.has('endpoint1')).toBe(true);
        });

        test('should format time until reset', () => {
            const resetTime = Date.now() + 30000; // 30 seconds
            const formatted = service.getTimeUntilReset(resetTime);

            expect(formatted).toContain('s');
        });

        test('should calculate rate limit percentage', () => {
            service.recordTransaction();
            service.recordTransaction();

            const status = service.canSubmitTransaction();
            const percentage = service.getRateLimitPercentage(status, 5);

            expect(percentage).toBe(40); // 2 out of 5 = 40%
        });
    });

    describe('Configuration', () => {
        test('should update configuration', () => {
            service.updateConfig({
                transactionLimit: 20,
            });

            const config = service.getConfig();
            expect(config.transactionLimit).toBe(20);
        });

        test('should reset rate limits', () => {
            // Fill limits
            for (let i = 0; i < 5; i++) {
                service.recordTransaction();
            }

            service.reset();

            const status = service.canSubmitTransaction();
            expect(status.isLimited).toBe(false);
            expect(status.remainingRequests).toBe(5);
        });
    });

    describe('Sliding Window', () => {
        test('should allow requests after window expires', (done) => {
            // Fill limit
            for (let i = 0; i < 5; i++) {
                service.recordTransaction();
            }

            expect(service.canSubmitTransaction().isLimited).toBe(true);

            // Wait for window to expire (1 minute + buffer)
            setTimeout(() => {
                const status = service.canSubmitTransaction();
                expect(status.isLimited).toBe(false);
                done();
            }, 61000);
        }, 62000);
    });
});
