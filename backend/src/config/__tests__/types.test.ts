import { TYPES } from '../types';

describe('TYPES', () => {
  it('exposes a symbol for every service identifier', () => {
    for (const [key, value] of Object.entries(TYPES)) {
      expect(typeof value).toBe('symbol');
      expect(value.toString()).toBe(`Symbol(${key})`);
    }
  });

  it('reuses the same symbol for a given identifier (Symbol.for semantics)', () => {
    expect(Symbol.for('HealthService')).toBe(TYPES.HealthService);
  });
});
