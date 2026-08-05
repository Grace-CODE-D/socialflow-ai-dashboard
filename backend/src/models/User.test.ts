jest.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

import { UserStore, User } from './User';
import { prisma } from '../lib/prisma';

const mockedPrisma = prisma as unknown as {
  user: {
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    deleteMany: jest.Mock;
  };
};

const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  passwordHash: 'hashed-password',
  createdAt: new Date('2024-01-01'),
  refreshTokens: [],
};

describe('UserStore', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('findByEmail', () => {
    it('returns the user when found', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await UserStore.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('returns null when no user matches', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(null);

      const result = await UserStore.findByEmail('missing@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('returns the user when found', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await UserStore.findById('user-1');

      expect(result).toEqual(mockUser);
      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
    });

    it('returns null when no user matches', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(null);

      const result = await UserStore.findById('missing');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates and returns the new user', async () => {
      mockedPrisma.user.create.mockResolvedValue(mockUser);

      const result = await UserStore.create(mockUser);

      expect(result).toEqual(mockUser);
      expect(mockedPrisma.user.create).toHaveBeenCalledWith({
        data: {
          id: mockUser.id,
          email: mockUser.email,
          passwordHash: mockUser.passwordHash,
          createdAt: mockUser.createdAt,
          refreshTokens: mockUser.refreshTokens,
        },
      });
    });

    it('propagates errors from Prisma (e.g. duplicate email)', async () => {
      const error = Object.assign(new Error('Unique constraint'), { code: 'P2002' });
      mockedPrisma.user.create.mockRejectedValue(error);

      await expect(UserStore.create(mockUser)).rejects.toMatchObject({ code: 'P2002' });
    });
  });

  describe('update', () => {
    it('returns the updated user', async () => {
      const updated = { ...mockUser, refreshTokens: ['refresh-token'] };
      mockedPrisma.user.update.mockResolvedValue(updated);

      const result = await UserStore.update('user-1', { refreshTokens: ['refresh-token'] });

      expect(result).toEqual(updated);
      expect(mockedPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { refreshTokens: ['refresh-token'] },
      });
    });

    it('resolves to null instead of throwing when the update fails', async () => {
      mockedPrisma.user.update.mockRejectedValue(Object.assign(new Error('Not found'), { code: 'P2025' }));

      const result = await UserStore.update('missing', { refreshTokens: [] });

      expect(result).toBeNull();
    });
  });

  describe('clear', () => {
    it('is intended for test teardown only, and is guarded against production', async () => {
      process.env.NODE_ENV = 'production';

      await expect(UserStore.clear()).rejects.toThrow(
        'UserStore.clear() must not be called outside of tests',
      );
      expect(mockedPrisma.user.deleteMany).not.toHaveBeenCalled();
    });

    it('deletes all users when NODE_ENV is not production', async () => {
      process.env.NODE_ENV = 'test';
      mockedPrisma.user.deleteMany.mockResolvedValue({ count: 0 });

      await expect(UserStore.clear()).resolves.toBeUndefined();
      expect(mockedPrisma.user.deleteMany).toHaveBeenCalled();
    });
  });
});
