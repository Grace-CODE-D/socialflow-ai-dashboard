/**
 * Transaction Queue Hook with IndexedDB Storage
 * Requirements: 2.4, 4.1
 */

import { useState, useEffect, useCallback } from "react";
import type {
  PendingTransaction,
  TransactionGroup,
  QueueStatus,
  QueuePriority,
  TransactionStatus,
  StoredQueueItem,
} from "../types/stagingDock";

const DB_NAME = "socialflow-transaction-queue";
const DB_VERSION = 1;
const STORE_NAME = "transactions";
const GROUPS_STORE = "groups";

let dbInstance: IDBDatabase | null = null;

/**
 * Initialize IndexedDB
 */
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("priority", "priority", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
        store.createIndex("groupId", "groupId", { unique: false });
      }

      if (!db.objectStoreNames.contains(GROUPS_STORE)) {
        db.createObjectStore(GROUPS_STORE, { keyPath: "id" });
      }
    };
  });
};

/**
 * Generate unique ID
 */
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Use Transaction Queue Hook
 */
export const useTransactionQueue = () => {
  const [transactions, setTransactions] = useState<PendingTransaction[]>([]);
  const [groups, setGroups] = useState<TransactionGroup[]>([]);
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({
    isProcessing: false,
    currentTransactionId: null,
    totalPending: 0,
    totalGroups: 0,
    processedCount: 0,
    failedCount: 0,
    lastProcessedAt: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load all transactions from IndexedDB
   */
  const loadTransactions = useCallback(async () => {
    try {
      const db = await initDB();
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      return new Promise<PendingTransaction[]>((resolve, reject) => {
        request.onsuccess = () => {
          const items = request.result as StoredQueueItem[];
          const pending = items
            .filter(
              (item) => item.status === "pending" || item.status === "signing",
            )
            .sort((a, b) => {
              const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
              return priorityOrder[a.priority] - priorityOrder[b.priority];
            });
          resolve(pending);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error("Error loading transactions:", err);
      return [];
    }
  }, []);

  /**
   * Load groups from IndexedDB
   */
  const loadGroups = useCallback(async (): Promise<TransactionGroup[]> => {
    try {
      const db = await initDB();
      const tx = db.transaction(GROUPS_STORE, "readonly");
      const store = tx.objectStore(GROUPS_STORE);
      const request = store.getAll();

      return new Promise<TransactionGroup[]>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error("Error loading groups:", err);
      return [];
    }
  }, []);

  /**
   * Add transaction to queue
   */
  const addTransaction = useCallback(
    async (
      transaction: Omit<
        PendingTransaction,
        "id" | "createdAt" | "updatedAt" | "retryCount"
      >,
    ): Promise<string> => {
      const db = await initDB();
      const id = generateId();
      const now = Date.now();

      const newTransaction: StoredQueueItem = {
        ...transaction,
        id,
        createdAt: now,
        updatedAt: now,
        retryCount: 0,
      };

      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const request = store.add(newTransaction);

        request.onsuccess = () => {
          loadTransactions().then(setTransactions);
          resolve(id);
        };
        request.onerror = () => reject(request.error);
      });
    },
    [loadTransactions],
  );

  /**
   * Update transaction status
   */
  const updateTransactionStatus = useCallback(
    async (
      id: string,
      status: TransactionStatus,
      error?: string,
    ): Promise<void> => {
      const db = await initDB();

      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
          const item = getRequest.result as StoredQueueItem;
          if (item) {
            item.status = status;
            item.updatedAt = Date.now();
            if (error) item.error = error;

            const putRequest = store.put(item);
            putRequest.onsuccess = () => {
              loadTransactions().then(setTransactions);
              resolve();
            };
            putRequest.onerror = () => reject(putRequest.error);
          } else {
            resolve();
          }
        };
        getRequest.onerror = () => reject(getRequest.error);
      });
    },
    [loadTransactions],
  );

  /**
   * Remove transaction from queue
   */
  const removeTransaction = useCallback(
    async (id: string): Promise<void> => {
      const db = await initDB();

      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => {
          loadTransactions().then(setTransactions);
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    },
    [loadTransactions],
  );

  /**
   * Reorder transactions (drag and drop)
   */
  const reorderTransactions = useCallback(
    async (sourceIndex: number, destinationIndex: number): Promise<void> => {
      const newTransactions = [...transactions];
      const [removed] = newTransactions.splice(sourceIndex, 1);
      newTransactions.splice(destinationIndex, 0, removed);

      // Update priority based on new order
      const db = await initDB();
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);

      for (let i = 0; i < newTransactions.length; i++) {
        const priority: QueuePriority =
          i < 2 ? "urgent" : i < 5 ? "high" : i < 10 ? "normal" : "low";
        const item = { ...newTransactions[i], priority, updatedAt: Date.now() };
        store.put(item);
      }

      setTransactions(newTransactions);
    },
    [transactions],
  );

  /**
   * Create transaction group for bundling
   */
  const createGroup = useCallback(
    async (transactionIds: string[]): Promise<string> => {
      const groupId = generateId();
      const groupTransactions = transactions.filter((t) =>
        transactionIds.includes(t.id),
      );
      const totalFee = groupTransactions.reduce(
        (sum, t) => sum + (t.fee || 0),
        0,
      );

      const group: TransactionGroup = {
        id: groupId,
        transactions: transactionIds,
        totalFee,
        status: "pending",
        createdAt: Date.now(),
      };

      const db = await initDB();

      return new Promise((resolve, reject) => {
        const tx = db.transaction(GROUPS_STORE, "readwrite");
        const store = tx.objectStore(GROUPS_STORE);
        const request = store.add(group);

        request.onsuccess = () => {
          loadGroups().then(setGroups);
          resolve(groupId);
        };
        request.onerror = () => reject(request.error);
      });
    },
    [transactions, loadGroups],
  );

  /**
   * Get transaction by ID
   */
  const getTransaction = useCallback(
    async (id: string): Promise<PendingTransaction | null> => {
      try {
        const db = await initDB();
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(id);

        return new Promise((resolve, reject) => {
          request.onsuccess = () => resolve(request.result || null);
          request.onerror = () => reject(request.error);
        });
      } catch {
        return null;
      }
    },
    [],
  );

  /**
   * Clear all completed transactions
   */
  const clearCompleted = useCallback(async (): Promise<void> => {
    const db = await initDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const index = store.index("status");
      const request = index.getAllKeys("confirmed");

      request.onsuccess = () => {
        const keys = request.result;
        keys.forEach((key) => store.delete(key));
        loadTransactions().then(setTransactions);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }, [loadTransactions]);

  /**
   * Get total estimated gas fees
   */
  const getTotalEstimatedFees = useCallback((): number => {
    return transactions.reduce(
      (sum, t) => sum + (t.estimatedGas || t.fee || 0),
      0,
    );
  }, [transactions]);

  /**
   * Initialize and load data
   */
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        await initDB();
        const [loadedTransactions, loadedGroups] = await Promise.all([
          loadTransactions(),
          loadGroups(),
        ]);
        setTransactions(loadedTransactions);
        setGroups(loadedGroups);
        setQueueStatus((prev) => ({
          ...prev,
          totalPending: loadedTransactions.length,
          totalGroups: loadedGroups.length,
        }));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to initialize queue",
        );
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [loadTransactions, loadGroups]);

  return {
    transactions,
    groups,
    queueStatus,
    isLoading,
    error,
    addTransaction,
    updateTransactionStatus,
    removeTransaction,
    reorderTransactions,
    createGroup,
    getTransaction,
    clearCompleted,
    getTotalEstimatedFees,
    loadTransactions,
  };
};
