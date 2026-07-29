/**
 * organization.test.ts — coverage for the live organization controller
 * (issue #1241). Not to be confused with the orphaned copy at
 * backend/src/modules/organization/controllers/organization.ts, which has
 * its own separate, out-of-sync implementation.
 */

import { Response } from 'express';

// organization.ts pulls in AuthRequest from middleware/authMiddleware for
// typing only, but that module has real side effects at load time
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

const mockOrganization = {
  findUnique: jest.fn(),
  create: jest.fn(),
};
const mockOrganizationMember = {
  findUnique: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
  findMany: jest.fn(),
};
jest.mock('../../lib/prisma', () => ({
  prisma: {
    organization: mockOrganization,
    organizationMember: mockOrganizationMember,
  },
}));

const mockInvalidateCache = jest.fn().mockResolvedValue(undefined);
const mockInvalidateCachePattern = jest.fn().mockResolvedValue(undefined);
jest.mock('../../utils/cache', () => ({
  // Bypass real caching entirely — just run the fetcher.
  withCache: jest.fn((_key: string, _ttl: number, fetcher: () => unknown) => fetcher()),
  invalidateCache: (...args: unknown[]) => mockInvalidateCache(...args),
  invalidateCachePattern: (...args: unknown[]) => mockInvalidateCachePattern(...args),
  CacheTTL: { ORG_LIST: 60, ORG: 60 },
}));

import {
  createOrganization,
  listOrganizations,
  getOrganization,
  addMember,
  removeMember,
  switchOrganization,
} from '../organization';
import { AuthRequest } from '../../middleware/authMiddleware';

function mockRes(): Response {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

function mockReq(overrides: Partial<AuthRequest> = {}): AuthRequest {
  return {
    user: { id: 'user-1' },
    params: {},
    body: {},
    query: {},
    baseUrl: '',
    path: '/api/organizations',
    ...overrides,
  } as unknown as AuthRequest;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('createOrganization', () => {
  it('creates the organization and makes the caller the owner', async () => {
    mockOrganization.findUnique.mockResolvedValue(null);
    mockOrganization.create.mockResolvedValue({ id: 'org-1', name: 'Acme', slug: 'acme', members: [] });

    const req = mockReq({ body: { name: 'Acme', slug: 'acme' } as never });
    const res = mockRes();

    await createOrganization(req, res);

    expect(mockOrganization.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Acme',
          slug: 'acme',
          members: { create: expect.objectContaining({ userId: 'user-1', role: 'owner' }) },
        }),
      }),
    );
    expect(mockInvalidateCachePattern).toHaveBeenCalledWith('org-list:user-1:*');
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('returns 409 without creating an organization when the slug is taken', async () => {
    mockOrganization.findUnique.mockResolvedValue({ id: 'existing-org' });

    const req = mockReq({ body: { name: 'Acme', slug: 'acme' } as never });
    const res = mockRes();

    await createOrganization(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(mockOrganization.create).not.toHaveBeenCalled();
  });
});

describe('listOrganizations', () => {
  it('returns a paginated list of the caller\'s organizations', async () => {
    mockOrganizationMember.count.mockResolvedValue(1);
    mockOrganizationMember.findMany.mockResolvedValue([
      { role: 'owner', organization: { id: 'org-1', name: 'Acme' } },
    ]);

    const req = mockReq();
    const res = mockRes();

    await listOrganizations(req, res);

    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.data).toEqual([{ id: 'org-1', name: 'Acme', role: 'owner' }]);
    expect(body.pagination.total).toBe(1);
  });
});

