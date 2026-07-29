/**
 * tts.test.ts — coverage for the TTS controller (issue #1241).
 */

import { Response, NextFunction } from 'express';

// tts.ts pulls in AuthRequest from middleware/authMiddleware for typing
// only, but that module has real side effects at load time
// (AuthBlacklistService, config) — mock them so this suite never touches a
// real Redis connection or requires real JWT config.
jest.mock('../../services/AuthBlacklistService', () => ({
  AuthBlacklistService: {
    keyFromPayload: jest.fn(),
    isBlacklisted: jest.fn().mockResolvedValue(false),
  },
}));
jest.mock('../../config/config', () => ({
  config: { JWT_SECRET: 'test-secret-that-is-at-least-32-chars!!' },
}));

const mockTTSService = {
  createJob: jest.fn(),
  getJob: jest.fn(),
  getAllJobs: jest.fn(),
  cancelJob: jest.fn(),
  getVoices: jest.fn(),
};
jest.mock('../../services/TTSService', () => ({ ttsService: mockTTSService }));

import {
  createTTSJob,
  getTTSJob,
  listTTSJobs,
  cancelTTSJob,
  listVoices,
} from '../tts';
import { AuthRequest } from '../../middleware/authMiddleware';
import { NotFoundError } from '../../lib/errors';

function mockRes(): Response {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

function mockReq(overrides: Partial<AuthRequest> = {}): AuthRequest {
  return {
    user: { id: 'user-1' },
    params: {},
    body: {},
    query: {},
    ...overrides,
  } as unknown as AuthRequest;
}

const next: NextFunction = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

describe('createTTSJob', () => {
  it('creates a job and returns 202 with the job id', async () => {
    mockTTSService.createJob.mockResolvedValue('job-1');

    const req = mockReq({ body: { segments: [{ text: 'hello' }] } as never });
    const res = mockRes();

    await createTTSJob(req, res, next);

    expect(mockTTSService.createJob).toHaveBeenCalledWith(
      expect.objectContaining({ segments: [{ text: 'hello' }], userId: 'user-1' }),
    );
    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith({ jobId: 'job-1', status: 'pending' });
  });

  it('forwards service errors to next()', async () => {
    const err = new Error('service down');
    mockTTSService.createJob.mockRejectedValue(err);

    const req = mockReq({ body: { segments: [] } as never });
    const res = mockRes();

    await createTTSJob(req, res, next);

    expect(next).toHaveBeenCalledWith(err);
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe('getTTSJob', () => {
  it('returns the job when found', async () => {
    mockTTSService.getJob.mockResolvedValue({ id: 'job-1', status: 'completed' });

    const req = mockReq({ params: { jobId: 'job-1' } });
    const res = mockRes();

    await getTTSJob(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ id: 'job-1', status: 'completed' });
  });

  it('forwards a NotFoundError to next() when the job does not exist', async () => {
    mockTTSService.getJob.mockResolvedValue(undefined);

    const req = mockReq({ params: { jobId: 'missing' } });
    const res = mockRes();

    await getTTSJob(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    const forwardedErr = (next as jest.Mock).mock.calls[0][0] as NotFoundError;
    expect(forwardedErr.statusCode).toBe(404);
  });
});

describe('listTTSJobs', () => {
  it('returns all jobs for the authenticated user', async () => {
    mockTTSService.getAllJobs.mockResolvedValue([{ id: 'job-1' }]);

    const req = mockReq();
    const res = mockRes();

    await listTTSJobs(req, res, next);

    expect(mockTTSService.getAllJobs).toHaveBeenCalledWith('user-1');
    expect(res.json).toHaveBeenCalledWith([{ id: 'job-1' }]);
  });

  it('returns 401 when there is no authenticated user', async () => {
    const req = mockReq({ user: undefined });
    const res = mockRes();

    await listTTSJobs(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockTTSService.getAllJobs).not.toHaveBeenCalled();
  });
});

describe('cancelTTSJob', () => {
  it('cancels the job and confirms', async () => {
    mockTTSService.cancelJob.mockResolvedValue(true);

    const req = mockReq({ params: { jobId: 'job-1' } });
    const res = mockRes();

    await cancelTTSJob(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ message: 'Job cancelled' });
  });

  it('forwards a NotFoundError to next() when the job does not exist', async () => {
    mockTTSService.cancelJob.mockResolvedValue(false);

    const req = mockReq({ params: { jobId: 'missing' } });
    const res = mockRes();

    await cancelTTSJob(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
  });
});

describe('listVoices', () => {
  it('returns all voices when no provider filter is given', () => {
    mockTTSService.getVoices.mockReturnValue([{ id: 'v1' }, { id: 'v2' }]);

    const req = mockReq();
    const res = mockRes();

    listVoices(req, res, next);

    expect(mockTTSService.getVoices).toHaveBeenCalledWith(undefined);
    expect(res.json).toHaveBeenCalledWith({ voices: [{ id: 'v1' }, { id: 'v2' }] });
  });

  it('filters voices by the requested provider', () => {
    mockTTSService.getVoices.mockReturnValue([{ id: 'v1', provider: 'elevenlabs' }]);

    const req = mockReq({ query: { provider: 'elevenlabs' } as never });
    const res = mockRes();

    listVoices(req, res, next);

    expect(mockTTSService.getVoices).toHaveBeenCalledWith('elevenlabs');
  });

  it('forwards synchronous errors to next()', () => {
    mockTTSService.getVoices.mockImplementation(() => {
      throw new Error('boom');
    });

    const req = mockReq();
    const res = mockRes();

    listVoices(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
