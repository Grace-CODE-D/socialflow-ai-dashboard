import React, { useState } from 'react';
import { Clock, CheckCircle, AlertCircle, Loader, X, Settings, Trash2 } from 'lucide-react';
import { Transaction, TransactionStatus, TransactionType } from '../../types';
import { useStagingDock } from '../../hooks/useStagingDock';
import { ToastContainer } from '../ui/Toast';

const statusIcons = {
  [TransactionStatus.PENDING]: <Clock className="w-4 h-4 text-gray-400" />,
  [TransactionStatus.SIGNING]: <AlertCircle className="w-4 h-4 text-yellow-400 animate-pulse" />,
  [TransactionStatus.SUBMITTED]: <Loader className="w-4 h-4 text-blue-400 animate-spin" />,
  [TransactionStatus.CONFIRMED]: <CheckCircle className="w-4 h-4 text-green-400" />,
  [TransactionStatus.FAILED]: <AlertCircle className="w-4 h-4 text-red-400" />
};

const statusColors = {
  [TransactionStatus.PENDING]: 'bg-gray-500/20 border-gray-500',
  [TransactionStatus.SIGNING]: 'bg-yellow-500/20 border-yellow-500',
  [TransactionStatus.SUBMITTED]: 'bg-blue-500/20 border-blue-500',
  [TransactionStatus.CONFIRMED]: 'bg-green-500/20 border-green-500',
  [TransactionStatus.FAILED]: 'bg-red-500/20 border-red-500'
};

const TransactionItem: React.FC<{
  tx: Transaction;
  onRemove: (id: string) => void;
  onSign?: (id: string) => void;
}> = ({ tx, onRemove, onSign }) => (
  <div className={`p-3 rounded-lg border ${statusColors[tx.status]} backdrop-blur-sm`}>
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 flex-1">
        {statusIcons[tx.status]}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{tx.description}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
            <span className="capitalize">{tx.type.replace('_', ' ')}</span>
            {tx.amount && <span>• {tx.amount} {tx.asset || 'XLM'}</span>}
          </div>
          {tx.error && <p className="text-xs text-red-400 mt-1">{tx.error}</p>}
          {tx.requiresSignature && tx.status === TransactionStatus.SIGNING && (
            <button
              onClick={() => onSign?.(tx.id)}
              className="mt-2 px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 rounded text-xs"
            >
              Sign Transaction
            </button>
          )}
        </div>
      </div>
      <button onClick={() => onRemove(tx.id)} className="hover:opacity-70">
        <X className="w-4 h-4" />
      </button>
    </div>
  </div>
);

export const StagingDock: React.FC = () => {
  const {
    transactions,
    toasts,
    removeTransaction,
    clearCompleted,
    setNotificationPreferences,
    getNotificationPreferences
  } = useStagingDock();

  const [showSettings, setShowSettings] = useState(false);
  const [prefs, setPrefs] = useState(getNotificationPreferences());

  const handlePrefChange = (key: keyof typeof prefs, value: any) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    setNotificationPreferences(updated);
  };

  const pendingCount = transactions.filter(tx => 
    tx.status === TransactionStatus.PENDING || tx.status === TransactionStatus.SIGNING
  ).length;

  return (
    <>
      <ToastContainer toasts={toasts} />
      
      <div className="fixed bottom-4 right-4 w-96 max-h-[600px] bg-dark-card/95 backdrop-blur-xl rounded-xl border border-gray-700 shadow-2xl flex flex-col">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Transaction Queue</h3>
            <p className="text-xs text-gray-400">{pendingCount} pending</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-gray-700/50 rounded-lg transition"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={clearCompleted}
              className="p-2 hover:bg-gray-700/50 rounded-lg transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showSettings && (
          <div className="p-4 border-b border-gray-700 bg-gray-800/50 space-y-3">
            <label className="flex items-center justify-between text-sm">
              <span>Enable Notifications</span>
              <input
                type="checkbox"
                checked={prefs.enabled}
                onChange={e => handlePrefChange('enabled', e.target.checked)}
                className="rounded"
              />
            </label>
            <label className="flex items-center justify-between text-sm">
              <span>Sound</span>
              <input
                type="checkbox"
                checked={prefs.sound}
                onChange={e => handlePrefChange('sound', e.target.checked)}
                className="rounded"
              />
            </label>
            <label className="flex items-center justify-between text-sm">
              <span>Sound Type</span>
              <select
                value={prefs.soundType}
                onChange={e => handlePrefChange('soundType', e.target.value)}
                className="bg-gray-700 rounded px-2 py-1 text-xs"
              >
                <option value="default">Default</option>
                <option value="subtle">Subtle</option>
                <option value="alert">Alert</option>
              </select>
            </label>
            <label className="flex items-center justify-between text-sm">
              <span>Group Notifications</span>
              <input
                type="checkbox"
                checked={prefs.grouping}
                onChange={e => handlePrefChange('grouping', e.target.checked)}
                className="rounded"
              />
            </label>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {transactions.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">No transactions in queue</p>
          ) : (
            transactions.map(tx => (
              <TransactionItem key={tx.id} tx={tx} onRemove={removeTransaction} />
            ))
          )}
        </div>
      </div>
    </>
  );
};
