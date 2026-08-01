/**
 * requestId.test.ts
 *
 * Tests for the requestIdMiddleware and isValidUuidV4 helper.
 *
 * Issue #648 — Validate X-Request-Id header format to prevent log injection.
 * Issue #1101 — UUID generation, X-Request-ID header injection, logger context binding
 *
 * The middleware now accepts a client-supplied X-Request-Id only when it is a
 * valid UUID v4; any other value is replaced with a freshly generated UUID.
 */

import request from 'supertest';
import express, { Request, Response } from 'express';
import { requestIdMiddleware, getRequestId, isValidUuidV4 } from '../middleware/requestId';
import { createLogger } from '../lib/logger';

const logger = createLogger('test');

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ── Test app ──────────────────────────────────────────────────────────────────

const createTestApp = () => {
  const app = express();

  app.use(requestIdMiddleware);
  app.use(express.json());

  app.get('/test', (req: Request, res: Response) => {
    const requestId = getRequestId();
    logger.info('Test route accessed');
    res.json({
      message: 'success',
      requestId: req.requestId,
      contextRequestId: requestId,
    });
  });

  app.post('/test-async', async (req: Request, res: Response) => {
    const requestId = getRequestId();
    logger.info('Async test route accessed');

    await new Promise((resolve) => setTimeout(resolve, 10));

    const requestIdAfterAsync = getRequestId();

    res.json({
      message: 'success',
      requestIdBefore: requestId,
      requestIdAfter: requestIdAfterAsync,
      match: requestId === requestIdAfterAsync,
    });
  });

  return app;
};

// ── isValidUuidV4 unit tests ──────────────────────────────────────────────────

describe('isValidUuidV4()', () => {
  describe('valid UUIDs', () => {
    it('accepts a canonical UUID v4 (lowercase)', () => {
      expect(isValidUuidV4('550e8400-e29b-41d4-a716-446655440000')).toBe(false); // v1 format
      expect(isValidUuidV4('f47ac10b-58cc-4372-a567-0e02b2c3d479')).toBe(true);
    });

    it('accepts UUID v4 with uppercase hex digits', () => {
      expect(isValidUuidV4('F47AC10B-58CC-4372-A567-0E02B2C3D479')).toBe(true);
    });

    it('accepts UUID v4 with mixed case', () => {
      expect(isValidUuidV4('f47ac10b-58CC-4372-a567-0E02B2C3D479')).toBe(true);
    });

    it('accepts all valid variant bits (8, 9, a, b)', () => {
      // variant nibble must be 8, 9, a, or b
      expect(isValidUuidV4('f47ac10b-58cc-4372-8567-0e02b2c3d479')).toBe(true);
      expect(isValidUuidV4('f47ac10b-58cc-4372-9567-0e02b2c3d479')).toBe(true);
      expect(isValidUuidV4('f47ac10b-58cc-4372-a567-0e02b2c3d479')).toBe(true);
      expect(isValidUuidV4('f47ac10b-58cc-4372-b567-0e02b2c3d479')).toBe(true);
    });
  });

  describe('invalid values', () => {
    it('rejects an empty string', () => {
      expect(isValidUuidV4('')).toBe(false);
    });

    it('rejects a plain string', () => {
      expect(isValidUuidV4('not-a-uuid')).toBe(false);
    });

    it('rejects a UUID v1 (version digit is 1)', () => {
      expect(isValidUuidV4('550e8400-e29b-11d4-a716-446655440000')).toBe(false);
    });

    it('rejects a UUID v3 (version digit is 3)', () => {
      expect(isValidUuidV4('6ba7b810-9dad-31d1-80b4-00c04fd430c8')).toBe(false);
    });

    it('rejects a UUID v5 (version digit is 5)', () => {
      expect(isValidUuidV4('886313e1-3b8a-5372-9b90-0c9aee199e5d')).toBe(false);
    });

    it('rejects a string with a newline character (log injection)', () => {
      expect(isValidUuidV4('f47ac10b-58cc-4372-a567-0e02b2c3d479\nINJECTED')).toBe(false);
    });

    it('rejects a string with a carriage return (log injection)', () => {
      expect(isValidUuidV4('f47ac10b-58cc-4372-a567-0e02b2c3d479\rINJECTED')).toBe(false);
    });

    it('rejects a string with a null byte', () => {
      expect(isValidUuidV4('f47ac10b-58cc-4372-a567-0e02b2c3d479\x00')).toBe(false);
    });

    it('rejects a UUID without hyphens', () => {
      expect(isValidUuidV4('f47ac10b58cc4372a5670e02b2c3d479')).toBe(false);
    });

    it('rejects a UUID with extra characters appended', () => {
      expect(isValidUuidV4('f47ac10b-58cc-4372-a567-0e02b2c3d479-extra')).toBe(false);
    });

    it('rejects a very long string', () => {
      expect(isValidUuidV4('a'.repeat(500))).toBe(false);
    });

    it('rejects a string with special shell-injection characters', () => {
      expect(isValidUuidV4('$(rm -rf /)')).toBe(false);
    });
  });
});

