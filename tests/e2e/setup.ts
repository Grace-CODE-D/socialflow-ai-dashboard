/**
 * E2E Test Setup and Configuration
 * Provides utilities and helpers for end-to-end testing
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// Mock Stellar SDK for E2E tests
export const mockStellarSDK = {
  Server: class MockServer {
    loadAccount = async (publicKey: string) => ({
      accountId: () => publicKey,
      sequenceNumber: () => '1',
      balances: [
        { asset_type: 'native', balance: '1000.0000000' },
        { asset_type: 'credit_alphanum4', asset_code: 'USDC', balance: '500.0000000' },
      ],
    });

    submitTransaction = async (transaction: any) => ({
      hash: 'mock_transaction_hash_' + Date.now(),
      ledger: 12345,
      successful: true,
    });

    transactions = () => ({
      forAccount: () => ({
        call: async () => ({
          records: [],
        }),
      }),
    });
  },

  Keypair: {
    random: () => ({
      publicKey: () => 'GTEST' + Math.random().toString(36).substring(2, 15).toUpperCase(),
      secret: () => 'STEST' + Math.random().toString(36).substring(2, 15).toUpperCase(),
    }),
    fromSecret: (secret: string) => ({
      publicKey: () => 'GTEST_FROM_SECRET',
      secret: () => secret,
    }),
  },

  TransactionBuilder: class MockTransactionBuilder {
    constructor(public account: any, public options: any) {}
    addOperation = () => this;
    setTimeout = () => this;
    build = () => ({
      sign: () => {},
      toXDR: () => 'mock_xdr',
    });
  },

  Operation: {
    payment: (opts: any) => opts,
    createAccount: (opts: any) => opts,
    changeTrust: (opts: any) => opts,
    manageData: (opts: any) => opts,
  },

  Asset: {
    native: () => ({ code: 'XLM', issuer: null }),
    custom: (code: string, issuer: string) => ({ code, issuer }),
  },

  Networks: {
    TESTNET: 'Test SDF Network ; September 2015',
    PUBLIC: 'Public Global Stellar Network ; September 2015',
  },
};

// Mock localStorage for tests
export class MockLocalStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get length(): number {
    return this.store.size;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] || null;
  }
}

// Test data generators
export const generateMockCampaign = (overrides = {}) => ({
  id: 'campaign_' + Date.now(),
  name: 'Test Campaign',
  description: 'A test campaign for E2E testing',
  budget: 1000,
  rewardAmount: 10,
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'active',
  participants: [],
  totalDistributed: 0,
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const generateMockParticipant = (overrides = {}) => ({
  id: 'participant_' + Date.now(),
  publicKey: 'GTEST' + Math.random().toString(36).substring(2, 15).toUpperCase(),
  username: 'testuser_' + Math.random().toString(36).substring(2, 8),
  engagementScore: Math.floor(Math.random() * 100),
  rewardsClaimed: 0,
  joinedAt: new Date().toISOString(),
  ...overrides,
});

export const generateMockReward = (overrides = {}) => ({
  id: 'reward_' + Date.now(),
  campaignId: 'campaign_test',
  recipientPublicKey: 'GTEST_RECIPIENT',
  amount: 10,
  assetCode: 'SOCIAL',
  status: 'pending',
  transactionHash: null,
  createdAt: new Date().toISOString(),
  claimedAt: null,
  ...overrides,
});

// Test utilities
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const waitForCondition = async (
  condition: () => boolean,
  timeout = 5000,
  interval = 100
): Promise<void> => {
  const startTime = Date.now();
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await waitFor(interval);
  }
};

// Setup and teardown hooks
export const setupE2ETest = () => {
  let mockLocalStorage: MockLocalStorage;

  beforeAll(() => {
    // Setup global mocks
    mockLocalStorage = new MockLocalStorage();
    global.localStorage = mockLocalStorage as any;
  });

  beforeEach(() => {
    // Clear storage before each test
    mockLocalStorage.clear();
  });

  afterEach(() => {
    // Cleanup after each test
    mockLocalStorage.clear();
  });

  afterAll(() => {
    // Final cleanup
  });

  return { mockLocalStorage };
};

// Assertion helpers
export const assertCampaignValid = (campaign: any) => {
  if (!campaign.id) throw new Error('Campaign must have an id');
  if (!campaign.name) throw new Error('Campaign must have a name');
  if (typeof campaign.budget !== 'number') throw new Error('Campaign budget must be a number');
  if (typeof campaign.rewardAmount !== 'number') throw new Error('Campaign rewardAmount must be a number');
  if (!campaign.status) throw new Error('Campaign must have a status');
};

export const assertRewardValid = (reward: any) => {
  if (!reward.id) throw new Error('Reward must have an id');
  if (!reward.campaignId) throw new Error('Reward must have a campaignId');
  if (!reward.recipientPublicKey) throw new Error('Reward must have a recipientPublicKey');
  if (typeof reward.amount !== 'number') throw new Error('Reward amount must be a number');
  if (!reward.status) throw new Error('Reward must have a status');
};

export const assertTransactionSuccessful = (transaction: any) => {
  if (!transaction.hash) throw new Error('Transaction must have a hash');
  if (!transaction.successful) throw new Error('Transaction must be successful');
};
