// @jest-environment node

const mockGetAccount = vi.fn();
const mockPrepareTransaction = vi.fn();
const mockSendTransaction = vi.fn();

vi.mock('@stellar/stellar-sdk', () => {
  const TransactionBuilder = vi.fn().mockImplementation(() => ({
    addOperation: vi.fn().mockReturnThis(),
    setTimeout: vi.fn().mockReturnThis(),
    build: vi.fn().mockReturnValue({ toXDR: vi.fn().mockReturnValue('unsigned-xdr') }),
  }));
  (TransactionBuilder as any).fromXDR = vi.fn().mockReturnValue({ type: 'signedTx' });

  return {
    SorobanRpc: {
      Server: vi.fn().mockImplementation(() => ({
        getAccount: mockGetAccount,
        prepareTransaction: mockPrepareTransaction,
        sendTransaction: mockSendTransaction,
      })),
      Api: {
        GetTransactionStatus: { SUCCESS: 'SUCCESS', FAILED: 'FAILED' },
      },
    },
    Contract: vi.fn().mockImplementation(() => ({
      call: vi.fn().mockReturnValue({ type: 'op' }),
    })),
    TransactionBuilder,
    BASE_FEE: '100',
  };
});

import { SmartContractInvoker } from '../SmartContractInvoker';
import { SorobanRpc } from '@stellar/stellar-sdk';
import { ContractCallType, ContractInvocationParams, SorobanConfig } from '../../types/soroban';

const config: SorobanConfig = { rpcUrl: 'https://soroban-testnet.stellar.org', networkPassphrase: 'Test SDF Network ; September 2015' };
const serverInstance = new (SorobanRpc.Server as any)('url');

const baseParams: ContractInvocationParams = { contractId: 'CTEST', method: 'transfer', args: [] };

afterEach(() => vi.clearAllMocks());

