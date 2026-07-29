/**
 * requireCredits.test.ts — coverage for requireCredits.ts (issue #1242).
 *
 * requireCredits imports the `AuthRequest` type from ./authenticate, which
 * has real side effects at load time (AuthBlacklistService, config) — mock
 * them so this suite never touches a real Redis connection.
 */

import { Response, NextFunction } from 'express';

jest.mock('../../services/AuthBlacklistService', () => ({
  AuthBlacklistService: {
    isBlacklisted: jest.fn().mockResolvedValue(false),
    keyFromPayload: jest.fn().mockReturnValue('mock-key'),
  },
}));

jest.mock('../../config/config', () => ({
  config: { JWT_SECRET: 'test-secret-that-is-at-least-32-chars!!' },
}));

const mockBillingService = { deductCredits: jest.fn() };
jest.mock('../../services/BillingService', () => ({ billingService: mockBillingService }));

import { requireCredits } from '../requireCredits';
import { AuthRequest } from '../authenticate';

function mockReq(overrides: Partial<AuthRequest> = {}): AuthRequest {
  return { user: { id: 'user-1' }, ...overrides } as unknown as AuthRequest;
}

function mockRes(): Response {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

const next: NextFunction = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

describe('requireCredits', () => {
  it('returns 401 when there is no authenticated user', async () => {
    const middleware = requireCredits('ai:generate');
    const req = mockReq({ user: undefined });
    const res = mockRes();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    expect(mockBillingService.deductCredits).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('deducts credits, exposes the remaining balance, and calls next() on success', async () => {
    mockBillingService.deductCredits.mockResolvedValue(42);
    const middleware = requireCredits('ai:generate');
    const req = mockReq();
    const res = mockRes();

    await middleware(req, res, next);

    expect(mockBillingService.deductCredits).toHaveBeenCalledWith('user-1', 'ai:generate');
    expect((req as unknown as { creditsRemaining: number }).creditsRemaining).toBe(42);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 402 when the billing service reports insufficient credits', async () => {
    mockBillingService.deductCredits.mockRejectedValue(
      new Error('Insufficient credits. Required: 5, available: 2'),
    );
    const middleware = requireCredits('ai:generate');
    const req = mockReq();
    const res = mockRes();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(402);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Insufficient credits. Required: 5, available: 2',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 for any other billing error', async () => {
    mockBillingService.deductCredits.mockRejectedValue(new Error('No subscription found for user'));
    const middleware = requireCredits('ai:generate');
    const req = mockReq();
    const res = mockRes();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'No subscription found for user' });
    expect(next).not.toHaveBeenCalled();
  });
});
