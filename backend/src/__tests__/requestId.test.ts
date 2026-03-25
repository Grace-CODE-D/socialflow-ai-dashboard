import request from 'supertest';
import express, { Request, Response } from 'express';
import { requestIdMiddleware, getRequestId } from '../middleware/requestId';
import { createLogger } from '../lib/logger';

const logger = createLogger('test');

// Create test app
const createTestApp = () => {
    const app = express();

    // Apply request ID middleware
    app.use(requestIdMiddleware);
    app.use(express.json());

    // Test routes
    app.get('/test', (req: Request, res: Response) => {
        const requestId = getRequestId();
        logger.info('Test route accessed');
        res.json({
            message: 'success',
            requestId: req.requestId,
            contextRequestId: requestId
        });
    });

    app.post('/test-async', async (req: Request, res: Response) => {
        const requestId = getRequestId();
        logger.info('Async test route accessed');

        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 10));

        const requestIdAfterAsync = getRequestId();

        res.json({
            message: 'success',
            requestIdBefore: requestId,
            requestIdAfter: requestIdAfterAsync,
            match: requestId === requestIdAfterAsync
        });
    });

    return app;
};

describe('Request ID Middleware', () => {
    let app: express.Application;

    beforeEach(() => {
        app = createTestApp();
    });

    describe('Request ID Generation', () => {
        it('should generate a UUID v4 request ID if not provided', async () => {
            const response = await request(app).get('/test');

            expect(response.status).toBe(200);
            expect(response.headers['x-request-id']).toBeDefined();

            // Verify it's a valid UUID v4
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            expect(response.headers['x-request-id']).toMatch(uuidRegex);
        });

        it('should use client-provided request ID', async () => {
            const customId = 'my-custom-request-id-123';

            const response = await request(app)
                .get('/test')
                .set('X-Request-Id', customId);

            expect(response.status).toBe(200);
            expect(response.headers['x-request-id']).toBe(customId);
            expect(response.body.requestId).toBe(customId);
        });

        it('should generate different IDs for different requests', async () => {
            const response1 = await request(app).get('/test');
            const response2 = await request(app).get('/test');

            expect(response1.headers['x-request-id']).toBeDefined();
            expect(response2.headers['x-request-id']).toBeDefined();
            expect(response1.headers['x-request-id']).not.toBe(response2.headers['x-request-id']);
        });
    });

    describe('Response Headers', () => {
        it('should include X-Request-Id in response headers', async () => {
            const response = await request(app).get('/test');

            expect(response.headers['x-request-id']).toBeDefined();
        });

        it('should return the same ID in header and body', async () => {
            const response = await request(app).get('/test');

            const headerRequestId = response.headers['x-request-id'];
            const bodyRequestId = response.body.requestId;

            expect(headerRequestId).toBe(bodyRequestId);
        });
    });

    describe('Request Context', () => {
        it('should attach request ID to request object', async () => {
            const response = await request(app).get('/test');

            expect(response.body.requestId).toBeDefined();
            expect(response.body.requestId).toBe(response.headers['x-request-id']);
        });

        it('should make request ID available via getRequestId()', async () => {
            const response = await request(app).get('/test');

            expect(response.body.contextRequestId).toBeDefined();
            expect(response.body.contextRequestId).toBe(response.headers['x-request-id']);
        });

        it('should maintain request ID across async operations', async () => {
            const response = await request(app).post('/test-async');

            expect(response.status).toBe(200);
            expect(response.body.requestIdBefore).toBeDefined();
            expect(response.body.requestIdAfter).toBeDefined();
            expect(response.body.match).toBe(true);
            expect(response.body.requestIdBefore).toBe(response.headers['x-request-id']);
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty X-Request-Id header', async () => {
            const response = await request(app)
                .get('/test')
                .set('X-Request-Id', '');

            // Should generate a new ID since empty string is falsy
            expect(response.headers['x-request-id']).toBeDefined();
            expect(response.headers['x-request-id']).not.toBe('');
        });

        it('should handle special characters in custom request ID', async () => {
            const customId = 'request-id-with-special-chars-!@#$%';

            const response = await request(app)
                .get('/test')
                .set('X-Request-Id', customId);

            expect(response.headers['x-request-id']).toBe(customId);
        });

        it('should handle very long custom request ID', async () => {
            const customId = 'a'.repeat(500);

            const response = await request(app)
                .get('/test')
                .set('X-Request-Id', customId);

            expect(response.headers['x-request-id']).toBe(customId);
        });
    });

    describe('Multiple Requests', () => {
        it('should handle concurrent requests with different IDs', async () => {
            const requests = Array.from({ length: 10 }, (_, i) =>
                request(app)
                    .get('/test')
                    .set('X-Request-Id', `request-${i}`)
            );

            const responses = await Promise.all(requests);

            responses.forEach((response, i) => {
                expect(response.headers['x-request-id']).toBe(`request-${i}`);
            });
        });
    });
});

describe('getRequestId() outside request context', () => {
    it('should return undefined when called outside request context', () => {
        const requestId = getRequestId();
        expect(requestId).toBeUndefined();
    });
});
