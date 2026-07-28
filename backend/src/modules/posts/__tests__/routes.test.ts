import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'test-secret-that-is-at-least-32-chars!!';

jest.mock('../../../config/config', () => ({ config: { JWT_SECRET } }));

jest.mock('../../../services/AuthBlacklistService', () => ({
  AuthBlacklistService: {
    keyFromPayload: jest.fn(() => 'key'),
    isBlacklisted: jest.fn(async () => false),
  },
}));

const mockCreate = jest.fn();
jest.mock('../../../lib/prisma', () => ({
  prisma: { post: { create: (...args: any[]) => mockCreate(...args) } },
}));

const mockModerate = jest.fn();
jest.mock('../../../services/ModerationService', () => ({
  ModerationService: { moderate: (...args: any[]) => mockModerate(...args) },
}));

const mockIndexPost = jest.fn();
jest.mock('../../../services/SearchService', () => ({
  indexPost: (...args: any[]) => mockIndexPost(...args),
  deletePost: jest.fn(),
}));

jest.mock('../../../lib/logger', () => ({
  createLogger: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }),
}));

import postsRouter from '../routes';

const app = express();
app.use(express.json());
app.use('/api/posts', postsRouter);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  res.status(err.statusCode ?? 500).json({ code: err.code, message: err.message });
});

const validToken = jwt.sign({ sub: 'user-1' }, JWT_SECRET, { expiresIn: '15m' });

const ORG_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

function makePost(overrides: Record<string, unknown> = {}) {
  return {
    id: 'post-1',
    organizationId: ORG_ID,
    content: 'Hello world',
    platform: 'twitter',
    scheduledAt: null,
    moderationStatus: 'pending',
    mediaUrls: [],
    createdAt: new Date('2025-01-01T00:00:00Z'),
    deletedAt: null,
    ...overrides,
  };
}

describe('modules/posts routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockModerate.mockResolvedValue({ flagged: false, blocked: false, categories: {}, scores: {} });
    mockCreate.mockResolvedValue(makePost());
  });

  it('returns 401 for POST / without an Authorization header', async () => {
    const res = await request(app)
      .post('/api/posts')
      .send({ content: 'Hello', platform: 'twitter', organizationId: ORG_ID });

    expect(res.status).toBe(401);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('returns 422 for an invalid body (missing content)', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ platform: 'twitter', organizationId: ORG_ID });

    expect(res.status).toBe(422);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('creates a post and returns 201 for a valid authenticated request', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ content: 'Hello world', platform: 'twitter', organizationId: ORG_ID });

    expect(res.status).toBe(201);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ organizationId: ORG_ID, content: 'Hello world', platform: 'twitter' }),
      }),
    );
    expect(res.body.moderation).toEqual({ flagged: false });
  });

  it('accepts the linkedin platform, matching the live schema', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ content: 'Hello LinkedIn', platform: 'linkedin', organizationId: ORG_ID });

    expect(res.status).toBe(201);
  });

  it('blocks creation and responds with the moderation error when content is blocked', async () => {
    mockModerate.mockResolvedValue({
      flagged: true,
      blocked: true,
      categories: { hate: true },
      scores: { hate: 0.95 },
      reason: 'hate speech detected',
    });

    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ content: 'Bad content', platform: 'twitter', organizationId: ORG_ID });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('CONTENT_BLOCKED');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('has no PATCH /:id/schedule route (no such endpoint exists live)', async () => {
    const res = await request(app)
      .patch(`/api/posts/post-1/schedule`)
      .set('Authorization', `Bearer ${validToken}`)
      .send({ scheduledAt: '2026-12-01T10:00:00.000Z' });

    expect(res.status).toBe(404);
  });
});
