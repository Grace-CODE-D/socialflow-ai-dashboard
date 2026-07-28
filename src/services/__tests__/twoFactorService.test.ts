/**
 * @jest-environment jsdom
 *
 * Tests for twoFactorService
 * Feature: totp-two-factor-auth
 */

import * as fc from 'fast-check';

// ── Mock WebCrypto ────────────────────────────────────────────────────────────

const mockGetRandomValues = jest.fn((array: Uint8Array) => {
  for (let i = 0; i < array.length; i++) {
    array[i] = Math.floor(Math.random() * 256);
  }
  return array;
});

const mockSubtle = {
  importKey: jest.fn(async () => ({ type: 'secret' })),
  deriveKey: jest.fn(async () => ({ type: 'secret' })),
  deriveBits: jest.fn(async (algorithm, key, length) => {
    // Simple mock that generates deterministic output
    const bytes = new Uint8Array(length / 8);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = i % 256;
    }
    return bytes.buffer;
  }),
  encrypt: jest.fn(async (algorithm, key, data) => {
    // Simple mock encryption (just returns the data with a prefix)
    const prefix = new Uint8Array([0xaa, 0xbb]); // auth tag mock
    const result = new Uint8Array(prefix.length + data.byteLength);
    result.set(prefix, 0);
    result.set(new Uint8Array(data), prefix.length);
    return result.buffer;
  }),
  decrypt: jest.fn(async (algorithm, key, data) => {
    // Simple mock decryption (just removes the prefix)
    const dataArray = new Uint8Array(data);
    return dataArray.slice(2).buffer; // remove 2-byte prefix
  }),
};

// jsdom already provides `window` (and `global === window` in this test
// environment), so mock individual properties on it instead of redefining
// the whole global, which jsdom marks non-configurable.
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: mockSubtle,
    getRandomValues: mockGetRandomValues,
  },
  writable: true,
  configurable: true,
});

// ── Mock localStorage and sessionStorage ─────────────────────────────────────
// jsdom provides real implementations, but they don't persist test-to-test
// the way these in-memory stores do, so override with simple mocks.

const lsStore: Record<string, string> = {};
const ssStore: Record<string, string> = {};

Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: (k: string) => lsStore[k] ?? null,
    setItem: (k: string, v: string) => {
      lsStore[k] = v;
    },
    removeItem: (k: string) => {
      delete lsStore[k];
    },
    clear: () => {
      Object.keys(lsStore).forEach((k) => delete lsStore[k]);
    },
  },
  writable: true,
  configurable: true,
});

Object.defineProperty(global, 'sessionStorage', {
  value: {
    getItem: (k: string) => ssStore[k] ?? null,
    setItem: (k: string, v: string) => {
      ssStore[k] = v;
    },
    removeItem: (k: string) => {
      delete ssStore[k];
    },
    clear: () => {
      Object.keys(ssStore).forEach((k) => delete ssStore[k]);
    },
  },
  writable: true,
  configurable: true,
});

// ── Import service after mocks ────────────────────────────────────────────────

import { twoFactorService } from '../../services/twoFactorService';

// ── TOTP token generator (pure Node.js, no otplib) ───────────────────────────
// RFC 6238 / RFC 4226 implementation for test use only
import crypto from 'crypto';

function base32DecodeBytes(encoded: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = encoded.toUpperCase().replace(/=+$/, '');
  let bits = 0,
    value = 0;
  const output: number[] = [];
  for (const char of clean) {
    const idx = alphabet.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      output.push((value >> bits) & 0xff);
    }
  }
  return Buffer.from(output);
}

function generateTotpToken(secret: string, timeStep?: number): string {
  const key = base32DecodeBytes(secret);
  const step = timeStep ?? Math.floor(Date.now() / 1000 / 30);
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const hmac = crypto.createHmac('sha1', key).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    (((hmac[offset] & 0x7f) << 24) |
      (hmac[offset + 1] << 16) |
      (hmac[offset + 2] << 8) |
      hmac[offset + 3]) %
    1_000_000;
  return code.toString().padStart(6, '0');
}

