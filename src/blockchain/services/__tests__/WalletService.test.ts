/**
 * Unit Tests for WalletService
 * Requirements: 1.1-1.7
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WalletService } from '../WalletService';
import { FreighterProvider } from '../providers/FreighterProvider';
import { AlbedoProvider } from '../providers/AlbedoProvider';
import { WalletError, WalletException } from '../../types/wallet';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock
});

// Mock window.freighter
const mockFreighterAPI = {
  isConnected: vi.fn(),
  getPublicKey: vi.fn(),
  signTransaction: vi.fn(),
  signAuthEntry: vi.fn()
};

// Mock window.albedo
const mockAlbedoAPI = {
  publicKey: vi.fn(),
  tx: vi.fn(),
  signMessage: vi.fn(),
  implicitFlow: vi.fn()
};

Object.defineProperty(global, 'window', {
  value: {
    freighter: mockFreighterAPI,
    albedo: mockAlbedoAPI
  },
  writable: true
});

describe('WalletService', () => {
  let walletService: WalletService;

  beforeEach(() => {
    walletService = new WalletService();
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    walletService.destroy();
  });

  describe('Provider Detection and Registration', () => {
    test('should register Freighter and Albedo providers', () => {
      const providers = walletService.getAvailableProviders();
      
      expect(providers).toHaveLength(2);
      expect(providers.find(p => p.name === 'Freighter')).toBeDefined();
      expect(providers.find(p => p.name === 'Albedo')).toBeDefined();
    });

    test('should detect installed providers', () => {
      const providers = walletService.getAvailableProviders();
      
      const freighter = providers.find(p => p.name === 'Freighter');
      const albedo = providers.find(p => p.name === 'Albedo');
      
      expect(freighter?.isInstalled).toBe(true);
      expect(albedo?.isInstalled).toBe(true);
    });

    test('should return provider metadata', () => {
      const providers = walletService.getAvailableProviders();
      
      const freighter = providers.find(p => p.name === 'Freighter');
      
      expect(freighter?.metadata).toHaveProperty('name');
      expect(freighter?.metadata).toHaveProperty('icon');
      expect(freighter?.metadata).toHaveProperty('description');
    });
  });

  describe('Connection Flow - Freighter', () => {
    const mockPublicKey = 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

    beforeEach(() => {
      mockFreighterAPI.getPublicKey.mockResolvedValue(mockPublicKey);
    });

    test('should connect to Freighter successfully', async () => {
      const connection = await walletService.connectWallet('Freighter', 'TESTNET');
      
      expect(connection).toEqual({
        publicKey: mockPublicKey,
        provider: 'Freighter',
        network: 'TESTNET',
        connectedAt: expect.any(Number)
      });
      expect(mockFreighterAPI.getPublicKey).toHaveBeenCalled();
    });

    test('should throw error when provider not found', async () => {
      await expect(
        walletService.connectWallet('NonExistent', 'TESTNET')
      ).rejects.toThrow(WalletException);
    });

    test('should handle user rejection', async () => {
      mockFreighterAPI.getPublicKey.mockRejectedValue(
        new Error('User declined access')
      );

      await expect(
        walletService.connectWallet('Freighter', 'TESTNET')
      ).rejects.toThrow(WalletException);
    });

    test('should save session after successful connection', async () => {
      await walletService.connectWallet('Freighter', 'TESTNET');
      
      const sessionData = localStorage.getItem('socialflow_wallet_session');
      expect(sessionData).not.toBeNull();
    });
  });

  describe('Connection Flow - Albedo', () => {
    const mockPublicKey = 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

    beforeEach(() => {
      mockAlbedoAPI.publicKey.mockResolvedValue({ pubkey: mockPublicKey });
    });

    test('should connect to Albedo successfully', async () => {
      const connection = await walletService.connectWallet('Albedo', 'PUBLIC');
      
      expect(connection).toEqual({
        publicKey: mockPublicKey,
        provider: 'Albedo',
        network: 'PUBLIC',
        connectedAt: expect.any(Number)
      });
      expect(mockAlbedoAPI.publicKey).toHaveBeenCalled();
    });

    test('should handle Albedo user cancellation', async () => {
      mockAlbedoAPI.publicKey.mockRejectedValue(
        new Error('User canceled the request')
      );

      await expect(
        walletService.connectWallet('Albedo', 'TESTNET')
      ).rejects.toThrow(WalletException);
    });
  });

  describe('Disconnect Wallet', () => {
    const mockPublicKey = 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

    beforeEach(() => {
      mockFreighterAPI.getPublicKey.mockResolvedValue(mockPublicKey);
    });

    test('should disconnect wallet and clear session', async () => {
      await walletService.connectWallet('Freighter', 'TESTNET');
      expect(walletService.getActiveConnection()).not.toBeNull();
      
      await walletService.disconnectWallet();
      
      expect(walletService.getActiveConnection()).toBeNull();
      expect(localStorage.getItem('socialflow_wallet_session')).toBeNull();
    });

    test('should handle disconnect when no wallet connected', async () => {
      await expect(walletService.disconnectWallet()).resolves.not.toThrow();
    });
  });

  describe('Switch Wallet', () => {
    const mockPublicKey = 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

    beforeEach(() => {
      mockFreighterAPI.getPublicKey.mockResolvedValue(mockPublicKey);
      mockAlbedoAPI.publicKey.mockResolvedValue({ pubkey: mockPublicKey });
    });

    test('should switch from Freighter to Albedo', async () => {
      await walletService.connectWallet('Freighter', 'TESTNET');
      expect(walletService.getActiveConnection()?.provider).toBe('Freighter');
      
      await walletService.switchWallet('Albedo', 'TESTNET');
      
      expect(walletService.getActiveConnection()?.provider).toBe('Albedo');
    });
  });

  describe('Transaction Signing', () => {
    const mockPublicKey = 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
    const mockXDR = 'AAAAAQAAAAA...';
    const mockSignedXDR = 'SIGNED_AAAAAQAAAAA...';

    beforeEach(() => {
      mockFreighterAPI.getPublicKey.mockResolvedValue(mockPublicKey);
      mockFreighterAPI.signTransaction.mockResolvedValue(mockSignedXDR);
    });

    test('should sign transaction with connected wallet', async () => {
      await walletService.connectWallet('Freighter', 'TESTNET');
      
      const result = await walletService.signTransaction(mockXDR);
      
      expect(result).toEqual({
        signedXDR: mockSignedXDR,
        publicKey: mockPublicKey
      });
      expect(mockFreighterAPI.signTransaction).toHaveBeenCalledWith(
        mockXDR,
        expect.objectContaining({
          network: 'testnet'
        })
      );
    });

    test('should throw error when signing without connection', async () => {
      await expect(
        walletService.signTransaction(mockXDR)
      ).rejects.toThrow(WalletException);
    });

    test('should handle user rejection during signing', async () => {
      await walletService.connectWallet('Freighter', 'TESTNET');
      
      mockFreighterAPI.signTransaction.mockRejectedValue(
        new Error('User declined to sign')
      );

      await expect(
        walletService.signTransaction(mockXDR)
      ).rejects.toThrow(WalletException);
    });
  });

  describe('Session Persistence', () => {
    const mockPublicKey = 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

    beforeEach(() => {
      mockFreighterAPI.getPublicKey.mockResolvedValue(mockPublicKey);
    });

    test('should persist session to localStorage', async () => {
      await walletService.connectWallet('Freighter', 'TESTNET');
      
      const sessionData = localStorage.getItem('socialflow_wallet_session');
      expect(sessionData).not.toBeNull();
      
      // Decode and verify session data
      const session = JSON.parse(atob(sessionData!));
      expect(session.providerName).toBe('Freighter');
      expect(session.publicKey).toBe(mockPublicKey);
      expect(session.network).toBe('TESTNET');
    });

    test('should restore session on loadSession', async () => {
      await walletService.connectWallet('Freighter', 'TESTNET');
      const originalConnection = walletService.getActiveConnection();
      
      // Create new service instance to simulate app restart
      const newService = new WalletService();
      const restored = await newService.loadSession();
      
      expect(restored).toBe(true);
      expect(newService.getActiveConnection()?.publicKey).toBe(originalConnection?.publicKey);
      
      newService.destroy();
    });

    test('should not restore expired session', async () => {
      await walletService.connectWallet('Freighter', 'TESTNET');
      
      // Manually modify session to be expired
      const sessionData = localStorage.getItem('socialflow_wallet_session');
      const session = JSON.parse(atob(sessionData!));
      session.lastActivity = Date.now() - (31 * 60 * 1000); // 31 minutes ago
      localStorage.setItem('socialflow_wallet_session', btoa(JSON.stringify(session)));
      
      const newService = new WalletService();
      const restored = await newService.loadSession();
      
      expect(restored).toBe(false);
      expect(newService.getActiveConnection()).toBeNull();
      
      newService.destroy();
    });
  });

  describe('Session Timeout and Security', () => {
    const mockPublicKey = 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

    beforeEach(() => {
      mockFreighterAPI.getPublicKey.mockResolvedValue(mockPublicKey);
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should disconnect after 30 minutes of inactivity', async () => {
      await walletService.connectWallet('Freighter', 'TESTNET');
      expect(walletService.getActiveConnection()).not.toBeNull();
      
      // Fast-forward 30 minutes
      jest.advanceTimersByTime(30 * 60 * 1000);
      
      expect(walletService.getActiveConnection()).toBeNull();
    });

    test('should refresh session on activity', async () => {
      await walletService.connectWallet('Freighter', 'TESTNET');
      
      // Fast-forward 20 minutes
      jest.advanceTimersByTime(20 * 60 * 1000);
      
      // Perform activity (sign transaction)
      mockFreighterAPI.signTransaction.mockResolvedValue('SIGNED_XDR');
      await walletService.signTransaction('XDR');
      
      // Fast-forward another 20 minutes (total 40, but activity reset timer)
      jest.advanceTimersByTime(20 * 60 * 1000);
      
      // Should still be connected
      expect(walletService.getActiveConnection()).not.toBeNull();
    });
  });

  describe('Auth Entry Signing', () => {
    const mockPublicKey = 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
    const mockAuthEntry = 'AUTH_ENTRY_DATA';
    const mockSignature = 'SIGNATURE_DATA';

    beforeEach(() => {
      mockFreighterAPI.getPublicKey.mockResolvedValue(mockPublicKey);
      mockFreighterAPI.signAuthEntry.mockResolvedValue(mockSignature);
    });

    test('should sign auth entry with connected wallet', async () => {
      await walletService.connectWallet('Freighter', 'TESTNET');
      
      const result = await walletService.signAuthEntry(mockAuthEntry);
      
      expect(result).toEqual({
        signature: mockSignature,
        publicKey: mockPublicKey
      });
      expect(mockFreighterAPI.signAuthEntry).toHaveBeenCalled();
    });

    test('should throw error when signing auth entry without connection', async () => {
      await expect(
        walletService.signAuthEntry(mockAuthEntry)
      ).rejects.toThrow(WalletException);
    });
  });
});
