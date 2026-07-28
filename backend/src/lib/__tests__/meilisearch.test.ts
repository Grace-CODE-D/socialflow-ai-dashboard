/**
 * Covers getMeiliClient's singleton behavior and localhost-in-non-dev warning.
 */

const mockMeiliSearchCtor = jest.fn();

jest.mock('meilisearch', () => ({
  MeiliSearch: jest.fn().mockImplementation((opts: any) => {
    mockMeiliSearchCtor(opts);
    return { __opts: opts };
  }),
}));

describe('lib/meilisearch', () => {
  beforeEach(() => {
    jest.resetModules();
    mockMeiliSearchCtor.mockClear();
  });

  it('returns the same client instance on repeated calls (singleton)', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getMeiliClient } = require('../meilisearch');

    const first = getMeiliClient();
    const second = getMeiliClient();

    expect(first).toBe(second);
    expect(mockMeiliSearchCtor).toHaveBeenCalledTimes(1);
  });

  it('builds the client from configured host and admin key', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getMeiliClient } = require('../meilisearch');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { config } = require('../../config/config');

    getMeiliClient();

    expect(mockMeiliSearchCtor).toHaveBeenCalledWith({
      host: config.MEILISEARCH_HOST,
      apiKey: config.MEILISEARCH_ADMIN_KEY,
    });
  });

  it('warns when MEILISEARCH_HOST points to localhost outside development', () => {
    jest.doMock('../../config/config', () => ({
      config: {
        MEILISEARCH_HOST: 'http://localhost:7700',
        MEILISEARCH_ADMIN_KEY: 'key',
        NODE_ENV: 'production',
      },
    }));
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getMeiliClient } = require('../meilisearch');
    getMeiliClient();

    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
    jest.dontMock('../../config/config');
  });
});
