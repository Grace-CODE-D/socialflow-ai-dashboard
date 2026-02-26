/**
 * Encryption Service Tests
 * Tests for data encryption/decryption
 */

import { EncryptionService } from '../../services/encryptionService';

describe('EncryptionService', () => {
    let encryptionService: EncryptionService;
    const testSignature = 'test_wallet_signature_12345';

    beforeEach(() => {
        encryptionService = new EncryptionService();
        localStorage.clear();
    });

    describe('Initialization', () => {
        test('should initialize with wallet signature', async () => {
            await encryptionService.initialize(testSignature);
            expect(encryptionService.isReady()).toBe(true);
        });

        test('should fail without initialization', async () => {
            await expect(encryptionService.encrypt('test')).rejects.toThrow(
                'Encryption service not initialized'
            );
        });

        test('should generate and store salt', async () => {
            await encryptionService.initialize(testSignature);

            const salt = localStorage.getItem('encryption_salt');
            expect(salt).toBeTruthy();
        });

        test('should reuse existing salt', async () => {
            await encryptionService.initialize(testSignature);
            const salt1 = localStorage.getItem('encryption_salt');

            // Create new instance
            const newService = new EncryptionService();
            await newService.initialize(testSignature);
            const salt2 = localStorage.getItem('encryption_salt');

            expect(salt1).toBe(salt2);
        });
    });

    describe('Encryption/Decryption', () => {
        beforeEach(async () => {
            await encryptionService.initialize(testSignature);
        });

        test('should encrypt data', async () => {
            const plaintext = 'sensitive data';
            const encrypted = await encryptionService.encrypt(plaintext);

            expect(encrypted).toBeTruthy();
            expect(encrypted).not.toBe(plaintext);
            expect(typeof encrypted).toBe('string');
        });

        test('should decrypt data', async () => {
            const plaintext = 'sensitive data';
            const encrypted = await encryptionService.encrypt(plaintext);
            const decrypted = await encryptionService.decrypt(encrypted);

            expect(decrypted).toBe(plaintext);
        });

        test('should produce different ciphertext for same plaintext', async () => {
            const plaintext = 'sensitive data';
            const encrypted1 = await encryptionService.encrypt(plaintext);
            const encrypted2 = await encryptionService.encrypt(plaintext);

            // Different due to random IV
            expect(encrypted1).not.toBe(encrypted2);

            // But both decrypt to same plaintext
            const decrypted1 = await encryptionService.decrypt(encrypted1);
            const decrypted2 = await encryptionService.decrypt(encrypted2);
            expect(decrypted1).toBe(plaintext);
            expect(decrypted2).toBe(plaintext);
        });

        test('should handle empty string', async () => {
            const encrypted = await encryptionService.encrypt('');
            const decrypted = await encryptionService.decrypt(encrypted);

            expect(decrypted).toBe('');
        });

        test('should handle special characters', async () => {
            const plaintext = '!@#$%^&*()_+-=[]{}|;:,.<>?';
            const encrypted = await encryptionService.encrypt(plaintext);
            const decrypted = await encryptionService.decrypt(encrypted);

            expect(decrypted).toBe(plaintext);
        });

        test('should handle unicode characters', async () => {
            const plaintext = '你好世界 🌍 مرحبا';
            const encrypted = await encryptionService.encrypt(plaintext);
            const decrypted = await encryptionService.decrypt(encrypted);

            expect(decrypted).toBe(plaintext);
        });

        test('should fail to decrypt with wrong key', async () => {
            const plaintext = 'sensitive data';
            const encrypted = await encryptionService.encrypt(plaintext);

            // Create new service with different signature
            const newService = new EncryptionService();
            await newService.initialize('different_signature');

            await expect(newService.decrypt(encrypted)).rejects.toThrow();
        });
    });

    describe('Secure Storage', () => {
        beforeEach(async () => {
            await encryptionService.initialize(testSignature);
        });

        test('should store encrypted item', async () => {
            const key = 'test_key';
            const value = { secret: 'data', number: 123 };

            await encryptionService.setSecureItem(key, value);

            const stored = localStorage.getItem(`secure_${key}`);
            expect(stored).toBeTruthy();
            expect(stored).not.toContain('secret');
            expect(stored).not.toContain('data');
        });

        test('should retrieve encrypted item', async () => {
            const key = 'test_key';
            const value = { secret: 'data', number: 123 };

            await encryptionService.setSecureItem(key, value);
            const retrieved = await encryptionService.getSecureItem(key);

            expect(retrieved).toEqual(value);
        });

        test('should return null for non-existent item', async () => {
            const retrieved = await encryptionService.getSecureItem('non_existent');
            expect(retrieved).toBeNull();
        });

        test('should remove secure item', async () => {
            const key = 'test_key';
            await encryptionService.setSecureItem(key, 'value');

            encryptionService.removeSecureItem(key);

            const retrieved = await encryptionService.getSecureItem(key);
            expect(retrieved).toBeNull();
        });
    });

    describe('IPC Message Encryption', () => {
        beforeEach(async () => {
            await encryptionService.initialize(testSignature);
        });

        test('should encrypt IPC message', async () => {
            const message = { action: 'transfer', amount: 1000 };
            const encrypted = await encryptionService.encryptIPCMessage(message);

            expect(encrypted).toBeTruthy();
            expect(typeof encrypted).toBe('string');
            expect(encrypted).not.toContain('transfer');
        });

        test('should decrypt IPC message', async () => {
            const message = { action: 'transfer', amount: 1000 };
            const encrypted = await encryptionService.encryptIPCMessage(message);
            const decrypted = await encryptionService.decryptIPCMessage(encrypted);

            expect(decrypted).toEqual(message);
        });
    });

    describe('Hashing', () => {
        beforeEach(async () => {
            await encryptionService.initialize(testSignature);
        });

        test('should hash data', async () => {
            const data = 'password123';
            const hash = await encryptionService.hash(data);

            expect(hash).toBeTruthy();
            expect(typeof hash).toBe('string');
            expect(hash).not.toBe(data);
        });

        test('should produce consistent hash', async () => {
            const data = 'password123';
            const hash1 = await encryptionService.hash(data);
            const hash2 = await encryptionService.hash(data);

            expect(hash1).toBe(hash2);
        });

        test('should produce different hash for different data', async () => {
            const hash1 = await encryptionService.hash('password123');
            const hash2 = await encryptionService.hash('password456');

            expect(hash1).not.toBe(hash2);
        });
    });

    describe('IndexedDB Encryption', () => {
        beforeEach(async () => {
            await encryptionService.initialize(testSignature);
        });

        test('should encrypt sensitive fields', async () => {
            const obj = {
                id: 1,
                publicData: 'visible',
                privateKey: 'secret_key',
                seedPhrase: 'secret seed phrase',
            };

            const encrypted = await encryptionService.encryptForDB(obj, [
                'privateKey',
                'seedPhrase',
            ]);

            expect(encrypted.id).toBe(1);
            expect(encrypted.publicData).toBe('visible');
            expect(encrypted.privateKey).not.toBe('secret_key');
            expect(encrypted.seedPhrase).not.toBe('secret seed phrase');
        });

        test('should decrypt sensitive fields', async () => {
            const obj = {
                id: 1,
                publicData: 'visible',
                privateKey: 'secret_key',
                seedPhrase: 'secret seed phrase',
            };

            const encrypted = await encryptionService.encryptForDB(obj, [
                'privateKey',
                'seedPhrase',
            ]);
            const decrypted = await encryptionService.decryptFromDB(encrypted, [
                'privateKey',
                'seedPhrase',
            ]);

            expect(decrypted).toEqual(obj);
        });
    });

    describe('Key Management', () => {
        beforeEach(async () => {
            await encryptionService.initialize(testSignature);
        });

        test('should generate random key', async () => {
            const key = await encryptionService.generateKey();
            expect(key).toBeTruthy();
        });

        test('should export key', async () => {
            const key = await encryptionService.generateKey();
            const exported = await encryptionService.exportKey(key);

            expect(exported).toBeTruthy();
            expect(typeof exported).toBe('string');
        });

        test('should import key', async () => {
            const key = await encryptionService.generateKey();
            const exported = await encryptionService.exportKey(key);
            const imported = await encryptionService.importKey(exported);

            expect(imported).toBeTruthy();
        });

        test('should clear encryption key', () => {
            encryptionService.clearKey();
            expect(encryptionService.isReady()).toBe(false);
        });
    });

    describe('HMAC', () => {
        beforeEach(async () => {
            await encryptionService.initialize(testSignature);
        });

        test('should generate HMAC', async () => {
            const data = 'message';
            const key = 'secret_key';
            const hmac = await encryptionService.generateHMAC(data, key);

            expect(hmac).toBeTruthy();
            expect(typeof hmac).toBe('string');
        });

        test('should verify HMAC', async () => {
            const data = 'message';
            const key = 'secret_key';
            const hmac = await encryptionService.generateHMAC(data, key);

            const isValid = await encryptionService.verifyHMAC(data, hmac, key);
            expect(isValid).toBe(true);
        });

        test('should fail verification with wrong key', async () => {
            const data = 'message';
            const key = 'secret_key';
            const hmac = await encryptionService.generateHMAC(data, key);

            const isValid = await encryptionService.verifyHMAC(data, hmac, 'wrong_key');
            expect(isValid).toBe(false);
        });

        test('should fail verification with tampered data', async () => {
            const data = 'message';
            const key = 'secret_key';
            const hmac = await encryptionService.generateHMAC(data, key);

            const isValid = await encryptionService.verifyHMAC('tampered', hmac, key);
            expect(isValid).toBe(false);
        });
    });

    describe('Utility Functions', () => {
        test('should generate random string', () => {
            const random1 = encryptionService.generateRandomString(32);
            const random2 = encryptionService.generateRandomString(32);

            expect(random1).toBeTruthy();
            expect(random2).toBeTruthy();
            expect(random1).not.toBe(random2);
            expect(random1.length).toBe(32);
        });
    });
});
