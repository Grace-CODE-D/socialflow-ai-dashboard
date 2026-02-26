import { render, RenderOptions } from '@testing-library/react';
import React, { ReactElement } from 'react';

// Mock Stellar SDK
export const mockStellarSDK = {
  Server: jest.fn(),
  Keypair: {
    random: jest.fn(() => ({
      publicKey: () => 'GTEST123456789',
      secret: () => 'STEST123456789'
    }))
  },
  Asset: {
    native: jest.fn()
  },
  Operation: {
    payment: jest.fn()
  },
  TransactionBuilder: jest.fn()
};

// Mock wallet connection
export const mockWalletConnection = {
  publicKey: 'GTEST123456789',
  isConnected: true,
  network: 'testnet'
};

// Mock IPFS response
export const mockIPFSResponse = {
  cid: 'QmTest123456789',
  url: 'https://ipfs.io/ipfs/QmTest123456789'
};

// Custom render with providers
export const renderWithProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return render(ui, { ...options });
};

// Wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Mock transaction hash
export const mockTxHash = 'abc123def456ghi789';

// Mock NFT metadata
export const mockNFTMetadata = {
  name: 'Test NFT',
  description: 'Test Description',
  image: 'https://example.com/image.png',
  attributes: [
    { trait_type: 'Rarity', value: 'Common' }
  ]
};

// Mock campaign data
export const mockCampaign = {
  id: 'campaign_123',
  name: 'Test Campaign',
  budget: '1000',
  spent: '250',
  active: true
};

export * from '@testing-library/react';
