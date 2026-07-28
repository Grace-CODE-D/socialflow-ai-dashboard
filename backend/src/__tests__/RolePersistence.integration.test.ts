/**
 * Integration coverage for #1297 — RoleStore must be backed by a durable,
 * shared store instead of a process-local Map so that:
 *   - role assignments survive a process restart
 *   - role assignments made on one replica are visible from every other replica
 *
 * `fakeTable` stands in for the Postgres `RoleAssignment` table. It lives
 * outside the Jest module registry, so calling `jest.resetModules()` and
 * re-`require`-ing `../models/Role` gives us a brand-new module instance
 * (a stand-in for a fresh, independent replica/process) that still reads
 * and writes through to the same underlying "database" row.
 */

const fakeTable = new Map<string, { userId: string; role: string }>();

jest.mock('../lib/prisma', () => ({
  prisma: {
    roleAssignment: {
      upsert: jest.fn(
        async ({
          where,
          create,
          update,
        }: {
          where: { userId: string };
          create: { userId: string; role: string };
          update: { role: string };
        }) => {
          const existing = fakeTable.get(where.userId);
          const row = existing ? { ...existing, ...update } : { ...create };
          fakeTable.set(where.userId, row);
          return row;
        },
      ),
      findUnique: jest.fn(async ({ where }: { where: { userId: string } }) => {
        return fakeTable.get(where.userId) ?? null;
      }),
      findMany: jest.fn(async () => Array.from(fakeTable.values())),
    },
  },
}));

describe('RoleStore persistence (#1297)', () => {
  beforeEach(() => {
    fakeTable.clear();
  });

  it('a role assigned via one RoleStore instance is visible from a second, independent RoleStore instance', async () => {
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { RoleStore: replicaA } = require('../models/Role');
    await replicaA.assign('user-1', 'admin');

    // Fresh module graph — stands in for a request handled by a different pod.
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { RoleStore: replicaB } = require('../models/Role');

    expect(await replicaB.getRoleName('user-1')).toBe('admin');
    expect(await replicaB.hasPermission('user-1', 'roles:manage')).toBe(true);
  });

  it('survives a process restart — a reassignment persists after the module is reloaded', async () => {
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { RoleStore: before } = require('../models/Role');
    await before.assign('user-2', 'editor');

    // Simulate a restart: the in-memory module state is gone, only the
    // durable store (fakeTable) remains.
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { RoleStore: after } = require('../models/Role');

    expect(await after.getRoleName('user-2')).toBe('editor');
    expect(await after.listAll()).toEqual(
      expect.arrayContaining([{ userId: 'user-2', role: 'editor' }]),
    );
  });

  it('reassigning a role overwrites the previous one for that user, everywhere', async () => {
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { RoleStore: replicaA } = require('../models/Role');
    await replicaA.assign('user-3', 'viewer');

    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { RoleStore: replicaB } = require('../models/Role');
    await replicaB.assign('user-3', 'admin');

    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { RoleStore: replicaC } = require('../models/Role');
    expect(await replicaC.getRoleName('user-3')).toBe('admin');
  });

  it('checkPermission enforces the same permission matrix once backed by the database', async () => {
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { RoleStore } = require('../models/Role');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { checkPermission } = require('../middleware/checkPermission');

    await RoleStore.assign('user-viewer', 'viewer');

    const mw = checkPermission('posts:create');
    const req = { user: { id: 'user-viewer' } } as any;
    let statusCode: number | undefined;
    let body: unknown;
    const res: any = {
      status(code: number) {
        statusCode = code;
        return res;
      },
      json(data: unknown) {
        body = data;
        return res;
      },
    };
    const next = jest.fn();

    await mw(req, res, next);

    expect(statusCode).toBe(403);
    expect(body).toEqual({ message: 'Forbidden', missing: ['posts:create'] });
    expect(next).not.toHaveBeenCalled();
  });

  it('an unassigned user has no role and no permissions', async () => {
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { RoleStore } = require('../models/Role');

    expect(await RoleStore.getRole('ghost-user')).toBeUndefined();
    expect(await RoleStore.hasPermission('ghost-user', 'posts:read')).toBe(false);
  });
});
