/**
 * EncryptionService - Handles data encryption for sensitive information
 * 
 * Features:
 * - Encrypt sensitive data in localStorage
 * - Use wallet signature for encryption key derivation
 * - Encrypt IndexedDB sensitive fields
 * - Encrypt IPC messages
 * - Secure key storage
 */

export interface EncryptionConfig {
    algorithm: string;
    keyLength: number;
    iterations: number;
    saltLength: number;
}

const DEFAULT_CONFIG: EncryptionConfig = {
    algorithm: 'AES-GCM',
    keyLength: 256,
    iterations: 100000,
    saltLength: 16,
};

class EncryptionService {
    private config: EncryptionConfig;
    private encryptionKey: CryptoKey | null = null;
    private isInitialized: boolean = false;

    constructor(config: Partial<EncryptionConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Initialize encryption with wallet signature
     */
    async initialize(walletSignature: string): Promise<void> {
        try {
            // Derive encryption key from wallet signature
            const keyMaterial = await this.importKeyMaterial(walletSignature);
            const salt = await this.getSalt();

            this.encryptionKey = await window.crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt,
                    iterations: this.config.iterations,
                    hash: 'SHA-256',
                },
                keyMaterial,
                {
                    name: this.config.algorithm,
                    length: this.config.keyLength,
                },
                false,
                ['encrypt', 'decrypt']
            );

            this.isInitialized = true;
            console.log('Encryption service initialized');
        } catch (error) {
            console.error('Failed to initialize encryption:', error);
            throw new Error('Encryption initialization failed');
        }
    }

    /**
     * Check if encryption is initialized
     */
    isReady(): boolean {
        return this.isInitialized && this.encryptionKey !== null;
    }

    /**
     * Encrypt data
     */
    async encrypt(data: string): Promise<string> {
        if (!this.isReady()) {
            throw new Error('Encryption service not initialized');
        }

        try {
            // Generate random IV
            const iv = window.crypto.getRandomValues(new Uint8Array(12));

            // Encode data
            const encoder = new TextEncoder();
            const encodedData = encoder.encode(data);

            // Encrypt
            const encryptedData = await window.crypto.subtle.encrypt(
                {
                    name: this.config.algorithm,
                    iv,
                },
                this.encryptionKey!,
                encodedData
            );

            // Combine IV and encrypted data
            const combined = new Uint8Array(iv.length + encryptedData.byteLength);
            combined.set(iv, 0);
            combined.set(new Uint8Array(encryptedData), iv.length);

            // Convert to base64
            return this.arrayBufferToBase64(combined);
        } catch (error) {
            console.error('Encryption failed:', error);
            throw new Error('Failed to encrypt data');
        }
    }

    /**
     * Decrypt data
     */
    async decrypt(encryptedData: string): Promise<string> {
        if (!this.isReady()) {
            throw new Error('Encryption service not initialized');
        }

        try {
            // Convert from base64
            const combined = this.base64ToArrayBuffer(encryptedData);

            // Extract IV and encrypted data
            const iv = combined.slice(0, 12);
            const data = combined.slice(12);

            // Decrypt
            const decryptedData = await window.crypto.subtle.decrypt(
                {
                    name: this.config.algorithm,
                    iv,
                },
                this.encryptionKey!,
                data
            );

            // Decode data
            const decoder = new TextDecoder();
            return decoder.decode(decryptedData);
        } catch (error) {
            console.error('Decryption failed:', error);
            throw new Error('Failed to decrypt data');
        }
    }

    /**
     * Encrypt and store in localStorage
     */
    async setSecureItem(key: string, value: any): Promise<void> {
        try {
            const jsonString = JSON.stringify(value);
            const encrypted = await this.encrypt(jsonString);
            localStorage.setItem(`secure_${key}`, encrypted);
        } catch (error) {
            console.error('Failed to store secure item:', error);
            throw new Error('Failed to store encrypted data');
        }
    }

    /**
     * Retrieve and decrypt from localStorage
     */
    async getSecureItem<T>(key: string): Promise<T | null> {
        try {
            const encrypted = localStorage.getItem(`secure_${key}`);
            if (!encrypted) {
                return null;
            }

            const decrypted = await this.decrypt(encrypted);
            return JSON.parse(decrypted) as T;
        } catch (error) {
            console.error('Failed to retrieve secure item:', error);
            return null;
        }
    }

    /**
     * Remove secure item from localStorage
     */
    removeSecureItem(key: string): void {
        localStorage.removeItem(`secure_${key}`);
    }

    /**
     * Encrypt IPC message
     */
    async encryptIPCMessage(message: any): Promise<string> {
        const jsonString = JSON.stringify(message);
        return await this.encrypt(jsonString);
    }

    /**
     * Decrypt IPC message
     */
    async decryptIPCMessage<T>(encryptedMessage: string): Promise<T> {
        const decrypted = await this.decrypt(encryptedMessage);
        return JSON.parse(decrypted) as T;
    }

    /**
     * Hash sensitive data (one-way)
     */
    async hash(data: string): Promise<string> {
        const encoder = new TextEncoder();
        const encodedData = encoder.encode(data);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', encodedData);
        return this.arrayBufferToBase64(new Uint8Array(hashBuffer));
    }

    /**
     * Generate random encryption key
     */
    async generateKey(): Promise<CryptoKey> {
        return await window.crypto.subtle.generateKey(
            {
                name: this.config.algorithm,
                length: this.config.keyLength,
            },
            true,
            ['encrypt', 'decrypt']
        );
    }

    /**
     * Export encryption key
     */
    async exportKey(key: CryptoKey): Promise<string> {
        const exported = await window.crypto.subtle.exportKey('jwk', key);
        return JSON.stringify(exported);
    }

    /**
     * Import encryption key
     */
    async importKey(keyData: string): Promise<CryptoKey> {
        const jwk = JSON.parse(keyData);
        return await window.crypto.subtle.importKey(
            'jwk',
            jwk,
            {
                name: this.config.algorithm,
                length: this.config.keyLength,
            },
            true,
            ['encrypt', 'decrypt']
        );
    }

    /**
     * Clear encryption key
     */
    clearKey(): void {
        this.encryptionKey = null;
        this.isInitialized = false;
    }

    /**
     * Import key material from wallet signature
     */
    private async importKeyMaterial(signature: string): Promise<CryptoKey> {
        const encoder = new TextEncoder();
        const keyData = encoder.encode(signature);

        return await window.crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );
    }

    /**
     * Get or generate salt
     */
    private async getSalt(): Promise<Uint8Array> {
        const storedSalt = localStorage.getItem('encryption_salt');

        if (storedSalt) {
            return this.base64ToArrayBuffer(storedSalt);
        }

        // Generate new salt
        const salt = window.crypto.getRandomValues(new Uint8Array(this.config.saltLength));
        localStorage.setItem('encryption_salt', this.arrayBufferToBase64(salt));
        return salt;
    }

    /**
     * Convert ArrayBuffer to base64
     */
    private arrayBufferToBase64(buffer: Uint8Array): string {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    /**
     * Convert base64 to ArrayBuffer
     */
    private base64ToArrayBuffer(base64: string): Uint8Array {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }

    /**
     * Encrypt object for IndexedDB
     */
    async encryptForDB(obj: any, sensitiveFields: string[]): Promise<any> {
        const encrypted = { ...obj };

        for (const field of sensitiveFields) {
            if (obj[field] !== undefined) {
                encrypted[field] = await this.encrypt(JSON.stringify(obj[field]));
            }
        }

        return encrypted;
    }

    /**
     * Decrypt object from IndexedDB
     */
    async decryptFromDB(obj: any, sensitiveFields: string[]): Promise<any> {
        const decrypted = { ...obj };

        for (const field of sensitiveFields) {
            if (obj[field] !== undefined) {
                try {
                    const decryptedValue = await this.decrypt(obj[field]);
                    decrypted[field] = JSON.parse(decryptedValue);
                } catch (error) {
                    console.error(`Failed to decrypt field ${field}:`, error);
                    decrypted[field] = null;
                }
            }
        }

        return decrypted;
    }

    /**
     * Generate secure random string
     */
    generateRandomString(length: number = 32): string {
        const array = new Uint8Array(length);
        window.crypto.getRandomValues(array);
        return this.arrayBufferToBase64(array).substring(0, length);
    }

    /**
     * Verify data integrity with HMAC
     */
    async generateHMAC(data: string, key: string): Promise<string> {
        const encoder = new TextEncoder();
        const keyData = encoder.encode(key);
        const messageData = encoder.encode(data);

        const cryptoKey = await window.crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );

        const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, messageData);
        return this.arrayBufferToBase64(new Uint8Array(signature));
    }

    /**
     * Verify HMAC
     */
    async verifyHMAC(data: string, hmac: string, key: string): Promise<boolean> {
        const expectedHMAC = await this.generateHMAC(data, key);
        return expectedHMAC === hmac;
    }
}

// Export singleton instance
export const encryptionService = new EncryptionService();

// Export class for custom instances
export { EncryptionService };
