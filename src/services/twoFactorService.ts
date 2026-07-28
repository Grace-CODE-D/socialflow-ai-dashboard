import { TOTP, NobleCryptoPlugin, ScureBase32Plugin } from 'otplib';

// ── Error types ──────────────────────────────────────────────────────────────

export class TwoFactorUnavailableError extends Error {
  constructor() { super('2FA not supported on this platform'); }
}
export class TwoFactorDecryptionError extends Error {
  constructor() { super('Failed to decrypt 2FA data'); }
}
export class TwoFactorLockedOutError extends Error {
  constructor(public remainingMs: number) { super('Too many failed attempts'); }
}

// ── otplib instance ───────────────────────────────────────────────────────────

const totpInstance = new TOTP({
  crypto: new NobleCryptoPlugin(),
  base32: new ScureBase32Plugin(),
});

// ── Storage interfaces ────────────────────────────────────────────────────────

interface TwoFactorUserStore {
  twoFactorEnabled: boolean;
  encryptedSecret: string;   // base64(iv[12] + authTag[16] + ciphertext)
  encryptedKey: string;      // base64 of safeStorage output
}

interface RecoveryCodeEntry { hash: string; consumed: boolean; }
interface RecoveryCodeData  { codes: RecoveryCodeEntry[]; }
interface RecoveryCodeStore {
  encryptedCodes: string;
  encryptedKey: string;
}

// ── Rate-limit state (in-memory only) ────────────────────────────────────────

interface RateLimitState {
  failedAttempts: number;
  lockedUntil: number | null;
}

// ── Pluggable lockout store interface ────────────────────────────────────────

export interface TwoFactorLockoutStore {
  recordFailedAttempt(userId: string): Promise<void>;
  isLockedOut(userId: string): Promise<boolean>;
  getLockoutRemainingMs(userId: string): Promise<number>;
  resetFailedAttempts(userId: string): Promise<void>;
}

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000;
const USER_STORE_KEY = 'sf_user_2fa';
const RECOVERY_STORE_KEY = 'sf_recovery_codes';

// ── WebCrypto helper for key derivation (browser-compatible) ─────────────────

async function getWebCrypto(): Promise<SubtleCrypto> {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    return window.crypto.subtle;
  }
  throw new TwoFactorUnavailableError();
}

// Derive a master key from user's session (or a stable identifier)
// In a real implementation, this should be derived from the user's auth session
// For now, we'll use a stable key stored in sessionStorage (ephemeral per-session)
async function deriveUserKey(): Promise<CryptoKey> {
  const subtle = await getWebCrypto();
  let keyMaterial = sessionStorage.getItem('sf_2fa_key_material');
  
  if (!keyMaterial) {
    // Generate new key material for this session
    const randomBytes = new Uint8Array(32);
    window.crypto.getRandomValues(randomBytes);
    keyMaterial = Array.from(randomBytes, b => b.toString(16).padStart(2, '0')).join('');
    sessionStorage.setItem('sf_2fa_key_material', keyMaterial);
  }
  
  // Convert hex string to Uint8Array
  const keyData = new Uint8Array(keyMaterial.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
  
  // Import as raw key
  return await subtle.importKey(
    'raw',
    keyData,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
}

async function encryptString(plaintext: string): Promise<string> {
  const subtle = await getWebCrypto();
  const masterKey = await deriveUserKey();
  
  // Derive AES key from master key
  const salt = new Uint8Array(16);
  window.crypto.getRandomValues(salt);
  
  const aesKey = await subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    masterKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  const iv = new Uint8Array(12);
  window.crypto.getRandomValues(iv);
  
  const encoder = new TextEncoder();
  const ciphertext = await subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    encoder.encode(plaintext)
  );
  
  // Combine salt + iv + ciphertext
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);
  
  // Return as base64
  return btoa(String.fromCharCode(...combined));
}

async function decryptString(encrypted: string): Promise<string> {
  const subtle = await getWebCrypto();
  const masterKey = await deriveUserKey();
  
  // Decode base64
  const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
  
  // Extract salt, iv, ciphertext
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const ciphertext = combined.slice(28);
  
  // Derive same AES key
  const aesKey = await subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    masterKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  
  const plaintext = await subtle.decrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    ciphertext
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(plaintext);
}

// ── AES-256-GCM helpers (WebCrypto) ──────────────────────────────────────────

