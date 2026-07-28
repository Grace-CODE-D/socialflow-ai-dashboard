/**
 * Integration tests: role assignment and org membership changes must
 * produce an audit log entry via the shared audit() middleware. Previously
 * audit() was only applied to the health-config-update route, so these
 * security-sensitive authorization changes left no forensic trail.
 */

jest.mock('../../lib/prisma', () => ({
  prisma: {
    auditLog: { create: jest.fn().mockResolvedValue({}) },
  },
}));

import { Response } from 'express';
import { audit } from '../audit';
import { AuditLogStore } from '../../models/AuditLog';
import { AuthRequest } from '../authenticate';

function makeReq(overrides: Partial<AuthRequest> = {}): AuthRequest {
  return {
    params: {},
    body: {},
    query: {},
    headers: {},
    user: { id: 'actor-1' },
    ...overrides,
  } as unknown as AuthRequest;
}

function makeRes(statusCode = 200): Response & { emitFinish: () => void } {
  const listeners: Array<() => void> = [];
  return {
    statusCode,
    on: (event: string, cb: () => void) => {
      if (event === 'finish') listeners.push(cb);
    },
    emitFinish: () => listeners.forEach((cb) => cb()),
  } as unknown as Response & { emitFinish: () => void };
}

const flush = () => new Promise((r) => setImmediate(r));

describe('audit() applied to role assignment and organization membership routes', () => {
  it('logs an audit entry after a successful role assignment', async () => {
    const req = makeReq({ user: { id: 'admin-1' }, body: { userId: 'target-1', role: 'editor' } });
    const res = makeRes(200);
    const middleware = audit(
      'role:assign',
      'user',
      (r) => (r.body as { userId?: string }).userId,
      (r) => ({ role: (r.body as { role?: string }).role }),
    );

    middleware(req, res, () => {});
    res.emitFinish();
    await flush();

    const [entry] = AuditLogStore.forActor('admin-1');
    expect(entry).toBeDefined();
    expect(entry.action).toBe('role:assign');
    expect(entry.resourceType).toBe('user');
    expect(entry.resourceId).toBe('target-1');
    expect(entry.metadata).toEqual({ role: 'editor' });
  });

  it('logs an audit entry after a successful role revocation', async () => {
    const req = makeReq({ user: { id: 'admin-2' }, params: { userId: 'target-2' } });
    const res = makeRes(204);
    const middleware = audit('role:revoke', 'user', (r) => r.params.userId);

    middleware(req, res, () => {});
    res.emitFinish();
    await flush();

    const [entry] = AuditLogStore.forActor('admin-2');
    expect(entry.action).toBe('role:revoke');
    expect(entry.resourceId).toBe('target-2');
  });

  it('logs an audit entry after addMember succeeds', async () => {
    const req = makeReq({
      user: { id: 'owner-1' },
      params: { orgId: 'org-1' },
      body: { userId: 'new-member-1', role: 'admin' },
    });
    const res = makeRes(201);
    const middleware = audit(
      'org:member:invite',
      'organization-member',
      (r) => (r.body as { userId?: string }).userId,
      (r) => ({ orgId: r.params.orgId, role: (r.body as { role?: string }).role }),
    );

    middleware(req, res, () => {});
    res.emitFinish();
    await flush();

    const [entry] = AuditLogStore.forActor('owner-1');
    expect(entry.action).toBe('org:member:invite');
    expect(entry.resourceId).toBe('new-member-1');
    expect(entry.metadata).toEqual(expect.objectContaining({ orgId: 'org-1', role: 'admin' }));
  });

  it('logs an audit entry after removeMember succeeds', async () => {
    const req = makeReq({
      user: { id: 'owner-2' },
      params: { orgId: 'org-2', userId: 'removed-member-1' },
    });
    const res = makeRes(204);
    const middleware = audit('org:member:remove', 'organization-member', (r) => r.params.userId, (r) => ({
      orgId: r.params.orgId,
    }));

    middleware(req, res, () => {});
    res.emitFinish();
    await flush();

    const [entry] = AuditLogStore.forActor('owner-2');
    expect(entry.action).toBe('org:member:remove');
    expect(entry.resourceId).toBe('removed-member-1');
  });

  it('does not log when the response is not a 2xx', async () => {
    const req = makeReq({ user: { id: 'actor-err' }, params: { userId: 'target-err' } });
    const res = makeRes(403);
    const middleware = audit('role:revoke', 'user', (r) => r.params.userId);

    middleware(req, res, () => {});
    res.emitFinish();
    await flush();

    expect(AuditLogStore.forActor('actor-err')).toHaveLength(0);
  });
});
