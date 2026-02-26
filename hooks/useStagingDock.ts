import { useState, useCallback } from 'react';
import { Transaction, TransactionStatus, NotificationPreferences } from '../types';
import { NotificationManager } from '../utils/notifications';
import { ToastProps, ToastType } from '../components/ui/Toast';

export const useStagingDock = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    
    if (NotificationManager.shouldGroup(message)) return;

    setToasts(prev => [...prev, {
      id,
      type,
      message,
      onClose: (toastId: string) => setToasts(t => t.filter(x => x.id !== toastId))
    }]);

    NotificationManager.playSound(type === 'error' ? 'alert' : type === 'success' ? 'default' : 'subtle');
  }, []);

  const addTransaction = useCallback((tx: Omit<Transaction, 'id' | 'timestamp'>) => {
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Date.now()}-${Math.random()}`,
      timestamp: Date.now()
    };

    setTransactions(prev => [...prev, newTx]);
    
    const prefs = NotificationManager.getPreferences();
    if (prefs.showOnNewItem) {
      addToast('info', `New transaction added: ${tx.description}`);
    }

    return newTx.id;
  }, [addToast]);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(tx => {
      if (tx.id !== id) return tx;
      
      const updated = { ...tx, ...updates };
      const prefs = NotificationManager.getPreferences();

      if (updates.status === TransactionStatus.SIGNING && prefs.showOnSignature) {
        addToast('warning', `Signature required: ${tx.description}`);
      }

      if (updates.status === TransactionStatus.CONFIRMED && prefs.showOnConfirmation) {
        addToast('success', `Transaction confirmed: ${tx.description}`);
      }

      if (updates.status === TransactionStatus.FAILED) {
        addToast('error', `Transaction failed: ${tx.description}`);
      }

      return updated;
    }));
  }, [addToast]);

  const removeTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(tx => tx.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setTransactions(prev => prev.filter(tx => 
      tx.status !== TransactionStatus.CONFIRMED && tx.status !== TransactionStatus.FAILED
    ));
  }, []);

  const bundleSignatures = useCallback((txIds: string[]) => {
    const bundleId = `bundle-${Date.now()}`;
    const bundledTxs = transactions.filter(tx => txIds.includes(tx.id));
    
    if (bundledTxs.length > 0) {
      addToast('info', `Bundling ${bundledTxs.length} transactions for signing`);
    }

    return bundleId;
  }, [transactions, addToast]);

  const setNotificationPreferences = useCallback((prefs: Partial<NotificationPreferences>) => {
    NotificationManager.setPreferences(prefs);
  }, []);

  return {
    transactions,
    toasts,
    addTransaction,
    updateTransaction,
    removeTransaction,
    clearCompleted,
    bundleSignatures,
    setNotificationPreferences,
    getNotificationPreferences: NotificationManager.getPreferences
  };
};
