import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock window.freighter for wallet testing
Object.defineProperty(window, 'freighter', {
  value: {
    getPublicKey: vi.fn().mockResolvedValue('GC1234567890'),
    signTransaction: vi.fn().mockResolvedValue('signed-xdr'),
    isConnected: vi.fn().mockResolvedValue(true)
  },
  writable: true
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
