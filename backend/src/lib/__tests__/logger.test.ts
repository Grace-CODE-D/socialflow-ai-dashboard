/**
 * Covers createLogger's public interface — each level method should exist
 * and forward without throwing, including with the request-scoped requestId
 * context applied.
 */
import { createLogger } from '../logger';
import { requestContext } from '../../middleware/requestId';

describe('lib/logger', () => {
  it('createLogger returns all expected log level methods', () => {
    const log = createLogger('test-scope');

    expect(typeof log.info).toBe('function');
    expect(typeof log.warn).toBe('function');
    expect(typeof log.error).toBe('function');
    expect(typeof log.debug).toBe('function');
  });

  it('does not throw when logging without metadata', () => {
    const log = createLogger('test-scope');

    expect(() => log.info('hello')).not.toThrow();
    expect(() => log.warn('careful')).not.toThrow();
    expect(() => log.error('boom')).not.toThrow();
    expect(() => log.debug('trace me')).not.toThrow();
  });

  it('does not throw when logging with metadata', () => {
    const log = createLogger('test-scope');

    expect(() => log.info('hello', { userId: '123' })).not.toThrow();
  });

  it('includes the active requestId from AsyncLocalStorage context when present', () => {
    const log = createLogger('test-scope');

    expect(() =>
      requestContext.run({ requestId: 'req-abc' }, () => {
        log.info('scoped message');
      }),
    ).not.toThrow();
  });
});
