/**
 * Covers the org-scoping and soft-delete query extension in lib/prisma.ts.
 * PrismaClient / PrismaPg are mocked so the extension logic can be exercised
 * without a live database connection.
 */

let capturedExtension: any;

const mockBaseModelClient = {
  post: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
  },
  user: {
    findFirst: jest.fn(),
    findFirstOrThrow: jest.fn(),
    updateMany: jest.fn(),
  },
};

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      ...mockBaseModelClient,
      $extends: jest.fn((ext: any) => {
        capturedExtension = ext;
        return { extended: true };
      }),
    })),
  };
});

jest.mock('@prisma/adapter-pg', () => ({
  PrismaPg: jest.fn().mockImplementation(() => ({})),
}));

describe('lib/prisma query extension', () => {
  let allOperations: (params: {
    model: string;
    operation: string;
    args: Record<string, any>;
    query: (args: Record<string, any>) => Promise<any>;
  }) => Promise<any>;

  beforeAll(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../prisma');
    allOperations = capturedExtension.query.$allModels.$allOperations;
  });

  describe('org-scoping', () => {
    it('injects organizationId into where clause for read ops on org-scoped models', async () => {
      const query = jest.fn().mockResolvedValue([]);

      await allOperations({
        model: 'Post',
        operation: 'findMany',
        args: { __orgId: 'org-1', where: { published: true } },
        query,
      });

      expect(query).toHaveBeenCalledWith({
        where: { published: true, organizationId: 'org-1' },
      });
    });

    it('injects organizationId into data on create for org-scoped models', async () => {
      const query = jest.fn().mockResolvedValue({});

      await allOperations({
        model: 'Post',
        operation: 'create',
        args: { __orgId: 'org-2', data: { title: 'hello' } },
        query,
      });

      expect(query).toHaveBeenCalledWith({
        data: { title: 'hello', organizationId: 'org-2' },
      });
    });

    it('does not scope models outside ORG_SCOPED_MODELS', async () => {
      const query = jest.fn().mockResolvedValue([]);

      await allOperations({
        model: 'Subscription',
        operation: 'findMany',
        args: { __orgId: 'org-1', where: {} },
        query,
      });

      // __orgId is only stripped/applied for org-scoped models, so it is
      // passed through untouched here.
      expect(query).toHaveBeenCalledWith({ __orgId: 'org-1', where: {} });
    });

    it('leaves args untouched when no __orgId is present', async () => {
      const query = jest.fn().mockResolvedValue([]);

      await allOperations({
        model: 'Post',
        operation: 'findMany',
        args: { where: { published: true } },
        query,
      });

      expect(query).toHaveBeenCalledWith({ where: { published: true } });
    });
  });

  describe('soft delete', () => {
    it('rewrites delete into an update setting deletedAt for soft-delete models', async () => {
      const query = jest.fn().mockResolvedValue({});

      await allOperations({
        model: 'User',
        operation: 'delete',
        args: { where: { id: 'u-1' } },
        query,
      });

      expect(query).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'u-1' },
          data: { deletedAt: expect.any(Date) },
        }),
      );
    });

    it('routes deleteMany to updateMany on the base client for soft-delete models', async () => {
      mockBaseModelClient.user.updateMany.mockResolvedValue({ count: 2 });

      const result = await allOperations({
        model: 'User',
        operation: 'deleteMany',
        args: { where: { active: false } },
        query: jest.fn(),
      });

      expect(mockBaseModelClient.user.updateMany).toHaveBeenCalledWith({
        where: { active: false },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result).toEqual({ count: 2 });
    });

    it('filters out soft-deleted rows on findMany for soft-delete models', async () => {
      const query = jest.fn().mockResolvedValue([]);

      await allOperations({
        model: 'User',
        operation: 'findMany',
        args: { where: { email: 'a@b.com' } },
        query,
      });

      expect(query).toHaveBeenCalledWith({
        where: { email: 'a@b.com', deletedAt: null },
      });
    });

    it('does not affect models without soft delete support', async () => {
      const query = jest.fn().mockResolvedValue([]);

      await allOperations({
        model: 'Subscription',
        operation: 'findMany',
        args: { where: { active: true } },
        query,
      });

      expect(query).toHaveBeenCalledWith({ where: { active: true } });
    });
  });
});
