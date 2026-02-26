import { useState, useEffect } from 'react';
import { transactionSyncService, SyncStatus } from '../services/transactionSyncService';
import { transactionDB, TransactionRecord } from '../services/transactionDB';

export function TransactionSyncDemo() {
  const [accountId, setAccountId] = useState('');
  const [syncState, setSyncState] = useState(transactionSyncService.getSyncState());
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [stopAutoSync, setStopAutoSync] = useState<(() => void) | null>(null);

  useEffect(() => {
    const unsubscribe = transactionSyncService.onSyncStateChange(setSyncState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [syncState.totalSynced]);

  const loadTransactions = async () => {
    try {
      await transactionDB.init();
      const txs = await transactionDB.getAllTransactions();
      setTransactions(txs.sort((a, b) => b.timestamp - a.timestamp));
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const handleInitialSync = async () => {
    if (!accountId.trim()) {
      alert('Please enter a Stellar account ID');
      return;
    }

    try {
      await transactionSyncService.initialSync(accountId);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  const handleIncrementalSync = async () => {
    if (!accountId.trim()) {
      alert('Please enter a Stellar account ID');
      return;
    }

    try {
      await transactionSyncService.incrementalSync(accountId);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  const handleWalletConnect = async () => {
    if (!accountId.trim()) {
      alert('Please enter a Stellar account ID');
      return;
    }

    try {
      await transactionSyncService.syncOnWalletConnect(accountId);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  const toggleAutoSync = async () => {
    if (autoSyncEnabled && stopAutoSync) {
      stopAutoSync();
      setStopAutoSync(null);
      setAutoSyncEnabled(false);
    } else {
      if (!accountId.trim()) {
        alert('Please enter a Stellar account ID');
        return;
      }
      const stop = await transactionSyncService.startAutoSync(accountId, 30000);
      setStopAutoSync(() => stop);
      setAutoSyncEnabled(true);
    }
  };

  const handleClearDB = async () => {
    if (confirm('Clear all transactions from database?')) {
      try {
        await transactionDB.init();
        await transactionDB.clearAll();
        setTransactions([]);
      } catch (error) {
        console.error('Failed to clear database:', error);
      }
    }
  };

  const getSyncStatusColor = () => {
    switch (syncState.status) {
      case SyncStatus.SYNCING: return 'text-yellow-400';
      case SyncStatus.SUCCESS: return 'text-green-400';
      case SyncStatus.ERROR: return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getSyncStatusIcon = () => {
    switch (syncState.status) {
      case SyncStatus.SYNCING: return '⏳';
      case SyncStatus.SUCCESS: return '✓';
      case SyncStatus.ERROR: return '✗';
      default: return '○';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-gray-900 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Transaction Sync Demo</h2>

        {/* Account Input */}
        <div className="mb-4">
          <label className="block text-sm mb-2">Stellar Account ID</label>
          <input
            type="text"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
          />
        </div>

        {/* Sync Status */}
        <div className="mb-4 p-4 bg-gray-800 rounded">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-2xl ${getSyncStatusColor()}`}>
                {getSyncStatusIcon()}
              </span>
              <div>
                <div className="font-semibold">Status: {syncState.status}</div>
                <div className="text-sm text-gray-400">
                  Total synced: {syncState.totalSynced} transactions
                </div>
                {syncState.lastSyncTime && (
                  <div className="text-xs text-gray-500">
                    Last sync: {new Date(syncState.lastSyncTime).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
            {autoSyncEnabled && (
              <span className="text-xs bg-green-600 px-2 py-1 rounded">
                Auto-sync ON
              </span>
            )}
          </div>
          {syncState.error && (
            <div className="mt-2 text-sm text-red-400">
              Error: {syncState.error}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={handleInitialSync}
            disabled={syncState.status === SyncStatus.SYNCING}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-sm"
          >
            Initial Sync (100 txs)
          </button>
          <button
            onClick={handleIncrementalSync}
            disabled={syncState.status === SyncStatus.SYNCING}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded text-sm"
          >
            Incremental Sync
          </button>
          <button
            onClick={handleWalletConnect}
            disabled={syncState.status === SyncStatus.SYNCING}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded text-sm"
          >
            Wallet Connect Sync
          </button>
          <button
            onClick={toggleAutoSync}
            className={`px-4 py-2 rounded text-sm ${
              autoSyncEnabled
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-orange-600 hover:bg-orange-700'
            }`}
          >
            {autoSyncEnabled ? 'Stop Auto-Sync' : 'Start Auto-Sync'}
          </button>
          <button
            onClick={handleClearDB}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm"
          >
            Clear DB
          </button>
        </div>

        {/* Transaction List */}
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Stored Transactions ({transactions.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {transactions.length === 0 ? (
              <p className="text-gray-400 text-center py-4">
                No transactions in database
              </p>
            ) : (
              transactions.slice(0, 20).map((tx) => (
                <div key={tx.id} className="p-3 bg-gray-800 rounded text-sm">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-mono text-xs text-blue-400">
                      {tx.id.slice(0, 16)}...
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(tx.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-300">
                    <span>Type: {tx.type}</span>
                    <span>Asset: {tx.asset}</span>
                    <span>Status: {tx.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