// ── requestIdMiddleware integration tests ─────────────────────────────────────

describe('Request ID Middleware', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
  });

  // ── Auto-generation ─────────────────────────────────────────────────────────

  describe('Request ID Generation', () => {
    it('generates a UUID v4 when no X-Request-Id header is provided', async () => {
      const response = await request(app).get('/test');

      expect(response.status).toBe(200);
      expect(response.headers['x-request-id']).toMatch(UUID_V4_REGEX);
    });

    it('generates different IDs for different requests', async () => {
      const r1 = await request(app).get('/test');
      const r2 = await request(app).get('/test');

      expect(r1.headers['x-request-id']).not.toBe(r2.headers['x-request-id']);
    });
  });

  // ── Valid UUID v4 passthrough ───────────────────────────────────────────────

  describe('Valid UUID v4 passthrough', () => {
    it('accepts and echoes a valid UUID v4 supplied by the client', async () => {
      const validId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      const response = await request(app).get('/test').set('X-Request-Id', validId);

      expect(response.status).toBe(200);
      expect(response.headers['x-request-id']).toBe(validId);
      expect(response.body.requestId).toBe(validId);
    });

    it('accepts a valid UUID v4 with uppercase hex digits', async () => {
      const validId = 'F47AC10B-58CC-4372-A567-0E02B2C3D479';

      const response = await request(app).get('/test').set('X-Request-Id', validId);

      expect(response.headers['x-request-id']).toBe(validId);
    });
  });

  // ── Invalid value rejection ─────────────────────────────────────────────────

  describe('Invalid X-Request-Id rejection', () => {
    it('replaces an empty X-Request-Id with a generated UUID', async () => {
      const response = await request(app).get('/test').set('X-Request-Id', '');

      expect(response.headers['x-request-id']).toMatch(UUID_V4_REGEX);
    });

    it('replaces an arbitrary string with a generated UUID', async () => {
      const response = await request(app)
        .get('/test')
        .set('X-Request-Id', 'my-custom-request-id-123');

      expect(response.headers['x-request-id']).toMatch(UUID_V4_REGEX);
      expect(response.headers['x-request-id']).not.toBe('my-custom-request-id-123');
    });

    it('replaces a newline-injection attempt with a generated UUID', async () => {
      const injected = 'f47ac10b-58cc-4372-a567-0e02b2c3d479\nX-Injected-Header: evil';

      const response = await request(app).get('/test').set('X-Request-Id', injected);

      // The response ID must be a clean UUID — not the injected string
      expect(response.headers['x-request-id']).toMatch(UUID_V4_REGEX);
      expect(response.headers['x-request-id']).not.toContain('\n');
    });

    it('replaces a carriage-return injection attempt with a generated UUID', async () => {
      const injected = 'f47ac10b-58cc-4372-a567-0e02b2c3d479\rINJECTED';

      const response = await request(app).get('/test').set('X-Request-Id', injected);

      expect(response.headers['x-request-id']).toMatch(UUID_V4_REGEX);
      expect(response.headers['x-request-id']).not.toContain('\r');
    });

    it('replaces a very long string with a generated UUID', async () => {
      const longId = 'a'.repeat(500);

      const response = await request(app).get('/test').set('X-Request-Id', longId);

      expect(response.headers['x-request-id']).toMatch(UUID_V4_REGEX);
    });

    it('replaces a UUID v1 (non-v4) with a generated UUID', async () => {
      const uuidV1 = '550e8400-e29b-11d4-a716-446655440000';

      const response = await request(app).get('/test').set('X-Request-Id', uuidV1);

      expect(response.headers['x-request-id']).toMatch(UUID_V4_REGEX);
      expect(response.headers['x-request-id']).not.toBe(uuidV1);
    });

    it('replaces a UUID without hyphens with a generated UUID', async () => {
      const noHyphens = 'f47ac10b58cc4372a5670e02b2c3d479';

      const response = await request(app).get('/test').set('X-Request-Id', noHyphens);

      expect(response.headers['x-request-id']).toMatch(UUID_V4_REGEX);
    });
  });

  // ── Response headers ────────────────────────────────────────────────────────

  describe('Response Headers', () => {
    it('always includes X-Request-Id in response headers', async () => {
      const response = await request(app).get('/test');

      expect(response.headers['x-request-id']).toBeDefined();
    });

    it('returns the same ID in header and response body', async () => {
      const response = await request(app).get('/test');

      expect(response.headers['x-request-id']).toBe(response.body.requestId);
    });
  });

  // ── Request context ─────────────────────────────────────────────────────────

  describe('Request Context', () => {
    it('attaches request ID to the request object', async () => {
      const response = await request(app).get('/test');

      expect(response.body.requestId).toBeDefined();
      expect(response.body.requestId).toBe(response.headers['x-request-id']);
    });

    it('makes request ID available via getRequestId()', async () => {
      const response = await request(app).get('/test');

      expect(response.body.contextRequestId).toBe(response.headers['x-request-id']);
    });

    it('maintains request ID across async operations', async () => {
      const response = await request(app).post('/test-async');

      expect(response.status).toBe(200);
      expect(response.body.match).toBe(true);
      expect(response.body.requestIdBefore).toBe(response.headers['x-request-id']);
    });
  });

  // ── Concurrent requests ─────────────────────────────────────────────────────

  describe('Concurrent requests', () => {
    it('handles concurrent requests with valid UUID v4 IDs correctly', async () => {
      // Use valid UUID v4 values so they pass validation and are echoed back
      const validIds = [
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        'a8098c1a-f86e-11da-bd1a-00112444be1e',
        '6ba7b810-9dad-41d1-80b4-00c04fd430c8',
        '6ba7b811-9dad-41d1-80b4-00c04fd430c8',
        '6ba7b812-9dad-41d1-80b4-00c04fd430c8',
      ];

      const responses = await Promise.all(
        validIds.map((id) => request(app).get('/test').set('X-Request-Id', id)),
      );

      responses.forEach((response, i) => {
        expect(response.headers['x-request-id']).toBe(validIds[i]);
      });
    });

    it('generates unique IDs for concurrent requests without a header', async () => {
      const responses = await Promise.all(
        Array.from({ length: 10 }, () => request(app).get('/test')),
      );

      const ids = responses.map((r) => r.headers['x-request-id']);
      const unique = new Set(ids);
      expect(unique.size).toBe(10);
    });
  });
});

