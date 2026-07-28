import { encryptToken, decryptToken } from '../tokenEncryption';

describe('tokenEncryption', () => {
  it('round-trips a plaintext token', () => {
    const ciphertext = encryptToken('my-facebook-access-token');
    expect(decryptToken(ciphertext)).toBe('my-facebook-access-token');
  });

  it('never returns the plaintext token as-is', () => {
    const ciphertext = encryptToken('super-secret-token');
    expect(ciphertext).not.toBe('super-secret-token');
    expect(ciphertext).not.toContain('super-secret-token');
  });

  it('produces different ciphertext for the same plaintext (random IV)', () => {
    const a = encryptToken('same-token');
    const b = encryptToken('same-token');
    expect(a).not.toBe(b);
    expect(decryptToken(a)).toBe('same-token');
    expect(decryptToken(b)).toBe('same-token');
  });

  it('throws on a tampered payload', () => {
    const ciphertext = encryptToken('token-to-tamper');
    const [iv, tag, data] = ciphertext.split(':');
    const tampered = [iv, tag, data.slice(0, -2) + 'AA'].join(':');
    expect(() => decryptToken(tampered)).toThrow();
  });

  it('throws on a malformed payload', () => {
    expect(() => decryptToken('not-encrypted')).toThrow();
  });
});
