import Dexie, { Table } from 'dexie';
import { horizonPool } from './horizonConnectionPool';
import { cacheLayer } from './cacheLayer';

export interface Transaction {
  id?: number;
  hash: string;
  type: 'payment' | 'mint' | 'other';
  amount: string;
  asset: string;
  timestamp: string;
  status: 'success' | 'pending' | 'failed';
}

export class TransactionDatabase extends Dexie {
  transactions!: Table<Transaction, number>;

  constructor() {
    super('SocialFlowTransactionDB');
    this.version(1).stores({
      transactions: '++id, hash, type, amount, asset, timestamp, status'
    });
  }
}

export const db = new TransactionDatabase();

// Fetch transactions from Horizon API with caching
export async function fetchTransactionsFromHorizon(address: string, limit: number = 20): Promise<Transaction[]> {
  // Check cache first
  const cacheKey = `${address}:${limit}`;
  const cached = cacheLayer.getTxHistory(cacheKey);
  if (cached) return cached;

  try {
    const transactions = await horizonPool.execute(async (server) => {
      const txResponse = await server.transactions()
        .forAccount(address)
        .limit(limit)
        .order('desc')
        .call();

      return txResponse.records.map((tx: any) => {
        let type: 'payment' | 'mint' | 'other' = 'other';
        let amount = '0';
        let asset = 'XLM';

        return {
          hash: tx.id,
          type,
          amount,
          asset,
          timestamp: tx.created_at,
          status: tx.successful ? 'success' : 'failed' as 'success' | 'pending' | 'failed'
        };
      });
    });

    // Cache the result
    cacheLayer.setTxHistory(cacheKey, transactions);
    return transactions;
  } catch (error) {
    console.error('Error fetching transactions from Horizon:', error);
    return [];
  }
}

// Sync transactions from Horizon to IndexedDB
export async function syncTransactions(address: string): Promise<void> {
  const remoteTransactions = await fetchTransactionsFromHorizon(address);
  
  if (remoteTransactions.length > 0) {
    await db.transactions.bulkPut(remoteTransactions);
  }
}

// Get all transactions from local DB
export async function getLocalTransactions(): Promise<Transaction[]> {
  return await db.transactions.orderBy('timestamp').reverse().toArray();
}

// Add a new transaction to local DB
export async function addTransaction(transaction: Transaction): Promise<number> {
  return await db.transactions.add(transaction);
}

// Filter transactions by type
export async function filterTransactionsByType(type: 'payment' | 'mint' | 'all'): Promise<Transaction[]> {
  if (type === 'all') {
    return await getLocalTransactions();
  }
  return await db.transactions.where('type').equals(type).toArray();
}

// Clear all transactions (for testing)
export async function clearTransactions(): Promise<void> {
  await db.transactions.clear();
}

// Get Stellar Expert URL for transaction
export function getStellarExpertUrl(hash: string): string {
  return `https://stellar.expert/explorer/testnet/tx/${hash}`;
}
