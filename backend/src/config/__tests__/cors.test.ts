type OriginCb = (err: Error | null, allow?: boolean) => void;

function callOrigin(origin: string | undefined, opts: { origin: (origin: string | undefined, cb: OriginCb) => void }) {
  let result: { err: Error | null; allow?: boolean } | undefined;
  opts.origin(origin, (err, allow) => {
    result = { err, allow };
  });
  return result!;
}

describe('corsOptions (NODE_ENV=test, falls back to local allow-list)', () => {
  it('allows configured local origins', async () => {
    const { corsOptions } = await import('../cors');
    const result = callOrigin('http://localhost:3000', corsOptions as any);
    expect(result.err).toBeNull();
    expect(result.allow).toBe(true);
  });

  it('rejects an origin not on the allow-list', async () => {
    const { corsOptions } = await import('../cors');
    const result = callOrigin('https://evil.example.com', corsOptions as any);
    expect(result.err).toBeInstanceOf(Error);
  });

  it('allows requests with no Origin header outside production', async () => {
    const { corsOptions } = await import('../cors');
    const result = callOrigin(undefined, corsOptions as any);
    expect(result.err).toBeNull();
    expect(result.allow).toBe(true);
  });

  it('sets credentials and expected methods/headers', async () => {
    const { corsOptions } = await import('../cors');
    expect(corsOptions.credentials).toBe(true);
    expect(corsOptions.methods).toEqual(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']);
    expect(corsOptions.allowedHeaders).toEqual(['Content-Type', 'Authorization']);
  });
});

describe('corsOptions in production', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.resetModules();
    process.env.NODE_ENV = 'prod';
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.resetModules();
  });

  it('rejects requests with no Origin header in production', async () => {
    const { corsOptions } = await import('../cors');
    const result = callOrigin(undefined, corsOptions as any);
    expect(result.err).toBeInstanceOf(Error);
  });

  it('allows only production domains', async () => {
    const { corsOptions } = await import('../cors');
    expect(callOrigin('https://socialflow.app', corsOptions as any).allow).toBe(true);
    expect(callOrigin('http://localhost:3000', corsOptions as any).err).toBeInstanceOf(Error);
  });
});
