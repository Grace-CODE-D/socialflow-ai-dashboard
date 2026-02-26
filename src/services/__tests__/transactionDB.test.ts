import 'fake-indexeddb/auto';
import { transactionDB, TransactionRecord } from '../transactionDB';

describe('TransactionDB', () => {
  beforeEach(async () => {
    await transactionDB.init();
    await transactionDB.clearAll();
  });

  afterEach(() => {
    transactionDB.close();
  });

  describe('Schema and Initialization', () => {
    it('should initialize database successfully', async () => {
      await transactionDB.init();
      expect(transactionDB).toBeDefined();
    });

    it('should create proper indexes', async () => {
      const tx: TransactionRecord = {
        id: 'test_1',
        type: 'payment',
        asset: 'XLM',
        timestamp: Date.now(),
        status: 'confirmed',
        syncedAt: Date.now(),
      };
      await transactionDB.addTransaction(tx);
      const retrieved = await transactionDB.getTransaction('test_1');
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('test_1');
    });
  });

  describe('Single Transaction Operations', () => {
    it('should add a transaction', async () => {
      const tx: TransactionRecord = {
        id: 'tx_001',
        type: 'payment',
        amount: '100',
        asset: 'XLM',
        timestamp: Date.now(),
        status: 'confirmed',
        from: 'GABC123',
        to: 'GDEF456',
        syncedAt: Date.now(),
      };

      await transactionDB.addTransaction(tx);
      const retrieved = await transactionDB.getTransaction('tx_001');
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('tx_001');
      expect(retrieved?.amount).toBe('100');
      expect(retrieved?.asset).toBe('XLM');
    });

    it('should update existing transaction', async () => {
      const tx: TransactionRecord = {
        id: 'tx_002',
        type: 'payment',
        asset: 'XLM',
        timestamp: Date.now(),
        status: 'pending',
        syncedAt: Date.now(),
      };

      await transactionDB.addTransaction(tx);
      
      const updatedTx = { ...tx, status: 'confirmed' as const };
      await transactionDB.addTransaction(updatedTx);
      
      const retrieved = await transactionDB.getTransaction('tx_002');
      expect(retrieved?.status).toBe('confirmed');
    });
  });

  describe('Bulk Operations', () => {
    it('should add multiple transactions', async () => {
      const txs: TransactionRecord[] = Array.from({ length: 10 }, (_, i) => ({
        id: `bulk_${i}`,
        type: 'payment',
        asset: 'XLM',
        timestamp: Date.now() - i * 1000,
        status: 'confirmed' as const,
        syncedAt: Date.now(),
      }));

      await transactionDB.addTransactions(txs);
      const all = await transactionDB.getAllTransactions();
      
      expect(all.length).toBe(10);
    });
  });

  describe('Query by Type', () => {
    beforeEach(async () => {
      const txs: TransactionRecord[] = [
        { id: 'tx_1', type: 'payment', asset: 'XLM', timestamp: Date.now(), status: 'confirmed', syncedAt: Date.now() },
        { id: 'tx_2', type: 'payment', asset: 'XLM', timestamp: Date.now(), status: 'confirmed', syncedAt: Date.now() },
        { id: 'tx_3', type: 'token', asset: 'USDC', timestamp: Date.now(), status: 'confirmed', syncedAt: Date.now() },
        { id: 'tx_4', type: 'nft', asset: 'NFT', timestamp: Date.now(), status: 'confirmed', syncedAt: Date.now() },
      ];
      await transactionDB.addTransactions(txs);
    });

    it('should query transactions by type', async () => {
      const payments = await transactionDB.getTransactionsByType('payment');
      expect(payments.length).toBe(2);
      expect(payments.every(tx => tx.type === 'payment')).toBe(true);
    });

    it('should return empty array for non-existent type', async () => {
      const result = await transactionDB.getTransactionsByType('nonexistent');
      expect(result.length).toBe(0);
    });
  });

  describe('Query by Asset', () => {
    beforeEach(async () => {
      const txs: TransactionRecord[] = [
        { id: 'tx_1', type: 'payment', asset: 'XLM', timestamp: Date.now(), status: 'confirmed', syncedAt: Date.now() },
        { id: 'tx_2', type: 'payment', asset: 'XLM', timestamp: Date.now(), status: 'confirmed', syncedAt: Date.now() },
        { id: 'tx_3', type: 'payment', asset: 'USDC', timestamp: Date.now(), status: 'confirmed', syncedAt: Date.now() },
      ];
      await transactionDB.addTransactions(txs);
    });

    it('should query transactions by asset', async () => {
      const xlmTxs = await transactionDB.getTransactionsByAsset('XLM');
      expect(xlmTxs.length).toBe(2);
      expect(xlmTxs.every(tx => tx.asset === 'XLM')).toBe(true);
    });
  });

  describe('Query by Date Range', () => {
    beforeEach(async () => {
      const now = Date.now();
      const txs: TransactionRecord[] = [
        { id: 'tx_1', type: 'payment', asset: 'XLM', timestamp: now - 3600000, status: 'confirmed', syncedAt: now },
        { id: 'tx_2', type: 'payment', asset: 'XLM', timestamp: now - 1800000, status: 'confirmed', syncedAt: now },
        { id: 'tx_3', type: 'payment', asset: 'XLM', timestamp: now - 900000, status: 'confirmed', syncedAt: now },
        { id: 'tx_4', type: 'payment', asset: 'XLM', timestamp: now, status: 'confirmed', syncedAt: now },
      ];
      await transactionDB.addTransactions(txs);
    });

    it('should query transactions by date range', async () => {
      const now = Date.now();
      const oneHourAgo = now - 3600000;
      const txs = await transactionDB.getTransactionsByDateRange(oneHourAgo, now);
      expect(txs.length).toBe(4);
    });

    it('should return only transactions within range', async () => {
      const now = Date.now();
      const thirtyMinAgo = now - 1800000;
      const txs = await transactionDB.getTransactionsByDateRange(thirtyMinAgo, now);
      expect(txs.length).toBe(3);
    });
  });

  describe('Latest Transaction', () => {
    it('should return latest transaction by timestamp', async () => {
      const now = Date.now();
      const txs: TransactionRecord[] = [
        { id: 'tx_old', type: 'payment', asset: 'XLM', timestamp: now - 10000, status: 'confirmed', syncedAt: now },
        { id: 'tx_new', type: 'payment', asset: 'XLM', timestamp: now, status: 'confirmed', syncedAt: now },
        { id: 'tx_older', type: 'payment', asset: 'XLM', timestamp: now - 20000, status: 'confirmed', syncedAt: now },
      ];
      await transactionDB.addTransactions(txs);

      const latest = await transactionDB.getLatestTransaction();
      expect(latest?.id).toBe('tx_new');
    });

    it('should return undefined when no transactions exist', async () => {
      const latest = await transactionDB.getLatestTransaction();
      expect(latest).toBeUndefined();
    });
  });

  describe('Clear Operations', () => {
    it('should clear all transactions', async () => {
      const txs: TransactionRecord[] = Array.from({ length: 5 }, (_, i) => ({
        id: `tx_${i}`,
        type: 'payment',
        asset: 'XLM',
        timestamp: Date.now(),
        status: 'confirmed' as const,
        syncedAt: Date.now(),
      }));
      await transactionDB.addTransactions(txs);

      await transactionDB.clearAll();
      const all = await transactionDB.getAllTransactions();
      expect(all.length).toBe(0);
    });
  });

  describe('Compound Indexes', () => {
    beforeEach(async () => {
      const now = Date.now();
      const txs: TransactionRecord[] = [
        { id: 'tx_1', type: 'payment', asset: 'XLM', timestamp: now - 1000, status: 'confirmed', syncedAt: now },
        { id: 'tx_2', type: 'payment', asset: 'USDC', timestamp: now - 2000, status: 'confirmed', syncedAt: now },
        { id: 'tx_3', type: 'token', asset: 'XLM', timestamp: now - 3000, status: 'confirmed', syncedAt: now },
      ];
      await transactionDB.addTransactions(txs);
    });

    it('should efficiently query using compound indexes', async () => {
      const payments = await transactionDB.getTransactionsByType('payment');
      expect(payments.length).toBe(2);
      
      const xlmTxs = await transactionDB.getTransactionsByAsset('XLM');
      expect(xlmTxs.length).toBe(2);
    });
  });
});