describe('SmartContractInvoker', () => {
  describe('constructor', () => {
    it('creates an instance', () => {
      const invoker = new SmartContractInvoker(serverInstance, config.networkPassphrase, config);
      expect(invoker).toBeInstanceOf(SmartContractInvoker);
    });
  });

  describe('invoke — READ_ONLY', () => {
    it('returns simulation result for read-only call', async () => {
      const simResult = { success: true, result: 'val', events: [] };
      const simulate = vi.fn().mockResolvedValue(simResult);
      const invoker = new SmartContractInvoker(serverInstance, config.networkPassphrase, config);
      const result = await invoker.invoke(baseParams, 'GSRC', ContractCallType.READ_ONLY, undefined, simulate);
      expect(result.success).toBe(true);
      expect(result.result).toBe('val');
    });

    it('returns failure when simulation fails', async () => {
      const simulate = vi.fn().mockResolvedValue({ success: false, error: 'gas exceeded' });
      const invoker = new SmartContractInvoker(serverInstance, config.networkPassphrase, config);
      const result = await invoker.invoke(baseParams, 'GSRC', ContractCallType.READ_ONLY, undefined, simulate);
      expect(result.success).toBe(false);
      expect(result.errorType).toBe('SIMULATION_FAILED');
    });

    it('returns error when simulate function is not provided', async () => {
      const invoker = new SmartContractInvoker(serverInstance, config.networkPassphrase, config);
      const result = await invoker.invoke(baseParams, 'GSRC', ContractCallType.READ_ONLY);
      expect(result.success).toBe(false);
      expect(result.errorType).toBe('SIMULATION_FAILED');
    });
  });

  describe('invoke — STATE_CHANGING', () => {
    it('returns error when signTransaction is missing', async () => {
      const simulate = vi.fn().mockResolvedValue({ success: true });
      const invoker = new SmartContractInvoker(serverInstance, config.networkPassphrase, config);
      const result = await invoker.invoke(baseParams, 'GSRC', ContractCallType.STATE_CHANGING, undefined, simulate);
      expect(result.success).toBe(false);
      expect(result.error).toContain('ERR_AUTH_REQUIRED');
    });

    it('submits transaction and returns poll result on success', async () => {
      const simulate = vi.fn().mockResolvedValue({ success: true });
      const signTx = vi.fn().mockResolvedValue('signed-xdr');
      const pollResult = { success: true, transactionHash: 'abc123' };
      const poll = vi.fn().mockResolvedValue(pollResult);
      mockGetAccount.mockResolvedValueOnce({ id: 'GSRC', sequenceNumber: () => '1' });
      const prepTx = { toXDR: vi.fn().mockReturnValue('prep-xdr') };
      mockPrepareTransaction.mockResolvedValueOnce(prepTx);
      mockSendTransaction.mockResolvedValueOnce({ status: 'PENDING', hash: 'abc123' });

      const invoker = new SmartContractInvoker(serverInstance, config.networkPassphrase, config);
      const result = await invoker.invoke(baseParams, 'GSRC', ContractCallType.STATE_CHANGING, signTx, simulate, poll);
      expect(result.success).toBe(true);
      expect(result.transactionHash).toBe('abc123');
    });

    it('returns TRANSACTION_FAILED when server returns ERROR status', async () => {
      const simulate = vi.fn().mockResolvedValue({ success: true });
      const signTx = vi.fn().mockResolvedValue('signed-xdr');
      const poll = vi.fn();
      mockGetAccount.mockResolvedValueOnce({ id: 'GSRC' });
      const prepTx = { toXDR: vi.fn().mockReturnValue('prep-xdr') };
      mockPrepareTransaction.mockResolvedValueOnce(prepTx);
      mockSendTransaction.mockResolvedValueOnce({ status: 'ERROR', errorResult: { toXDR: vi.fn().mockReturnValue('err-xdr') } });

      const invoker = new SmartContractInvoker(serverInstance, config.networkPassphrase, config);
      const result = await invoker.invoke(baseParams, 'GSRC', ContractCallType.STATE_CHANGING, signTx, simulate, poll);
      expect(result.success).toBe(false);
      expect(result.errorType).toBe('TRANSACTION_FAILED');
    });

    it('proceeds to poll transaction status for PENDING responses', async () => {
      const simulate = vi.fn().mockResolvedValue({ success: true });
      const signTx = vi.fn().mockResolvedValue('signed-xdr');
      const pollResult = { success: true, transactionHash: 'pending-hash' };
      const poll = vi.fn().mockResolvedValue(pollResult);
      mockGetAccount.mockResolvedValueOnce({ id: 'GSRC' });
      const prepTx = { toXDR: vi.fn().mockReturnValue('prep-xdr') };
      mockPrepareTransaction.mockResolvedValueOnce(prepTx);
      mockSendTransaction.mockResolvedValueOnce({ status: 'PENDING', hash: 'pending-hash' });

      const invoker = new SmartContractInvoker(serverInstance, config.networkPassphrase, config);
      const result = await invoker.invoke(baseParams, 'GSRC', ContractCallType.STATE_CHANGING, signTx, simulate, poll);
      expect(poll).toHaveBeenCalledWith('pending-hash');
      expect(result).toEqual(pollResult);
    });

    it('returns a distinct retryable error for DUPLICATE without polling', async () => {
      const simulate = vi.fn().mockResolvedValue({ success: true });
      const signTx = vi.fn().mockResolvedValue('signed-xdr');
      const poll = vi.fn();
      mockGetAccount.mockResolvedValueOnce({ id: 'GSRC' });
      const prepTx = { toXDR: vi.fn().mockReturnValue('prep-xdr') };
      mockPrepareTransaction.mockResolvedValueOnce(prepTx);
      mockSendTransaction.mockResolvedValueOnce({ status: 'DUPLICATE', hash: 'dup-hash' });

      const invoker = new SmartContractInvoker(serverInstance, config.networkPassphrase, config);
      const result = await invoker.invoke(baseParams, 'GSRC', ContractCallType.STATE_CHANGING, signTx, simulate, poll);
      expect(result.success).toBe(false);
      expect(result.errorType).toBe('DUPLICATE_TRANSACTION');
      expect(poll).not.toHaveBeenCalled();
    });

    it('returns a distinct retryable error for TRY_AGAIN_LATER without polling', async () => {
      const simulate = vi.fn().mockResolvedValue({ success: true });
      const signTx = vi.fn().mockResolvedValue('signed-xdr');
      const poll = vi.fn();
      mockGetAccount.mockResolvedValueOnce({ id: 'GSRC' });
      const prepTx = { toXDR: vi.fn().mockReturnValue('prep-xdr') };
      mockPrepareTransaction.mockResolvedValueOnce(prepTx);
      mockSendTransaction.mockResolvedValueOnce({ status: 'TRY_AGAIN_LATER', hash: 'retry-hash' });

      const invoker = new SmartContractInvoker(serverInstance, config.networkPassphrase, config);
      const result = await invoker.invoke(baseParams, 'GSRC', ContractCallType.STATE_CHANGING, signTx, simulate, poll);
      expect(result.success).toBe(false);
      expect(result.errorType).toBe('TRY_AGAIN_LATER');
      expect(poll).not.toHaveBeenCalled();
    });

    it('returns OUT_OF_GAS error type for out-of-gas exceptions', async () => {
      const simulate = vi.fn().mockResolvedValue({ success: true });
      const signTx = vi.fn().mockResolvedValue('signed-xdr');
      const poll = vi.fn();
      mockGetAccount.mockResolvedValueOnce({ id: 'GSRC' });
      mockPrepareTransaction.mockRejectedValueOnce(new Error('out of gas: insufficient budget'));

      const invoker = new SmartContractInvoker(serverInstance, config.networkPassphrase, config);
      const result = await invoker.invoke(baseParams, 'GSRC', ContractCallType.STATE_CHANGING, signTx, simulate, poll);
      expect(result.success).toBe(false);
      expect(result.errorType).toBe('OUT_OF_GAS');
    });
  });
});
