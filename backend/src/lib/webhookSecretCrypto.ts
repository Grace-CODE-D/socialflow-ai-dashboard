import crypto from 'crypto';
import { config } from '../config/config';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const key = Buffer.from(config.WEBHOOK_SECRET_ENCRYPTION_KEY, 'hex');
  if (key.length !== 32) {
    throw new Error('WEBHOOK_SECRET_ENCRYPTION_KEY must decode to 32 bytes (64 hex characters)');
  }
  return key;
}

/**
 * Encrypt a webhook signing secret for storage.
 * Reversible (unlike a hash) because the same value must be used as the
 * HMAC key for outbound signing and inbound signature verification.
 * Format: base64(iv[12] + authTag[16] + ciphertext).
 */
export function encryptWebhookSecret(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString('base64');
}

/** Decrypt a webhook signing secret previously encrypted with encryptWebhookSecret. */
export function decryptWebhookSecret(blob: string): string {
  const key = getKey();
  const buf = Buffer.from(blob, 'base64');
  const iv = buf.subarray(0, IV_LENGTH);
  const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}