async function aesEncrypt(plaintext: string, keyHex: string): Promise<string> {
  const subtle = await getWebCrypto();
  
  // Convert hex key to Uint8Array
  const keyData = new Uint8Array(keyHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
  
  // Import key
  const key = await subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  const iv = new Uint8Array(12);
  window.crypto.getRandomValues(iv);
  
  const encoder = new TextEncoder();
  const ciphertext = await subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );
  
  // Combine iv + ciphertext (tag is included in ciphertext by WebCrypto)
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

async function aesDecrypt(blob: string, keyHex: string): Promise<string> {
  const subtle = await getWebCrypto();
  
  // Decode base64
  const combined = Uint8Array.from(atob(blob), c => c.charCodeAt(0));
  
  // Extract iv and ciphertext (WebCrypto includes auth tag in ciphertext)
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  
  // Convert hex key to Uint8Array
  const keyData = new Uint8Array(keyHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
  
  // Import key
  const key = await subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  
  const plaintext = await subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(plaintext);
}

// ── Recovery code hashing (PBKDF2 via WebCrypto) ────────────────────────────

const PBKDF2_ITERATIONS = 100000;

async function hashRecoveryCode(plainCode: string): Promise<string> {
  const subtle = await getWebCrypto();
  const encoder = new TextEncoder();
  
  // Generate salt
  const salt = new Uint8Array(16);
  window.crypto.getRandomValues(salt);
  
  // Import password
  const keyMaterial = await subtle.importKey(
    'raw',
    encoder.encode(plainCode),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  // Derive hash
  const derived = await subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256  // 32 bytes
  );
  
  const saltHex = Array.from(salt, b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(new Uint8Array(derived), b => b.toString(16).padStart(2, '0')).join('');
  
  return `${saltHex}:${hashHex}`;
}

async function checkRecoveryCode(plainCode: string, storedHash: string): Promise<boolean> {
  const [saltHex, hashHex] = storedHash.split(':');
  if (!saltHex || !hashHex) return false;
  
  const subtle = await getWebCrypto();
  const encoder = new TextEncoder();
  
  // Parse salt
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
  const expected = new Uint8Array(hashHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
  
  // Import password
  const keyMaterial = await subtle.importKey(
    'raw',
    encoder.encode(plainCode),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  // Derive hash
  const derived = await subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  
  const derivedArray = new Uint8Array(derived);
  
  // Timing-safe comparison
  if (derivedArray.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < derivedArray.length; i++) {
    diff |= derivedArray[i] ^ expected[i];
  }
  return diff === 0;
}

// ── twoFactorService ──────────────────────────────────────────────────────────

const rateLimitState: RateLimitState = { failedAttempts: 0, lockedUntil: null };

// Track last used token per window to prevent replay attacks
let lastUsedToken: string | null = null;
let lastUsedTokenTime: number = 0;

export const twoFactorService = {

  // ── Lockout store (pluggable — defaults to in-memory) ───────────────────────

  _lockoutStore: null as TwoFactorLockoutStore | null,

  setLockoutStore(store: TwoFactorLockoutStore): void {
    twoFactorService._lockoutStore = store;
  },

  // ── Secret lifecycle ────────────────────────────────────────────────────────

  generateSecret(accountLabel: string): { secret: string; uri: string } {
    const secret = totpInstance.generateSecret(20); // 20 bytes = 160 bits
    const uri = totpInstance.toURI({ secret, label: accountLabel, issuer: 'SocialFlow' });
    return { secret, uri };
  },

  async verifyToken(secret: string, token: string): Promise<boolean> {
    try {
      const result = await totpInstance.verify(token, { secret, epochTolerance: 30 });
      return result.valid;
    } catch {
      return false;
    }
  },

  async verifyStoredToken(token: string): Promise<boolean> {
    try {
      const store = twoFactorService._readUserStore();
      if (!store?.twoFactorEnabled) return false;

      const keyHex = await decryptString(store.encryptedKey);
      const secret = await aesDecrypt(store.encryptedSecret, keyHex);

      // Replay attack prevention: reject token if already used in current window
      const now = Math.floor(Date.now() / 1000);
      const windowStart = now - (now % 30);
      if (token === lastUsedToken && lastUsedTokenTime >= windowStart) return false;

      const valid = await twoFactorService.verifyToken(secret, token);
      if (valid) {
        lastUsedToken = token;
        lastUsedTokenTime = now;
      }
      return valid;
    } catch (e) {
      if (e instanceof TwoFactorUnavailableError) throw e;
      console.error('verifyStoredToken error:', e);
      return false;
    }
  },

  // ── Enable / disable ────────────────────────────────────────────────────────

  async enable(secret: string): Promise<void> {
    // Generate random AES key
    const keyBytes = new Uint8Array(32);
    window.crypto.getRandomValues(keyBytes);
    const keyHex = Array.from(keyBytes, b => b.toString(16).padStart(2, '0')).join('');
    
    const encryptedKey = await encryptString(keyHex);
    const encryptedSecret = await aesEncrypt(secret, keyHex);
    const store: TwoFactorUserStore = { twoFactorEnabled: true, encryptedSecret, encryptedKey };
    localStorage.setItem(USER_STORE_KEY, JSON.stringify(store));
  },

  async disable(): Promise<void> {
    localStorage.setItem(USER_STORE_KEY, JSON.stringify({ twoFactorEnabled: false, encryptedSecret: '', encryptedKey: '' }));
    localStorage.removeItem(RECOVERY_STORE_KEY);
    lastUsedToken = null;
    lastUsedTokenTime = 0;
    twoFactorService.resetFailedAttempts();
  },

  isEnabled(): boolean {
    try {
      const store = twoFactorService._readUserStore();
      return store?.twoFactorEnabled === true;
    } catch {
      return false;
    }
  },

  // ── Recovery codes ──────────────────────────────────────────────────────────

  generateRecoveryCodes(): string[] {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length: 8 }, () => {
      const randomBytes = new Uint8Array(10);
      window.crypto.getRandomValues(randomBytes);
      return Array.from(randomBytes)
        .map(b => chars[b % chars.length])
        .join('');
    });
  },

  async storeRecoveryCodes(plainCodes: string[]): Promise<void> {
    const keyBytes = new Uint8Array(32);
    window.crypto.getRandomValues(keyBytes);
    const keyHex = Array.from(keyBytes, b => b.toString(16).padStart(2, '0')).join('');
    
    const encryptedKey = await encryptString(keyHex);
    const codes: RecoveryCodeEntry[] = await Promise.all(
      plainCodes.map(async code => ({ hash: await hashRecoveryCode(code), consumed: false }))
    );
    const encryptedCodes = await aesEncrypt(JSON.stringify({ codes } as RecoveryCodeData), keyHex);
    const store: RecoveryCodeStore = { encryptedCodes, encryptedKey };
    localStorage.setItem(RECOVERY_STORE_KEY, JSON.stringify(store));
  },

  async verifyRecoveryCode(code: string): Promise<boolean> {
    try {
      const raw = localStorage.getItem(RECOVERY_STORE_KEY);
      if (!raw) return false;
      const store: RecoveryCodeStore = JSON.parse(raw);
      const keyHex = await decryptString(store.encryptedKey);
      const data: RecoveryCodeData = JSON.parse(await aesDecrypt(store.encryptedCodes, keyHex));
      // Find first unconsumed entry whose hash matches
      let matchedIndex = -1;
      for (let i = 0; i < data.codes.length; i++) {
        const entry = data.codes[i];
        if (!entry.consumed && await checkRecoveryCode(code, entry.hash)) {
          matchedIndex = i;
          break;
        }
      }
      if (matchedIndex === -1) return false;
      data.codes[matchedIndex].consumed = true;
      const newEncrypted = await aesEncrypt(JSON.stringify(data), keyHex);
      localStorage.setItem(RECOVERY_STORE_KEY, JSON.stringify({ encryptedCodes: newEncrypted, encryptedKey: store.encryptedKey }));
      return true;
    } catch {
      return false;
    }
  },

  async regenerateRecoveryCodes(): Promise<string[]> {
    const codes = twoFactorService.generateRecoveryCodes();
    await twoFactorService.storeRecoveryCodes(codes);
    return codes;
  },

  async getRemainingRecoveryCodeCount(): Promise<number> {
    try {
      const raw = localStorage.getItem(RECOVERY_STORE_KEY);
      if (!raw) return 0;
      const store: RecoveryCodeStore = JSON.parse(raw);
      const keyHex = await decryptString(store.encryptedKey);
      const data: RecoveryCodeData = JSON.parse(await aesDecrypt(store.encryptedCodes, keyHex));
      return data.codes.filter(c => !c.consumed).length;
    } catch {
      return 0;
    }
  },

  // ── Rate limiting ───────────────────────────────────────────────────────────

  recordFailedAttempt(userId?: string): void {
    if (twoFactorService._lockoutStore && userId) {
      void twoFactorService._lockoutStore.recordFailedAttempt(userId);
      return;
    }
    rateLimitState.failedAttempts += 1;
    if (rateLimitState.failedAttempts >= LOCKOUT_THRESHOLD) {
      rateLimitState.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    }
  },

  async isLockedOut(userId?: string): Promise<boolean> {
    if (twoFactorService._lockoutStore && userId) {
      return await twoFactorService._lockoutStore.isLockedOut(userId);
    }
    if (rateLimitState.lockedUntil === null) return false;
    if (Date.now() >= rateLimitState.lockedUntil) {
      rateLimitState.lockedUntil = null;
      rateLimitState.failedAttempts = 0;
      return false;
    }
    return true;
  },

  async getLockoutRemainingMs(userId?: string): Promise<number> {
    if (twoFactorService._lockoutStore && userId) {
      return await twoFactorService._lockoutStore.getLockoutRemainingMs(userId);
    }
    if (rateLimitState.lockedUntil === null) return 0;
    return Math.max(0, rateLimitState.lockedUntil - Date.now());
  },

  resetFailedAttempts(userId?: string): void {
    if (twoFactorService._lockoutStore && userId) {
      void twoFactorService._lockoutStore.resetFailedAttempts(userId);
      return;
    }
    rateLimitState.failedAttempts = 0;
    rateLimitState.lockedUntil = null;
  },

  // ── Internal helpers ────────────────────────────────────────────────────────

  _readUserStore(): TwoFactorUserStore | null {
    try {
      const raw = localStorage.getItem(USER_STORE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      console.error('Failed to read 2FA user store');
      return null;
    }
  },
};
