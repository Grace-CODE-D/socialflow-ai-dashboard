import { TYPES } from '../types';
import { container } from '../inversify.config';

describe('inversify container', () => {
  const boundTypes: Array<keyof typeof TYPES> = [
    'AlertConfigService',
    'NotificationManager',
    'HealthMonitor',
    'HealthService',
    'CircuitBreakerService',
    'AIService',
  ];

  it.each(boundTypes)('binds %s', (key) => {
    expect(container.isBound(TYPES[key])).toBe(true);
  });

  it('does not bind identifiers that were never registered', () => {
    expect(container.isBound(TYPES.UserService)).toBe(false);
  });
});