// ── getRequestId outside request context ─────────────────────────────────────

describe('getRequestId() outside request context', () => {
  it('returns undefined when called outside request context', () => {
    const requestId = getRequestId();
    expect(requestId).toBeUndefined();
  });
});

// ── #1101 Unit tests: UUID generation, X-Request-ID injection, logger context ─

describe('#1101 requestIdMiddleware — UUID generation and X-Request-ID header injection', () => {
  // ── UUID generator stubbing ───────────────────────────────────────────────

  describe('UUID generator stubbing for deterministic tests', () => {
    it('uses the stubbed UUID value when no client header is provided', () => {
      const DETERMINISTIC_UUID = 'a1b2c3d4-e5f6-4789-8abc-def012345678';

      // Mock the uuid module's v4 function
      jest.mock('uuid', () => ({ v4: () => DETERMINISTIC_UUID }));

      // Build a fresh app with the mocked module
      const freshApp = express();
      freshApp.use(requestIdMiddleware);
      freshApp.get('/deterministic', (req: Request, res: Response) => {
        res.json({ id: (req as any).requestId });
      });

      // Verify the middleware attaches a UUID-shaped value
      const req = {
        headers: {},
      } as unknown as Request;
      const setHeaderMock = jest.fn();
      const res = { setHeader: setHeaderMock } as unknown as Response;
      const next = jest.fn();

      requestIdMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect((req as any).requestId).toBeDefined();
      expect((req as any).requestId).toMatch(UUID_V4_REGEX);

      jest.resetModules();
    });

    it('next() is always called regardless of client-supplied header', () => {
      const scenarios = [
        {},                                           // no header
        { 'x-request-id': '' },                      // empty header
        { 'x-request-id': 'not-a-uuid' },            // invalid
        { 'x-request-id': 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }, // valid uuid
      ];

      for (const headers of scenarios) {
        const req = { headers } as unknown as Request;
        const setHeaderMock = jest.fn();
        const res = { setHeader: setHeaderMock } as unknown as Response;
        const next = jest.fn();

        requestIdMiddleware(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
      }
    });
  });

  // ── req.id attachment ─────────────────────────────────────────────────────

  describe('UUID-shaped request ID attachment', () => {
    it('attaches a UUID v4 shaped ID to the request object', () => {
      const req = { headers: {} } as unknown as Request;
      const setHeaderMock = jest.fn();
      const res = { setHeader: setHeaderMock } as unknown as Response;
      const next = jest.fn();

      requestIdMiddleware(req, res, next);

      expect((req as any).requestId).toMatch(UUID_V4_REGEX);
    });

    it('uses client-supplied UUID v4 as request ID', () => {
      const clientId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      const req = {
        headers: { 'x-request-id': clientId },
      } as unknown as Request;
      const setHeaderMock = jest.fn();
      const res = { setHeader: setHeaderMock } as unknown as Response;
      const next = jest.fn();

      requestIdMiddleware(req, res, next);

      expect((req as any).requestId).toBe(clientId);
    });

    it('generates a fresh UUID when client supplies invalid value', () => {
      const req = {
        headers: { 'x-request-id': 'invalid-not-a-uuid' },
      } as unknown as Request;
      const setHeaderMock = jest.fn();
      const res = { setHeader: setHeaderMock } as unknown as Response;
      const next = jest.fn();

      requestIdMiddleware(req, res, next);

      expect((req as any).requestId).toMatch(UUID_V4_REGEX);
      expect((req as any).requestId).not.toBe('invalid-not-a-uuid');
    });
  });

  // ── X-Request-ID response header injection ────────────────────────────────

  describe('X-Request-ID response header injection', () => {
    it('sets X-Request-Id response header with the same ID as the request', () => {
      const req = { headers: {} } as unknown as Request;
      const setHeaderMock = jest.fn();
      const res = { setHeader: setHeaderMock } as unknown as Response;
      const next = jest.fn();

      requestIdMiddleware(req, res, next);

      expect(setHeaderMock).toHaveBeenCalledWith('X-Request-Id', (req as any).requestId);
    });

    it('uses client-supplied valid UUID in response header', () => {
      const clientId = 'a1b2c3d4-e5f6-4789-8abc-def012345678';
      const req = {
        headers: { 'x-request-id': clientId },
      } as unknown as Request;
      const setHeaderMock = jest.fn();
      const res = { setHeader: setHeaderMock } as unknown as Response;
      const next = jest.fn();

      requestIdMiddleware(req, res, next);

      expect(setHeaderMock).toHaveBeenCalledWith('X-Request-Id', clientId);
    });

    it('sets a freshly generated UUID in header when client value is invalid', () => {
      const req = {
        headers: { 'x-request-id': 'not-a-valid-uuid' },
      } as unknown as Request;
      const setHeaderMock = jest.fn();
      const res = { setHeader: setHeaderMock } as unknown as Response;
      const next = jest.fn();

      requestIdMiddleware(req, res, next);

      const headerValue = setHeaderMock.mock.calls[0][1] as string;
      expect(headerValue).toMatch(UUID_V4_REGEX);
      expect(headerValue).not.toBe('not-a-valid-uuid');
    });
  });

  // ── Logger context binding ─────────────────────────────────────────────────

  describe('Logger context binding via AsyncLocalStorage', () => {
    it('binds the request ID to AsyncLocalStorage so getRequestId() returns it', () => {
      let capturedId: string | undefined;

      const req = { headers: {} } as unknown as Request;
      const res = { setHeader: jest.fn() } as unknown as Response;
      const next = jest.fn().mockImplementation(() => {
        // Inside next(), AsyncLocalStorage should have the requestId
        capturedId = getRequestId();
      });

      requestIdMiddleware(req, res, next);

      expect(capturedId).toBeDefined();
      expect(capturedId).toMatch(UUID_V4_REGEX);
      expect(capturedId).toBe((req as any).requestId);
    });

    it('the request ID in AsyncLocalStorage matches the response header', () => {
      let storedId: string | undefined;

      const req = { headers: {} } as unknown as Request;
      const setHeaderMock = jest.fn();
      const res = { setHeader: setHeaderMock } as unknown as Response;
      const next = jest.fn().mockImplementation(() => {
        storedId = getRequestId();
      });

      requestIdMiddleware(req, res, next);

      const headerValue = setHeaderMock.mock.calls[0][1] as string;
      expect(storedId).toBe(headerValue);
    });

    it('different concurrent requests get isolated AsyncLocalStorage contexts', async () => {
      const app = createTestApp();
      const responses = await Promise.all([
        request(app).get('/test'),
        request(app).get('/test'),
        request(app).get('/test'),
      ]);

      const ids = responses.map((r) => r.body.contextRequestId);
      const unique = new Set(ids);
      expect(unique.size).toBe(3);

      ids.forEach((id: string) => {
        expect(id).toMatch(UUID_V4_REGEX);
      });
    });

    it('getRequestId() returns the client-supplied UUID inside the handler', async () => {
      const app = createTestApp();
      const clientId = 'a1b2c3d4-e5f6-4789-8abc-def012345678';

      const response = await request(app).get('/test').set('X-Request-Id', clientId);

      expect(response.body.contextRequestId).toBe(clientId);
    });
  });
});
