import { openDB, DBSchema, IDBPDatabase } from 'idb';

export enum TransactionPriority {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
  CRITICAL = 3
}

export enum TransactionStatus {
  PENDING = 'pending',
  SIGNING = 'signing',
  PROCESSING = 'processing',
  CONFIRMED = 'confirmed',
  FAILED = 'failed'
}

export interface Transaction {
  id: string;
  type: string;
  priority: TransactionPriority;
  status: TransactionStatus;
  amount?: string;
  asset?: string;
  recipient?: string;
  memo?: string;
  estimatedFee: string;
  dependencies?: string[];
  createdAt: number;
  xdr?: string;
  error?: string;
}

interface TransactionQueueDB extends DBSchema {
  transactions: {
    key: string;
    value: Transaction;
    indexes: { 'by-status': string; 'by-priority': number };
  };
}

class TransactionQueueService {
  private db: IDBPDatabase<TransactionQueueDB> | null = null;

  async init() {
    this.db = await openDB<TransactionQueueDB>('transaction-queue', 1, {
      upgrade(db) {
        const store = db.createObjectStore('transactions', { keyPath: 'id' });
        store.createIndex('by-status', 'status');
        store.createIndex('by-priority', 'priority');
      },
    });
  }

  async addTransaction(tx: Omit<Transaction, 'id' | 'createdAt' | 'status'>): Promise<string> {
    if (!this.db) await this.init();
    
    const transaction: Transaction = {
      ...tx,
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: TransactionStatus.PENDING,
      createdAt: Date.now()
    };

    await this.db!.put('transactions', transaction);
    return transaction.id;
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    if (!this.db) await this.init();
    return this.db!.get('transactions', id);
  }

  async getAllTransactions(): Promise<Transaction[]> {
    if (!this.db) await this.init();
    return this.db!.getAll('transactions');
  }

  async getPendingTransactions(): Promise<Transaction[]> {
    if (!this.db) await this.init();
    const all = await this.db!.getAllFromIndex('transactions', 'by-status', TransactionStatus.PENDING);
    return all.sort((a, b) => b.priority - a.priority || a.createdAt - b.createdAt);
  }

  async updateTransactionStatus(id: string, status: TransactionStatus, error?: string): Promise<void> {
    if (!this.db) await this.init();
    const tx = await this.getTransaction(id);
    if (tx) {
      tx.status = status;
      if (error) tx.error = error;
      await this.db!.put('transactions', tx);
    }
  }

  async removeTransaction(id: string): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.delete('transactions', id);
  }

  async clearCompleted(): Promise<void> {
    if (!this.db) await this.init();
    const all = await this.getAllTransactions();
    const completed = all.filter(tx => 
      tx.status === TransactionStatus.CONFIRMED || tx.status === TransactionStatus.FAILED
    );
    for (const tx of completed) {
      await this.removeTransaction(tx.id);
    }
  }

  async getTotalEstimatedFees(): Promise<number> {
    const pending = await this.getPendingTransactions();
    return pending.reduce((sum, tx) => sum + parseFloat(tx.estimatedFee || '0'), 0);
  }

  async canExecuteTransaction(id: string): Promise<boolean> {
    const tx = await this.getTransaction(id);
    if (!tx || !tx.dependencies || tx.dependencies.length === 0) return true;

    for (const depId of tx.dependencies) {
      const dep = await this.getTransaction(depId);
      if (!dep || dep.status !== TransactionStatus.CONFIRMED) return false;
    }
    return true;
  }
}

export const transactionQueue = new TransactionQueueService();
