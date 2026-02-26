import { describe, it, expect, vi, beforeEach } from 'vitest';
import { stellarService } from '../StellarService';
import { TESTNET_CONFIG } from '../../config/networks';
import { Asset } from '@stellar/stellar-sdk';

// Mock Stellar SDK Server
vi.mock('@stellar/stellar-sdk', async () => {
  const actual = await vi.importActual('@stellar/stellar-sdk');
  return {
    ...actual,
    Server: vi.fn().mockImplementation(() => ({
      root: vi.fn().mockResolvedValue({ core_version: '1.0.0' }),
      loadAccount: vi.fn(),
      submitTransaction: vi.fn(),
      transactions: vi.fn().mockReturnValue({
        forAccount: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              call: vi.fn().mockResolvedValue({ records: [] })
            })
          })
        })
      })
    }))
  };
});

describe('StellarService', () => {
  const mockAccount = {
    accountId: () => 'GTEST',
    sequenceNumber: () => '123',
    incrementSequenceNumber: () => undefined,
  } as any;

  beforeEach(() => {
    stellarService.setNetwork(TESTNET_CONFIG);
  });

  test('should set and get network configuration', () => {
    expect(stellarService.getNetwork()).toEqual(TESTNET_CONFIG);
  });

  test('should fetch network status via mocked server', async () => {
    const service = stellarService as any;
    service.servers = [
      {
        fetchBaseFee: async () => 100,
      },
    ];

    const status = await stellarService.getNetworkStatus();
    expect(status).toBe(true);
  });

  test('should validate asset and parse asset string', () => {
    const validAsset = {
      code: 'USDC',
      issuer: 'GDUKMGUGDZQK6YH2U5U5U5U5U5U5U5U5U5U5U5U5U5U5U5U5U5U5U5U5U5U5U5U5',
    };
    const invalidAsset = { code: 'INVALID_ASSET_CODE', issuer: 'INVALID_ISSUER' };

    expect(stellarService.validateAsset(validAsset)).toBe(true);
    expect(stellarService.validateAsset(invalidAsset)).toBe(false);

    const parsed = stellarService.parseAsset(
      'USD:GDUKMGUGDZQK6YH2U5U5U5U5U5U5U5U5U5U5U5U5U5U5U5U5U5U5U5U5U5U5U5U5'
    );
    expect(parsed.code).toBe('USD');
  });

  test('should format balances with trimmed decimals', () => {
    expect(stellarService.formatBalance('123.4500000')).toBe('123.45');
    expect(stellarService.formatBalance('10.0000000')).toBe('10');
  });

  test('should build a payment transaction with memo', async () => {
    const service = stellarService as any;
    service.getAccount = async () => mockAccount;

    const tx = await stellarService.buildPayment({
      sourcePublicKey: 'GTEST',
      destination: 'GDEST',
      amount: '1.5',
      asset: Asset.native(),
      memo: { type: 'text', value: 'hello' },
    });

    expect(tx.operations.length).toBe(1);
  });

  test('should estimate fee based on operation count', async () => {
    const service = stellarService as any;
    service.getCurrentBaseFee = async () => 100;
    const estimate = await stellarService.estimateFee({ operations: [{}, {}] } as any);
    expect(estimate.estimatedFee).toBe(200);
  });

  test('should retry submitTransaction', async () => {
    const service = stellarService as any;
    let attempts = 0;
    service.getServer = () => ({
      submitTransaction: async () => {
        attempts += 1;
        if (attempts < 3) throw new Error('fail');
        return {
          hash: 'abc',
          ledger: 1,
          created_at: new Date().toISOString(),
          successful: true,
          result_xdr: 'xdr',
          fee_charged: '100',
        };
      },
    });

    const tx = { operations: [] } as any;
    const result = await stellarService.submitTransaction(tx);
    expect(result.hash).toBe('abc');
  });

  test('should stream transactions and return cleanup', () => {
    const service = stellarService as any;
    service.getServer = () => ({
      transactions: () => ({
        forAccount: () => ({
          cursor: () => ({
            stream: ({ onmessage }: any) => {
              onmessage({ hash: 'tx' });
              return { close: () => undefined };
            },
          }),
        }),
      }),
    });

    const cleanup = stellarService.streamTransactions('GTEST', () => undefined);
    expect(typeof cleanup).toBe('function');
    cleanup();
  });
});
