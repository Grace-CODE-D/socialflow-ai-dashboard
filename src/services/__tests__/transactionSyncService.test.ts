import 'fake-indexeddb/auto';
import { Server } from '@stellar/stellar-sdk';
import { transactionSyncService, SyncStatus } from '../transactionSyncService';
import { transactionDB } from '../transactionDB';

// Mock Stellar SDK
jest.mock('@stellar/stellar-sdk');

describe('TransactionSyncService', () => {
  const mockAccountId = 'GABC123DEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFGHIJK';
  
  beforeEach(async () => {
    await transactionDB.init();
    await transactionDB.clearAll();
    jest.clearAllMocks();
  });

  afterEach(() => {
    transactionDB.close();
  });

  describe('Sync State Management', () => {
    it('should initialize with IDLE status', () => {
      const state = transactionSyncService.getSyncState();
      expect(state.status).toBe(SyncStatus.IDLE);
      expect(state.totalSynced).toBe(0);
    });

    it('should notify listeners on state change', (done) => {
      const unsubscribe = transactionSyncService.onSyncStateChange((state) => {
        if (state.status === SyncStatus.SYNCING) {
          unsubscribe();
          done();
        }
      });

      // Trigger a sync to change state
      transactionSyncService.initialSync(mockAccountId).catch(() => {});
    });

    it('should allow multiple listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      const unsub1 = transactionSyncService.onSyncStateChange(listener1);
      const unsub2 = transactionSyncService.onSyncStateChange(listener2);

      transactionSyncService.initialSync(mockAccountId).catch(() => {});

      setTimeout(() => {
        expect(listener1).toHaveBeenCalled();
        expect(listener2).toHaveBeenCalled();
        unsub1();
        unsub2();
      }, 100);
    });
  });

  describe('Initial Sync', () => {
    it('should update status to SYNCING during sync', async () => {
      const mockTransactions = {
        records: Array.from({ length: 10 }, (_, i) => ({
          id: `tx_${i}`,
          created_at: new Date().toISOString(),
          successful: true,
          source_account: mockAccountId,
          fee_charged: '100',
          operation_count: 1,
          signatures: [],
        })),
      };

      const mockCall = jest.fn().mockResolvedValue(mockTransactions);
      const mockLimit = jest.fn().mockReturnValue({ call: mockCall });
      const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockForAccount = jest.fn().mockReturnValue({ order: mockOrder });
      const mockTransactionsMethod = jest.fn().mockReturnValue({ forAccount: mockForAccount });

      (Server as jest.Mock).mockImplementation(() => ({
        transactions: mockTransactionsMethod,
      }));

      let syncingDetected = false;
      const unsubscribe = transactionSyncService.onSyncStateChange((state) => {
        if (state.status === SyncStatus.SYNCING) {
          syncingDetected = true;
        }
      });

      await transactionSyncService.initialSync(mockAccountId);
      
      expect(syncingDetected).toBe(true);
      unsubscribe();
    });

    it('should fetch last 100 transactions', async () => {
      const mockTransactions = {
        records: Array.from({ length: 100 }, (_, i) => ({
          id: `tx_${i}`,
          created_at: new Date().toISOString(),
          successful: true,
          source_account: mockAccountId,
          fee_charged: '100',
          operation_count: 1,
          signatures: [],
        })),
      };

      const mockCall = jest.fn().mockResolvedValue(mockTransactions);
      const mockLimit = jest.fn().mockReturnValue({ call: mockCall });
      const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockForAccount = jest.fn().mockReturnValue({ order: mockOrder });
      const mockTransactionsMethod = jest.fn().mockReturnValue({ forAccount: mockForAccount });

      (Server as jest.Mock).mockImplementation(() => ({
        transactions: mockTransactionsMethod,
      }));

      await transactionSyncService.initialSync(mockAccountId);

      expect(mockLimit).toHaveBeenCalledWith(100);
      
      const allTxs = await transactionDB.getAllTransactions();
      expect(allTxs.length).toBe(100);
    });

    it('should update status to SUCCESS after successful sync', async () => {
      const mockTransactions = {
        records: [],
      };

      const mockCall = jest.fn().mockResolvedValue(mockTransactions);
      const mockLimit = jest.fn().mockReturnValue({ call: mockCall });
      const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockForAccount = jest.fn().mockReturnValue({ order: mockOrder });
      const mockTransactionsMethod = jest.fn().mockReturnValue({ forAccount: mockForAccount });

      (Server as jest.Mock).mockImplementation(() => ({
        transactions: mockTransactionsMethod,
      }));

      await transactionSyncService.initialSync(mockAccountId);

      const state = transactionSyncService.getSyncState();
      expect(state.status).toBe(SyncStatus.SUCCESS);
      expect(state.lastSyncTime).toBeDefined();
    });

    it('should update status to ERROR on failure', async () => {
      const mockCall = jest.fn().mockRejectedValue(new Error('Network error'));
      const mockLimit = jest.fn().mockReturnValue({ call: mockCall });
      const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockForAccount = jest.fn().mockReturnValue({ order: mockOrder });
      const mockTransactionsMethod = jest.fn().mockReturnValue({ forAccount: mockForAccount });

      (Server as jest.Mock).mockImplementation(() => ({
        transactions: mockTransactionsMethod,
      }));

      await expect(transactionSyncService.initialSync(mockAccountId)).rejects.toThrow();

      const state = transactionSyncService.getSyncState();
      expect(state.status).toBe(SyncStatus.ERROR);
      expect(state.error).toBe('Network error');
    });
  });

  describe('Incremental Sync', () => {
    it('should use cursor from latest transaction', async () => {
      // Add existing transaction
      await transactionDB.addTransaction({
        id: 'existing_tx',
        type: 'payment',
        asset: 'XLM',
        timestamp: Date.now() - 10000,
        status: 'confirmed',
        syncedAt: Date.now(),
      });

      const mockTransactions = {
        records: [],
      };

      const mockCall = jest.fn().mockResolvedValue(mockTransactions);
      const mockCursor = jest.fn().mockReturnValue({ call: mockCall });
      const mockLimit = jest.fn().mockReturnValue({ cursor: mockCursor });
      const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockForAccount = jest.fn().mockReturnValue({ order: mockOrder });
      const mockTransactionsMethod = jest.fn().mockReturnValue({ forAccount: mockForAccount });

      (Server as jest.Mock).mockImplementation(() => ({
        transactions: mockTransactionsMethod,
      }));

      await transactionSyncService.incrementalSync(mockAccountId);

      expect(mockCursor).toHaveBeenCalledWith('existing_tx');
    });

    it('should only fetch new transactions', async () => {
      const mockTransactions = {
        records: Array.from({ length: 5 }, (_, i) => ({
          id: `new_tx_${i}`,
          created_at: new Date().toISOString(),
          successful: true,
          source_account: mockAccountId,
          fee_charged: '100',
          operation_count: 1,
          signatures: [],
        })),
      };

      const mockCall = jest.fn().mockResolvedValue(mockTransactions);
      const mockLimit = jest.fn().mockReturnValue({ call: mockCall });
      const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockForAccount = jest.fn().mockReturnValue({ order: mockOrder });
      const mockTransactionsMethod = jest.fn().mockReturnValue({ forAccount: mockForAccount });

      (Server as jest.Mock).mockImplementation(() => ({
        transactions: mockTransactionsMethod,
      }));

      await transactionSyncService.incrementalSync(mockAccountId);

      expect(mockLimit).toHaveBeenCalledWith(50);
    });
  });

  describe('Wallet Connect Sync', () => {
    it('should perform initial sync if no transactions exist', async () => {
      const mockTransactions = {
        records: Array.from({ length: 10 }, (_, i) => ({
          id: `tx_${i}`,
          created_at: new Date().toISOString(),
          successful: true,
          source_account: mockAccountId,
          fee_charged: '100',
          operation_count: 1,
          signatures: [],
        })),
      };

      const mockCall = jest.fn().mockResolvedValue(mockTransactions);
      const mockLimit = jest.fn().mockReturnValue({ call: mockCall });
      const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockForAccount = jest.fn().mockReturnValue({ order: mockOrder });
      const mockTransactionsMethod = jest.fn().mockReturnValue({ forAccount: mockForAccount });

      (Server as jest.Mock).mockImplementation(() => ({
        transactions: mockTransactionsMethod,
      }));

      await transactionSyncService.syncOnWalletConnect(mockAccountId);

      const allTxs = await transactionDB.getAllTransactions();
      expect(allTxs.length).toBe(10);
    });

    it('should perform incremental sync if transactions exist', async () => {
      // Add existing transaction
      await transactionDB.addTransaction({
        id: 'existing_tx',
        type: 'payment',
        asset: 'XLM',
        timestamp: Date.now(),
        status: 'confirmed',
        syncedAt: Date.now(),
      });

      const mockTransactions = {
        records: [],
      };

      const mockCall = jest.fn().mockResolvedValue(mockTransactions);
      const mockCursor = jest.fn().mockReturnValue({ call: mockCall });
      const mockLimit = jest.fn().mockReturnValue({ cursor: mockCursor });
      const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockForAccount = jest.fn().mockReturnValue({ order: mockOrder });
      const mockTransactionsMethod = jest.fn().mockReturnValue({ forAccount: mockForAccount });

      (Server as jest.Mock).mockImplementation(() => ({
        transactions: mockTransactionsMethod,
      }));

      await transactionSyncService.syncOnWalletConnect(mockAccountId);

      expect(mockCursor).toHaveBeenCalled();
    });
  });

  describe('Auto Sync', () => {
    jest.useFakeTimers();

    it('should start auto sync with interval', async () => {
      const mockTransactions = {
        records: [],
      };

      const mockCall = jest.fn().mockResolvedValue(mockTransactions);
      const mockLimit = jest.fn().mockReturnValue({ call: mockCall });
      const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockForAccount = jest.fn().mockReturnValue({ order: mockOrder });
      const mockTransactionsMethod = jest.fn().mockReturnValue({ forAccount: mockForAccount });

      (Server as jest.Mock).mockImplementation(() => ({
        transactions: mockTransactionsMethod,
      }));

      const stopAutoSync = await transactionSyncService.startAutoSync(mockAccountId, 1000);

      jest.advanceTimersByTime(3000);

      await new Promise(resolve => setTimeout(resolve, 100));

      stopAutoSync();

      expect(mockCall.mock.calls.length).toBeGreaterThan(0);
    });

    it('should stop auto sync when stop function is called', async () => {
      const mockTransactions = {
        records: [],
      };

      const mockCall = jest.fn().mockResolvedValue(mockTransactions);
      const mockLimit = jest.fn().mockReturnValue({ call: mockCall });
      const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockForAccount = jest.fn().mockReturnValue({ order: mockOrder });
      const mockTransactionsMethod = jest.fn().mockReturnValue({ forAccount: mockForAccount });

      (Server as jest.Mock).mockImplementation(() => ({
        transactions: mockTransactionsMethod,
      }));

      const stopAutoSync = await transactionSyncService.startAutoSync(mockAccountId, 1000);
      
      jest.advanceTimersByTime(1000);
      const callCountBefore = mockCall.mock.calls.length;
      
      stopAutoSync();
      
      jest.advanceTimersByTime(5000);
      const callCountAfter = mockCall.mock.calls.length;

      expect(callCountAfter).toBe(callCountBefore);
    });
  });
});
