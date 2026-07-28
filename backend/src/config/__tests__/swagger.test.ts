import { swaggerSpec } from '../swagger';

describe('swaggerSpec', () => {
  it('builds a valid OpenAPI 3.0 document', () => {
    const spec = swaggerSpec as Record<string, unknown>;
    expect(spec.openapi).toBe('3.0.3');
    expect((spec.info as Record<string, unknown>).title).toBe('SocialFlow AI Dashboard API');
  });

  it('registers the bearerAuth security scheme', () => {
    const spec = swaggerSpec as any;
    expect(spec.components.securitySchemes.bearerAuth.type).toBe('http');
    expect(spec.components.securitySchemes.bearerAuth.scheme).toBe('bearer');
  });

  it('defines shared schemas used across routes', () => {
    const spec = swaggerSpec as any;
    for (const name of ['Error', 'AuthTokens', 'Post', 'Organization']) {
      expect(spec.components.schemas).toHaveProperty(name);
    }
  });
});