// ── Reset state between tests ─────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  twoFactorService.resetFailedAttempts();
  jest.clearAllMocks();
  // Re-assign mockSubtle methods after clearAllMocks
  mockSubtle.importKey.mockImplementation(async () => ({ type: 'secret' }));
  mockSubtle.deriveKey.mockImplementation(async () => ({ type: 'secret' }));
  mockSubtle.deriveBits.mockImplementation(async (algorithm: any, key: any, length: number) => {
    const bytes = new Uint8Array(length / 8);
    for (let i = 0; i < bytes.length; i++) bytes[i] = i % 256;
    return bytes.buffer;
  });
  mockSubtle.encrypt.mockImplementation(async (algorithm: any, key: any, data: ArrayBuffer) => {
    const prefix = new Uint8Array([0xaa, 0xbb]);
    const result = new Uint8Array(prefix.length + data.byteLength);
    result.set(prefix, 0);
    result.set(new Uint8Array(data), prefix.length);
    return result.buffer;
  });
  mockSubtle.decrypt.mockImplementation(async (algorithm: any, key: any, data: ArrayBuffer) => {
    const dataArray = new Uint8Array(data);
    return dataArray.slice(2).buffer;
  });
  // Reset twoFactorService pluggable store
  twoFactorService._lockoutStore = null;
});

// ═════════════════════════════════════════════════════════════════════════════
// Property-based tests
// ═════════════════════════════════════════════════════════════════════════════

