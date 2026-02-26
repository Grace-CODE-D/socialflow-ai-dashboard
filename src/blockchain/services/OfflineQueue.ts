export interface QueuedTransaction {
  id: string;
  xdr: string;
  status: 'pending' | 'retrying' | 'failed';
  timestamp: number;
}

export class OfflineQueue {
  private dbName = 'StellarTxQueue';
  private storeName = 'transactions';

  private async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(this.storeName)) {
          request.result.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  public async queueTransaction(xdr: string): Promise<string> {
    const db = await this.initDB();
    const id = crypto.randomUUID();
    const tx: QueuedTransaction = { id, xdr, status: 'pending', timestamp: Date.now() };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(tx);
      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  public async getPendingTransactions(): Promise<QueuedTransaction[]> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}