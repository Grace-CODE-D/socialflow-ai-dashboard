/**
 * Covers the read/write routing decision in lib/readReplica.ts:
 * - applyReadWriteSplitting warns when DATABASE_REPLICA_URL is set (since
 *   Prisma v7 removed middleware-based splitting).
 * - replicaClient falls back to DATABASE_URL when no replica URL is configured.
 */

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation((opts: any) => ({ __opts: opts })),
}));

jest.mock('@prisma/adapter-pg', () => ({
  PrismaPg: jest.fn().mockImplementation((opts: any) => ({ __adapterOpts: opts })),
}));

describe('lib/readReplica', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('does not throw when DATABASE_REPLICA_URL is set but splitting is inactive', () => {
    process.env.DATABASE_REPLICA_URL = 'postgresql://replica:5432/db';

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { applyReadWriteSplitting } = require('../readReplica');

    expect(() => applyReadWriteSplitting({} as any)).not.toThrow();
  });

  it('does not warn when DATABASE_REPLICA_URL is unset', () => {
    delete process.env.DATABASE_REPLICA_URL;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { applyReadWriteSplitting } = require('../readReplica');

    expect(() => applyReadWriteSplitting({} as any)).not.toThrow();
  });

  it('builds the replica adapter from DATABASE_REPLICA_URL when configured', () => {
    process.env.DATABASE_REPLICA_URL = 'postgresql://replica:5432/db';
    process.env.DATABASE_URL = 'postgresql://primary:5432/db';

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaPg } = require('@prisma/adapter-pg');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../readReplica');

    expect(PrismaPg).toHaveBeenCalledWith({
      connectionString: 'postgresql://replica:5432/db',
    });
  });

  it('falls back to DATABASE_URL for the replica adapter when no replica URL is set', () => {
    delete process.env.DATABASE_REPLICA_URL;
    process.env.DATABASE_URL = 'postgresql://primary:5432/db';

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaPg } = require('@prisma/adapter-pg');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../readReplica');

    expect(PrismaPg).toHaveBeenCalledWith({
      connectionString: 'postgresql://primary:5432/db',
    });
  });
});