describe('Property-based tests', () => {
  test('Property 1: Generated secrets meet minimum entropy', () => {
    // Feature: totp-two-factor-auth, Property 1: Generated secrets meet minimum entropy
    fc.assert(
      fc.property(fc.string(), (label) => {
        const { secret } = twoFactorService.generateSecret(label);
        return base32DecodeBytes(secret).length >= 20;
      }),
      { numRuns: 100 },
    );
  });

  test('Property 2: TOTP URI format and issuer', () => {
    // Feature: totp-two-factor-auth, Property 2: TOTP URI format and issuer
    fc.assert(
      fc.property(fc.string(), (label) => {
        const { secret, uri } = twoFactorService.generateSecret(label);
        const url = new URL(uri);
        return (
          uri.startsWith('otpauth://totp/') &&
          url.searchParams.get('secret') === secret &&
          url.searchParams.get('issuer') === 'SocialFlow'
        );
      }),
      { numRuns: 100 },
    );
  });

  test('Property 3: URI secret round-trip', () => {
    // Feature: totp-two-factor-auth, Property 3: URI secret round-trip
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (label) => {
        const { secret, uri } = twoFactorService.generateSecret(label);
        const extracted = new URL(uri).searchParams.get('secret');
        return extracted === secret;
      }),
      { numRuns: 100 },
    );
  });

  test('Property 4: Current TOTP token always verifies', async () => {
    // Feature: totp-two-factor-auth, Property 4: Current TOTP token always verifies
    await fc.assert(
      fc.asyncProperty(fc.string(), async (label) => {
        const { secret } = twoFactorService.generateSecret(label);
        const token = generateTotpToken(secret);
        return await twoFactorService.verifyToken(secret, token);
      }),
      { numRuns: 100 },
    );
  });

  test('Property 5: Enable persists 2FA state', async () => {
    // Feature: totp-two-factor-auth, Property 5: Enable persists 2FA state
    await fc.assert(
      fc.asyncProperty(fc.string(), async (label) => {
        localStorage.clear();
        const { secret } = twoFactorService.generateSecret(label);
        await twoFactorService.enable(secret);
        if (!twoFactorService.isEnabled()) return false;
        const token = generateTotpToken(secret);
        return await twoFactorService.verifyStoredToken(token);
      }),
      { numRuns: 100 },
    );
  });

  test('Property 6: Recovery code format invariant', () => {
    // Feature: totp-two-factor-auth, Property 6: Recovery code format invariant
    fc.assert(
      fc.property(fc.constant(null), () => {
        const codes = twoFactorService.generateRecoveryCodes();
        return codes.length === 8 && codes.every((c) => /^[A-Za-z0-9]{10}$/.test(c));
      }),
      { numRuns: 100 },
    );
  });

  test('Property 7: Recovery codes are not stored in plaintext', async () => {
    // Feature: totp-two-factor-auth, Property 7: Recovery codes are not stored in plaintext
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        localStorage.clear();
        const codes = twoFactorService.generateRecoveryCodes();
        await twoFactorService.storeRecoveryCodes(codes);
        const raw = localStorage.getItem('sf_recovery_codes') ?? '';
        return codes.every((c) => !raw.includes(c));
      }),
      { numRuns: 5 },
    );
  }, 60_000);

  test('Property 8: Recovery codes are single-use', async () => {
    // Feature: totp-two-factor-auth, Property 8: Recovery codes are single-use
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        localStorage.clear();
        const codes = twoFactorService.generateRecoveryCodes();
        await twoFactorService.storeRecoveryCodes(codes);
        const code = codes[0];
        const first = await twoFactorService.verifyRecoveryCode(code);
        const second = await twoFactorService.verifyRecoveryCode(code);
        return first === true && second === false;
      }),
      { numRuns: 5 },
    );
  }, 60_000);

  test('Property 9: Regeneration invalidates all prior codes', async () => {
    // Feature: totp-two-factor-auth, Property 9: Regeneration invalidates all prior codes
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        localStorage.clear();
        const oldCodes = twoFactorService.generateRecoveryCodes();
        await twoFactorService.storeRecoveryCodes(oldCodes);
        await twoFactorService.regenerateRecoveryCodes();
        const results = await Promise.all(
          oldCodes.map((c) => twoFactorService.verifyRecoveryCode(c)),
        );
        return results.every((r) => r === false);
      }),
      { numRuns: 3 },
    );
  }, 120_000);

  test('Property 10: Failed attempt counter increments on invalid token', async () => {
    // Feature: totp-two-factor-auth, Property 10: Failed attempt counter increments on invalid token
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 4 }), async (n) => {
        twoFactorService.resetFailedAttempts();
        for (let i = 0; i < n; i++) twoFactorService.recordFailedAttempt();
        const notLockedYet = !(await twoFactorService.isLockedOut());
        twoFactorService.resetFailedAttempts();
        return notLockedYet;
      }),
      { numRuns: 100 },
    );
  });

  test('Property 11: Lockout activates after 5 failures', async () => {
    // Feature: totp-two-factor-auth, Property 11: Lockout activates after 5 failures
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        twoFactorService.resetFailedAttempts();
        for (let i = 0; i < 5; i++) twoFactorService.recordFailedAttempt();
        const locked = await twoFactorService.isLockedOut();
        const remaining = await twoFactorService.getLockoutRemainingMs();
        twoFactorService.resetFailedAttempts();
        return locked && remaining > 290_000 && remaining <= 300_000;
      }),
      { numRuns: 100 },
    );
  });

  test('Property 12: Replay attack prevention', async () => {
    // Feature: totp-two-factor-auth, Property 12: Replay attack prevention
    await fc.assert(
      fc.asyncProperty(fc.string(), async (label) => {
        localStorage.clear();
        const { secret } = twoFactorService.generateSecret(label);
        await twoFactorService.enable(secret);
        const token = generateTotpToken(secret);
        const first = await twoFactorService.verifyStoredToken(token);
        const second = await twoFactorService.verifyStoredToken(token);
        return first === true && second === false;
      }),
      { numRuns: 100 },
    );
  });

  test('Property 13: Disable clears all 2FA state', async () => {
    // Feature: totp-two-factor-auth, Property 13: Disable clears all 2FA state
    await fc.assert(
      fc.asyncProperty(fc.string(), async (label) => {
        localStorage.clear();
        const { secret } = twoFactorService.generateSecret(label);
        await twoFactorService.enable(secret);
        const codes = twoFactorService.generateRecoveryCodes();
        await twoFactorService.storeRecoveryCodes(codes);
        await twoFactorService.disable();
        if (twoFactorService.isEnabled()) return false;
        const recoveryValid = await twoFactorService.verifyRecoveryCode(codes[0]);
        return !recoveryValid;
      }),
      { numRuns: 100 },
    );
  });

  test('Property 14: Secret and key are not stored in plaintext', async () => {
    // Feature: totp-two-factor-auth, Property 14: Secret and key are not stored in plaintext
    await fc.assert(
      fc.asyncProperty(fc.string(), async (label) => {
        localStorage.clear();
        const { secret } = twoFactorService.generateSecret(label);
        await twoFactorService.enable(secret);
        const raw = localStorage.getItem('sf_user_2fa') ?? '';
        return !raw.includes(secret);
      }),
      { numRuns: 100 },
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Unit tests
// ═════════════════════════════════════════════════════════════════════════════

describe('Unit tests', () => {
  test('generateSecret returns valid otpauth URI with SocialFlow issuer', () => {
    const { secret, uri } = twoFactorService.generateSecret('user@example.com');
    expect(uri).toMatch(/^otpauth:\/\/totp\//);
    expect(uri).toContain('issuer=SocialFlow');
    expect(uri).toContain(`secret=${secret}`);
  });

  test('verifyToken returns false for wrong token', async () => {
    const { secret } = twoFactorService.generateSecret('test');
    expect(await twoFactorService.verifyToken(secret, '000000')).toBe(false);
  });

  test('isEnabled returns false when no store exists', () => {
    localStorage.clear();
    expect(twoFactorService.isEnabled()).toBe(false);
  });

  test('isEnabled returns true after enable()', async () => {
    const { secret } = twoFactorService.generateSecret('test');
    await twoFactorService.enable(secret);
    expect(twoFactorService.isEnabled()).toBe(true);
  });

  test('isEnabled returns false after disable()', async () => {
    const { secret } = twoFactorService.generateSecret('test');
    await twoFactorService.enable(secret);
    await twoFactorService.disable();
    expect(twoFactorService.isEnabled()).toBe(false);
  });

  test('generateRecoveryCodes returns exactly 8 codes of 10 alphanumeric chars', () => {
    const codes = twoFactorService.generateRecoveryCodes();
    expect(codes).toHaveLength(8);
    codes.forEach((c) => expect(c).toMatch(/^[A-Za-z0-9]{10}$/));
  });

  test('getRemainingRecoveryCodeCount returns 8 after storing fresh codes', async () => {
    const codes = twoFactorService.generateRecoveryCodes();
    await twoFactorService.storeRecoveryCodes(codes);
    expect(await twoFactorService.getRemainingRecoveryCodeCount()).toBe(8);
  });

  test('getRemainingRecoveryCodeCount decrements after using a code', async () => {
    const codes = twoFactorService.generateRecoveryCodes();
    await twoFactorService.storeRecoveryCodes(codes);
    await twoFactorService.verifyRecoveryCode(codes[0]);
    expect(await twoFactorService.getRemainingRecoveryCodeCount()).toBe(7);
  });

  test('isLockedOut returns false initially', async () => {
    expect(await twoFactorService.isLockedOut()).toBe(false);
  });

  test('isLockedOut returns true after 5 failed attempts', async () => {
    for (let i = 0; i < 5; i++) twoFactorService.recordFailedAttempt();
    expect(await twoFactorService.isLockedOut()).toBe(true);
  });

  test('getLockoutRemainingMs is ~300000 immediately after lockout', async () => {
    for (let i = 0; i < 5; i++) twoFactorService.recordFailedAttempt();
    expect(await twoFactorService.getLockoutRemainingMs()).toBeGreaterThan(299_000);
  });

  test('resetFailedAttempts clears lockout', async () => {
    for (let i = 0; i < 5; i++) twoFactorService.recordFailedAttempt();
    twoFactorService.resetFailedAttempts();
    expect(await twoFactorService.isLockedOut()).toBe(false);
  });

  test('verifyStoredToken returns false when 2FA is disabled', async () => {
    localStorage.clear();
    expect(await twoFactorService.verifyStoredToken('123456')).toBe(false);
  });

  test('decryption failure: isEnabled returns false on corrupted store', () => {
    localStorage.setItem('sf_user_2fa', 'not-valid-json{{{');
    expect(twoFactorService.isEnabled()).toBe(false);
  });

  test('verifyRecoveryCode returns false for unknown code', async () => {
    const codes = twoFactorService.generateRecoveryCodes();
    await twoFactorService.storeRecoveryCodes(codes);
    expect(await twoFactorService.verifyRecoveryCode('XXXXXXXXXX')).toBe(false);
  });

  test('generate → store → verify round-trip succeeds for every code', async () => {
    const codes = twoFactorService.generateRecoveryCodes();
    await twoFactorService.storeRecoveryCodes(codes);
    for (const code of codes) {
      expect(await twoFactorService.verifyRecoveryCode(code)).toBe(true);
    }
  });

  test('plaintext codes are never present in localStorage after storing', async () => {
    const codes = twoFactorService.generateRecoveryCodes();
    await twoFactorService.storeRecoveryCodes(codes);
    const raw = localStorage.getItem('sf_recovery_codes') ?? '';
    for (const code of codes) {
      expect(raw).not.toContain(code);
    }
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Pluggable lockout store tests (#1247)
// ═════════════════════════════════════════════════════════════════════════════

describe('Pluggable lockout store (#1247)', () => {
  afterEach(() => {
    // Reset pluggable store after each test in this suite
    twoFactorService._lockoutStore = null;
    twoFactorService.resetFailedAttempts();
  });

  test('isLockedOut delegates to pluggable store when userId is provided', async () => {
    const mockStore = {
      recordFailedAttempt: jest.fn().mockResolvedValue(undefined),
      isLockedOut: jest.fn().mockResolvedValue(true),
      getLockoutRemainingMs: jest.fn().mockResolvedValue(180_000),
      resetFailedAttempts: jest.fn().mockResolvedValue(undefined),
    };

    twoFactorService.setLockoutStore(mockStore);

    const result = await twoFactorService.isLockedOut('user-123');

    expect(result).toBe(true);
    expect(mockStore.isLockedOut).toHaveBeenCalledWith('user-123');
  });

  test('isLockedOut returns false via store when store says not locked', async () => {
    const mockStore = {
      recordFailedAttempt: jest.fn().mockResolvedValue(undefined),
      isLockedOut: jest.fn().mockResolvedValue(false),
      getLockoutRemainingMs: jest.fn().mockResolvedValue(0),
      resetFailedAttempts: jest.fn().mockResolvedValue(undefined),
    };

    twoFactorService.setLockoutStore(mockStore);

    const result = await twoFactorService.isLockedOut('user-456');

    expect(result).toBe(false);
    expect(mockStore.isLockedOut).toHaveBeenCalledWith('user-456');
  });

  test('getLockoutRemainingMs delegates to pluggable store when userId is provided', async () => {
    const mockStore = {
      recordFailedAttempt: jest.fn().mockResolvedValue(undefined),
      isLockedOut: jest.fn().mockResolvedValue(true),
      getLockoutRemainingMs: jest.fn().mockResolvedValue(240_000),
      resetFailedAttempts: jest.fn().mockResolvedValue(undefined),
    };

    twoFactorService.setLockoutStore(mockStore);

    const remaining = await twoFactorService.getLockoutRemainingMs('user-789');

    expect(remaining).toBe(240_000);
    expect(mockStore.getLockoutRemainingMs).toHaveBeenCalledWith('user-789');
  });

  test('isLockedOut falls back to in-memory state when no userId is provided', async () => {
    const mockStore = {
      recordFailedAttempt: jest.fn().mockResolvedValue(undefined),
      isLockedOut: jest.fn().mockResolvedValue(true),
      getLockoutRemainingMs: jest.fn().mockResolvedValue(999_999),
      resetFailedAttempts: jest.fn().mockResolvedValue(undefined),
    };

    twoFactorService.setLockoutStore(mockStore);

    // No userId — must use in-memory, NOT the pluggable store
    const result = await twoFactorService.isLockedOut();

    expect(result).toBe(false); // in-memory has no lockout
    expect(mockStore.isLockedOut).not.toHaveBeenCalled();
  });

  test('pluggable store lockout is not bypassed — in-memory failures do not affect store result', async () => {
    const mockStore = {
      recordFailedAttempt: jest.fn().mockResolvedValue(undefined),
      isLockedOut: jest.fn().mockResolvedValue(true),
      getLockoutRemainingMs: jest.fn().mockResolvedValue(60_000),
      resetFailedAttempts: jest.fn().mockResolvedValue(undefined),
    };

    twoFactorService.setLockoutStore(mockStore);

    // Even if in-memory has 0 failures, store says locked
    const result = await twoFactorService.isLockedOut('user-abc');
    expect(result).toBe(true);
    expect(mockStore.isLockedOut).toHaveBeenCalledTimes(1);
  });

  test('recordFailedAttempt delegates to pluggable store when userId is provided', () => {
    const mockStore = {
      recordFailedAttempt: jest.fn().mockResolvedValue(undefined),
      isLockedOut: jest.fn().mockResolvedValue(false),
      getLockoutRemainingMs: jest.fn().mockResolvedValue(0),
      resetFailedAttempts: jest.fn().mockResolvedValue(undefined),
    };

    twoFactorService.setLockoutStore(mockStore);
    twoFactorService.recordFailedAttempt('user-xyz');

    expect(mockStore.recordFailedAttempt).toHaveBeenCalledWith('user-xyz');
  });

  test('resetFailedAttempts delegates to pluggable store when userId is provided', () => {
    const mockStore = {
      recordFailedAttempt: jest.fn().mockResolvedValue(undefined),
      isLockedOut: jest.fn().mockResolvedValue(false),
      getLockoutRemainingMs: jest.fn().mockResolvedValue(0),
      resetFailedAttempts: jest.fn().mockResolvedValue(undefined),
    };

    twoFactorService.setLockoutStore(mockStore);
    twoFactorService.resetFailedAttempts('user-xyz');

    expect(mockStore.resetFailedAttempts).toHaveBeenCalledWith('user-xyz');
  });
});
