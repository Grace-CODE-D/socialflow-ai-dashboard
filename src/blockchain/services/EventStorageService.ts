import { ContractEvent, ContractEventType } from '../types/contract';

const DB_NAME = 'socialflow_blockchain';
const DB_VERSION = 1;
const EVENTS_STORE = 'contract_events';

export class EventStorageService {
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
        
        if (!db.objectStoreNames.contains(EVENTS_STORE)) {
          const store = db.createObjectStore(EVENTS_STORE, { keyPath: 'id' });
          store.createIndex('contractId', 'contractId', { unique: false });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('transactionHash', 'transactionHash', { unique: false });
        }
      };
    });
  }

  async storeEvent(event: ContractEvent): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([EVENTS_STORE], 'readwrite');
      const store = transaction.objectStore(EVENTS_STORE);
      const request = store.put(event);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async storeEvents(events: ContractEvent[]): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([EVENTS_STORE], 'readwrite');
      const store = transaction.objectStore(EVENTS_STORE);

      events.forEach(event => store.put(event));

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getEventsByContract(contractId: string): Promise<ContractEvent[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([EVENTS_STORE], 'readonly');
      const store = transaction.objectStore(EVENTS_STORE);
      const index = store.index('contractId');
      const request = index.getAll(contractId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getEventsByType(eventType: ContractEventType): Promise<ContractEvent[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([EVENTS_STORE], 'readonly');
      const store = transaction.objectStore(EVENTS_STORE);
      const index = store.index('type');
      const request = index.getAll(eventType);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getEventsByTransaction(transactionHash: string): Promise<ContractEvent[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([EVENTS_STORE], 'readonly');
      const store = transaction.objectStore(EVENTS_STORE);
      const index = store.index('transactionHash');
      const request = index.getAll(transactionHash);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getRecentEvents(limit: number = 50): Promise<ContractEvent[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([EVENTS_STORE], 'readonly');
      const store = transaction.objectStore(EVENTS_STORE);
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev');
      const results: ContractEvent[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor && results.length < limit) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async deleteEvent(eventId: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([EVENTS_STORE], 'readwrite');
      const store = transaction.objectStore(EVENTS_STORE);
      const request = store.delete(eventId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllEvents(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([EVENTS_STORE], 'readwrite');
      const store = transaction.objectStore(EVENTS_STORE);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const eventStorage = new EventStorageService();
