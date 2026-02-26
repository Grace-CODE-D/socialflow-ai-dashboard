import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface QueuedTransaction {
  id: string;
  type: 'payment' | 'token_transfer' | 'nft_mint' | 'analytics' | 'identity_update';
  payload: any;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'processing' | 'failed';
  error?: string;
}

interface OfflineQueueDB extends DBSchema {
  transactions: {
    key: string;
    value: QueuedTransaction;
    indexes: { 'by-status': string; 'by-timestamp': number };
  };
}

class OfflineQueueService {
  private db: IDBPDatabase<OfflineQueueDB> | null = null;
  private readonly DB_NAME = 'socialflow-offline-queue';
  private readonly DB_VERSION = 1;
  private readonly MAX_RETRIES = 3;
  private isOnline: boolean = navigator.onLine;
  private processingQueue: boolean = false;

  async init(): Promise<void> {
    this.db = await openDB<OfflineQueueDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore('transactions', { keyPath: 'id' });
        store.createIndex('by-status', 'status');
        store.createIndex('by-timestamp', 'timestamp');
      },
    });

    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  private handleOnline(): void {
    this.isOnline = true;
    this.processQueue();
  }

  private handleOffline(): void {
    this.isOnline = false;
  }

  async enqueue(type: QueuedTransaction['type'], payload: any): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction: QueuedTransaction = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
    };

    await this.db.add('transactions', transaction);
    
    if (this.isOnline) {
      this.processQueue();
    }

    return transaction.id;
  }

  async processQueue(): Promise<void> {
    if (!this.db || this.processingQueue || !this.isOnline) return;

    this.processingQueue = true;

    try {
      const pending = await this.db.getAllFromIndex('transactions', 'by-status', 'pending');
      
      for (const transaction of pending) {
        await this.processTransaction(transaction);
      }
    } finally {
      this.processingQueue = false;
    }
  }

  private async processTransaction(transaction: QueuedTransaction): Promise<void> {
    if (!this.db) return;

    try {
      await this.db.put('transactions', { ...transaction, status: 'processing' });

      // Process based on type
      await this.executeTransaction(transaction);

      // Remove on success
      await this.db.delete('transactions', transaction.id);
    } catch (error) {
      const retryCount = transaction.retryCount + 1;
      
      if (retryCount >= this.MAX_RETRIES) {
        await this.db.put('transactions', {
          ...transaction,
          status: 'failed',
          retryCount,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      } else {
        await this.db.put('transactions', {
          ...transaction,
          status: 'pending',
          retryCount,
        });
      }
    }
  }

  private async executeTransaction(transaction: QueuedTransaction): Promise<void> {
    // Placeholder - will be implemented with actual blockchain logic
    switch (transaction.type) {
      case 'payment':
        // await stellarService.sendPayment(transaction.payload);
        break;
      case 'token_transfer':
        // await stellarService.transferToken(transaction.payload);
        break;
      case 'nft_mint':
        // await nftService.mintNFT(transaction.payload);
        break;
      case 'analytics':
        // await analyticsService.storeOnChain(transaction.payload);
        break;
      case 'identity_update':
        // await identityService.updateIdentity(transaction.payload);
        break;
    }
  }

  async getPendingCount(): Promise<number> {
    if (!this.db) return 0;
    return (await this.db.getAllFromIndex('transactions', 'by-status', 'pending')).length;
  }

  async getFailedTransactions(): Promise<QueuedTransaction[]> {
    if (!this.db) return [];
    return this.db.getAllFromIndex('transactions', 'by-status', 'failed');
  }

  async retryFailed(id: string): Promise<void> {
    if (!this.db) return;
    
    const transaction = await this.db.get('transactions', id);
    if (transaction && transaction.status === 'failed') {
      await this.db.put('transactions', {
        ...transaction,
        status: 'pending',
        retryCount: 0,
        error: undefined,
      });
      
      if (this.isOnline) {
        this.processQueue();
      }
    }
  }

  getOnlineStatus(): boolean {
    return this.isOnline;
  }
}

export const offlineQueue = new OfflineQueueService();
