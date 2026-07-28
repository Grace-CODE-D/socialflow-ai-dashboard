/**
 * corsOptions keys ALLOWED_ORIGINS by real NODE_ENV values (development,
 * test, production) rather than the previous 'local'/'staging'/'prod'
 * mismatch, which made ALLOWED_ORIGINS['production'] undefined and caused
 * a silent fallback to the localhost allowlist in real production.
 */

function loadCorsWithEnv(nodeEnv: string) {
  let corsOptions: typeof import('../cors').corsOptions;
  jest.isolateModules(() => {
    process.env.NODE_ENV = nodeEnv;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    corsOptions = require('../cors').corsOptions;
  });
  return corsOptions!;
}

function callOrigin(
  corsOptions: import('cors').CorsOptions,
  origin: string | undefined,
): Promise<boolean> {
  return new Promise((resolve) => {
    (corsOptions.origin as (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => void)(
      origin,
      (err, allow) => resolve(!err && !!allow),
    );
  });
}

describe('corsOptions', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('rejects a localhost origin and allows the configured production origin when NODE_ENV=production', async () => {
    const corsOptions = loadCorsWithEnv('production');

    await expect(callOrigin(corsOptions, 'http://localhost:3000')).resolves.toBe(false);
    await expect(callOrigin(corsOptions, 'https://socialflow.app')).resolves.toBe(true);
  });

  it('allows localhost origins when NODE_ENV=development', async () => {
    const corsOptions = loadCorsWithEnv('development');

    await expect(callOrigin(corsOptions, 'http://localhost:3000')).resolves.toBe(true);
    await expect(callOrigin(corsOptions, 'https://socialflow.app')).resolves.toBe(false);
  });

  it('rejects requests with no Origin header in production but allows them otherwise', async () => {
    const prod = loadCorsWithEnv('production');
    const dev = loadCorsWithEnv('development');

    await expect(callOrigin(prod, undefined)).resolves.toBe(false);
    await expect(callOrigin(dev, undefined)).resolves.toBe(true);
  });
});