describe('getOrganization', () => {
  it('returns the organization with the caller\'s role when they are a member', async () => {
    mockOrganizationMember.findUnique.mockResolvedValue({
      role: 'admin',
      organization: { id: 'org-1', name: 'Acme', members: [] },
    });

    const req = mockReq({ params: { orgId: 'org-1' } });
    const res = mockRes();

    await getOrganization(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'org-1', name: 'Acme', role: 'admin' }),
    );
  });

  it('returns 404 when the caller is not a member of the organization', async () => {
    mockOrganizationMember.findUnique.mockResolvedValue(null);

    const req = mockReq({ params: { orgId: 'org-1' } });
    const res = mockRes();

    await getOrganization(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('addMember', () => {
  it('returns 403 when the caller is not an owner or admin', async () => {
    mockOrganizationMember.findUnique.mockResolvedValue({ role: 'member' });

    const req = mockReq({ params: { orgId: 'org-1' }, body: { userId: 'user-2' } as never });
    const res = mockRes();

    await addMember(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockOrganizationMember.create).not.toHaveBeenCalled();
  });

  it('returns 403 when a non-owner admin tries to grant the owner role', async () => {
    mockOrganizationMember.findUnique.mockResolvedValue({ role: 'admin' });

    const req = mockReq({
      params: { orgId: 'org-1' },
      body: { userId: 'user-2', role: 'owner' } as never,
    });
    const res = mockRes();

    await addMember(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockOrganizationMember.create).not.toHaveBeenCalled();
  });

  it('adds the member and invalidates caches for owners/admins', async () => {
    mockOrganizationMember.findUnique.mockResolvedValue({ role: 'owner' });
    mockOrganizationMember.create.mockResolvedValue({ id: 'mem-1', organizationId: 'org-1', userId: 'user-2', role: 'member' });

    const req = mockReq({ params: { orgId: 'org-1' }, body: { userId: 'user-2' } as never });
    const res = mockRes();

    await addMember(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(mockInvalidateCachePattern).toHaveBeenCalledWith('org:org-1:*');
    expect(mockInvalidateCachePattern).toHaveBeenCalledWith('org-list:user-2:*');
  });
});

describe('removeMember', () => {
  it('returns 403 when the caller is not an owner or admin', async () => {
    mockOrganizationMember.findUnique.mockResolvedValueOnce({ role: 'member' });

    const req = mockReq({ params: { orgId: 'org-1', userId: 'user-2' } });
    const res = mockRes();

    await removeMember(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockOrganizationMember.delete).not.toHaveBeenCalled();
  });

  it('returns 403 when a non-owner tries to remove an owner', async () => {
    mockOrganizationMember.findUnique
      .mockResolvedValueOnce({ role: 'admin' }) // caller
      .mockResolvedValueOnce({ role: 'owner' }); // target

    const req = mockReq({ params: { orgId: 'org-1', userId: 'user-2' } });
    const res = mockRes();

    await removeMember(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockOrganizationMember.delete).not.toHaveBeenCalled();
  });

  it('returns 403 when removing the last owner of the organization', async () => {
    mockOrganizationMember.findUnique
      .mockResolvedValueOnce({ role: 'owner' }) // caller
      .mockResolvedValueOnce({ role: 'owner' }); // target
    mockOrganizationMember.count.mockResolvedValue(1);

    const req = mockReq({ params: { orgId: 'org-1', userId: 'user-2' } });
    const res = mockRes();

    await removeMember(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockOrganizationMember.delete).not.toHaveBeenCalled();
  });

  it('removes a regular member and returns 204', async () => {
    mockOrganizationMember.findUnique
      .mockResolvedValueOnce({ role: 'owner' }) // caller
      .mockResolvedValueOnce({ role: 'member' }); // target
    mockOrganizationMember.delete.mockResolvedValue(undefined);

    const req = mockReq({ params: { orgId: 'org-1', userId: 'user-2' } });
    const res = mockRes();

    await removeMember(req, res);

    expect(mockOrganizationMember.delete).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(204);
  });
});

describe('switchOrganization', () => {
  it('returns the active org context when the caller is a member', async () => {
    mockOrganizationMember.findUnique.mockResolvedValue({
      role: 'member',
      organization: { id: 'org-1', name: 'Acme' },
    });

    const req = mockReq({ body: { orgId: 'org-1' } as never });
    const res = mockRes();

    await switchOrganization(req, res);

    expect(res.json).toHaveBeenCalledWith({
      activeOrgId: 'org-1',
      organization: { id: 'org-1', name: 'Acme' },
      role: 'member',
    });
  });

  it('returns 404 when the caller is not a member of the target organization', async () => {
    mockOrganizationMember.findUnique.mockResolvedValue(null);

    const req = mockReq({ body: { orgId: 'org-1' } as never });
    const res = mockRes();

    await switchOrganization(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
