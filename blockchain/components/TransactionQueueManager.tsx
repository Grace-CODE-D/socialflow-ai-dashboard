import React, { useState, useEffect, useCallback } from 'react';
import { TransactionQueueItem } from './TransactionQueueItem';
import { Transaction, TransactionQueueItem as QueueItem } from '../types/transaction';
import { ArrowUpDown } from 'lucide-react';

interface TransactionQueueManagerProps {
  onTransactionSubmit?: (transaction: Transaction) => Promise<void>;
}

export const TransactionQueueManager: React.FC<TransactionQueueManagerProps> = ({
  onTransactionSubmit,
}) => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [pollingActive, setPollingActive] = useState(false);

  // Background confirmation polling
  useEffect(() => {
    if (!pollingActive) return;

    const interval = setInterval(() => {
      setQueue((prev) =>
        prev.map((item) => {
          if (item.status === 'dispatched') {
            // Simulate confirmation check
            const shouldConfirm = Math.random() > 0.7;
            if (shouldConfirm) {
              return { ...item, status: 'confirmed' };
            }
          }
          return item;
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [pollingActive]);

  // Auto-start polling when dispatched transactions exist
  useEffect(() => {
    const hasDispatched = queue.some((t) => t.status === 'dispatched');
    setPollingActive(hasDispatched);
  }, [queue]);

  const addTransaction = useCallback((tx: Omit<Transaction, 'id' | 'timestamp'>) => {
    const newTx: QueueItem = {
      ...tx,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
    };

    setQueue((prev) => [newTx, ...prev]);

    // Optimistically update to dispatched
    setTimeout(() => {
      setQueue((prev) =>
        prev.map((item) =>
          item.id === newTx.id ? { ...item, status: 'dispatched', estimatedConfirmTime: 5 } : item
        )
      );
    }, 500);

    return newTx.id;
  }, []);

  const retryTransaction = useCallback((id: string) => {
    setQueue((prev) =>
      prev.map((item) => {
        if (item.id === id && item.status === 'failed') {
          return {
            ...item,
            status: 'pending',
            retryCount: item.retryCount + 1,
            lastRetry: Date.now(),
            error: undefined,
          };
        }
        return item;
      })
    );

    // Simulate retry
    setTimeout(() => {
      setQueue((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: 'dispatched', estimatedConfirmTime: 5 } : item
        )
      );
    }, 500);
  }, []);

  // Expose addTransaction for external use
  useEffect(() => {
    (window as any).__addTransaction = addTransaction;
    return () => {
      delete (window as any).__addTransaction;
    };
  }, [addTransaction]);

  const pendingCount = queue.filter((t) => t.status === 'pending' || t.status === 'dispatched').length;
  const confirmedCount = queue.filter((t) => t.status === 'confirmed').length;

  return (
    <div className="bg-dark-bg rounded-2xl border border-dark-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ArrowUpDown className="w-5 h-5 text-primary-blue" />
          <h2 className="text-xl font-semibold text-white">Transaction Queue</h2>
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            <span className="text-gray-subtext">{pendingCount} Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-gray-subtext">{confirmedCount} Confirmed</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {queue.length === 0 ? (
          <div className="text-center py-12 text-gray-subtext">
            No transactions in queue
          </div>
        ) : (
          queue.map((tx) => (
            <TransactionQueueItem
              key={tx.id}
              transaction={tx}
              onRetry={retryTransaction}
            />
          ))
        )}
      </div>
    </div>
  );
};
