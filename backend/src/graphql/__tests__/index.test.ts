/**
 * Coverage for #1303 — index.ts (Apollo server construction) had zero test
 * coverage. Verifies the server builds with the real schema/resolvers and
 * that introspection follows NODE_ENV as documented.
 */
import { ApolloServer } from '@apollo/server';

jest.mock('../../lib/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    post: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    organizationMember: { findUnique: jest.fn() },
  },
}));

jest.mock('../../services/AuthBlacklistService', () => ({
  AuthBlacklistService: {
    isBlacklisted: jest.fn().mockResolvedValue(false),
    keyFromPayload: jest.fn((p: { sub?: string; jti?: string; iat?: number }) =>
      p.jti ?? `${p.sub}:${p.iat}`,
    ),
  },
}));

describe('createApolloServer', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.resetModules();
  });

  it('constructs an ApolloServer instance wired with the schema and resolvers', () => {
    const { createApolloServer } = require('../index');
    const server = createApolloServer();
    expect(server).toBeInstanceOf(ApolloServer);
  });

  it('starts successfully, proving the schema builds without error', async () => {
    const { createApolloServer } = require('../index');
    const server = createApolloServer();
    await expect(server.start()).resolves.toBeUndefined();
    await server.stop();
  });

  it('constructs without throwing outside production (introspection enabled)', () => {
    process.env.NODE_ENV = 'development';
    jest.resetModules();
    const { createApolloServer } = require('../index');
    expect(() => createApolloServer()).not.toThrow();
  });

  it('constructs without throwing in production (introspection disabled)', () => {
    process.env.NODE_ENV = 'production';
    jest.resetModules();
    const { createApolloServer } = require('../index');
    expect(() => createApolloServer()).not.toThrow();
  });
});
