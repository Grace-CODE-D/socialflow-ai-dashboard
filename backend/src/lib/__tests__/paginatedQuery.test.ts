import { paginatedQuery } from '../paginatedQuery';

const BATCH_SIZE = 1000;

type Row = { id: string };

function makeRows(count: number, prefix = 'id'): Row[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${String(i).padStart(5, '0')}`,
  }));
}

async function drain<T>(gen: AsyncGenerator<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const item of gen) out.push(item);
  return out;
}

describe('paginatedQuery', () => {
  it('yields nothing when the first page is empty', async () => {
    const findMany = jest.fn().mockResolvedValue([]);

    const results = await drain(paginatedQuery(findMany));

    expect(results).toEqual([]);
    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany).toHaveBeenCalledWith({
      take: BATCH_SIZE + 1,
      skip: 0,
      cursor: undefined,
      orderBy: { id: 'asc' },
    });
  });

  it('yields all rows from a single page shorter than the batch size (last page)', async () => {
    const rows = makeRows(3);
    const findMany = jest.fn().mockResolvedValue(rows);

    const results = await drain(paginatedQuery(findMany));

    expect(results).toEqual(rows);
    expect(findMany).toHaveBeenCalledTimes(1);
  });

  it('paginates across a middle page using the last id of the previous batch as cursor', async () => {
    const firstPage = makeRows(BATCH_SIZE + 1, 'a'); // hasMore -> pop last
    const secondPage = makeRows(2, 'b');

    const findMany = jest
      .fn()
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce(secondPage);

    const results = await drain(paginatedQuery(findMany));

    // first page yields BATCH_SIZE rows (last one popped as the next cursor)
    expect(results).toHaveLength(BATCH_SIZE + secondPage.length);
    expect(findMany).toHaveBeenCalledTimes(2);

    const secondCallArgs = findMany.mock.calls[1][0];
    expect(secondCallArgs).toEqual({
      take: BATCH_SIZE + 1,
      skip: 1,
      cursor: { id: firstPage[BATCH_SIZE - 1].id },
      orderBy: { id: 'asc' },
    });
  });

  it('stops after the final short page (last-page boundary)', async () => {
    const firstPage = makeRows(BATCH_SIZE + 1, 'a');
    const lastPage = makeRows(0);

    const findMany = jest
      .fn()
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce(lastPage);

    const results = await drain(paginatedQuery(findMany));

    expect(results).toHaveLength(BATCH_SIZE);
    expect(findMany).toHaveBeenCalledTimes(2);
  });
});
