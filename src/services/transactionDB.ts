// IndexedDB Schema for Transaction History
const DB_NAME = 'SocialFlowTransactions';
const DB_VERSION = 1;
const STORE_NAME = 'transactions';

export interface TransactionRecord {
  id: string; // Primary key (transaction hash)
  type: string;
  amount?: string;
  asset: string;
  timestamp: number; // Indexed
  status: 'confirmed' | 'pending' | 'failed';
  from?: string;
  to?: string;
  memo?: string;
  fee?: string;
  ledger?: number;
  operations?: any[];
  signatures?: string[];
  rawData?: any;
  syncedAt: number;
}

class TransactionDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          
          // Single indexes for efficient queries
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('asset', 'asset', { unique: false });
          store.createIndex('status', 'status', { unique: false });
          
          // Compound indexes for filtering
          store.createIndex('type_timestamp', ['type', 'timestamp'], { unique: false });
          store.createIndex('asset_timestamp', ['asset', 'timestamp'], { unique: false });
          store.createIndex('status_timestamp', ['status', 'timestamp'], { unique: false });
          store.createIndex('type_asset', ['type', 'asset'], { unique: false });
        }
      };
    });
  }

  async addTransaction(tx: TransactionRecord): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(tx);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async addTransactions(txs: TransactionRecord[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      txs.forEach(tx => store.put(tx));
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getTransaction(id: string): Promise<TransactionRecord | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllTransactions(): Promise<TransactionRecord[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getTransactionsByType(type: string): Promise<TransactionRecord[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('type');
      const request = index.getAll(type);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getTransactionsByAsset(asset: string): Promise<TransactionRecord[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('asset');
      const request = index.getAll(asset);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getTransactionsByDateRange(from: number, to: number): Promise<TransactionRecord[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('timestamp');
      const range = IDBKeyRange.bound(from, to);
      const request = index.getAll(range);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getLatestTransaction(): Promise<TransactionRecord | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev');
      
      request.onsuccess = () => {
        const cursor = request.result;
        resolve(cursor ? cursor.value : undefined);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearAll(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export const transactionDB = new TransactionDB();
