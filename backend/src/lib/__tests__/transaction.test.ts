/**
 * Covers commit/rollback behavior of withTransaction in lib/transaction.ts.
 */

const mockTransaction = jest.fn();

jest.mock('../prisma', () => ({
  prisma: {
    $transaction: (...args: any[]) => mockTransaction(...args),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { withTransaction } = require('../transaction');

describe('withTransaction', () => {
  beforeEach(() => {
    mockTransaction.mockReset();
  });

  it('commits and returns the callback result on success', async () => {
    const tx = { organization: { create: jest.fn() } };
    mockTransaction.mockImplementation(async (cb: any) => cb(tx));

    const result = await withTransaction(async (t) => {
      return { ok: true, tx: t };
    });

    expect(result).toEqual({ ok: true, tx });
    expect(mockTransaction).toHaveBeenCalledTimes(1);
  });

  it('propagates errors thrown inside the callback so the transaction rolls back', async () => {
    const failure = new Error('boom');
    mockTransaction.mockImplementation(async (cb: any) => cb({}));

    await expect(
      withTransaction(async () => {
        throw failure;
      }),
    ).rejects.toThrow('boom');
  });

  it('passes through transaction options', async () => {
    mockTransaction.mockImplementation(async (cb: any) => cb({}));
    const options = { timeout: 5000 };

    await withTransaction(async () => 'done', options);

    expect(mockTransaction).toHaveBeenCalledWith(expect.any(Function), options);
  });
});
