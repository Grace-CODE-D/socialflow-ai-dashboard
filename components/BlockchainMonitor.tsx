import { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { NotificationSettings } from './NotificationSettings';
import { NotificationHistory } from './NotificationHistory';
import { useBlockchainUpdates } from '../src/hooks/useBlockchainUpdates';

interface BlockchainEvent {
  id: string;
  type: string;
  timestamp: string;
  account: string;
  data: any;
}

interface UIUpdateIndicator {
  type: 'balance' | 'transaction' | 'nft' | 'campaign';
  message: string;
  timestamp: number;
}

declare global {
  interface Window {
    electronAPI?: {
      blockchain: {
        startMonitoring: (accountId: string) => Promise<{ success: boolean; error?: string }>;
        stopMonitoring: () => Promise<{ success: boolean; error?: string }>;
        onEvents: (callback: (events: BlockchainEvent[]) => void) => () => void;
      };
      notifications: {
        getPreferences: () => Promise<any>;
        setPreferences: (prefs: any) => Promise<void>;
        getHistory: () => Promise<any[]>;
        clearHistory: () => Promise<void>;
      };
    };
  }
}

export default function BlockchainMonitor() {
  const [accountId, setAccountId] = useState('');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [events, setEvents] = useState<BlockchainEvent[]>([]);
  const [error, setError] = useState('');
  const [updateIndicators, setUpdateIndicators] = useState<UIUpdateIndicator[]>([]);

  useBlockchainUpdates({
    onPayment: (event) => {
      addUpdateIndicator('balance', `Balance updated: +${event.data.amount} ${event.data.asset}`);
      addUpdateIndicator('transaction', 'New payment received');
    },
    onTokenTransfer: (event) => {
      addUpdateIndicator('transaction', 'Token transfer detected');
    },
    onNFTTransfer: (event) => {
      addUpdateIndicator('nft', 'NFT gallery updated');
    },
    onContractExecution: (event) => {
      addUpdateIndicator('campaign', 'Campaign metrics refreshed');
    },
  });

  const addUpdateIndicator = (type: UIUpdateIndicator['type'], message: string) => {
    const indicator: UIUpdateIndicator = { type, message, timestamp: Date.now() };
    setUpdateIndicators((prev) => [indicator, ...prev].slice(0, 10));
    setTimeout(() => {
      setUpdateIndicators((prev) => prev.filter((i) => i.timestamp !== indicator.timestamp));
    }, 5000);
  };

  useEffect(() => {
    if (!window.electronAPI?.blockchain) return;

    const unsubscribe = window.electronAPI.blockchain.onEvents((newEvents) => {
      setEvents((prev) => [...newEvents, ...prev].slice(0, 50));
    });

    return unsubscribe;
  }, []);

  const handleStart = async () => {
    if (!accountId.trim()) {
      setError('Please enter a Stellar account ID');
      return;
    }

    setError('');
    const result = await window.electronAPI?.blockchain.startMonitoring(accountId);
    
    if (result?.success) {
      setIsMonitoring(true);
    } else {
      setError(result?.error || 'Failed to start monitoring');
    }
  };

  const handleStop = async () => {
    const result = await window.electronAPI?.blockchain.stopMonitoring();
    if (result?.success) {
      setIsMonitoring(false);
    }
  };

  if (!window.electronAPI?.blockchain) {
    return (
      <Card className="p-6">
        <p className="text-red-400">Blockchain monitoring not available (Electron API not loaded)</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Blockchain Event Monitor</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-2">Stellar Account ID</label>
            <input
              type="text"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
              disabled={isMonitoring}
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={handleStart}
              disabled={isMonitoring}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded"
            >
              Start Monitoring
            </button>
            <button
              onClick={handleStop}
              disabled={!isMonitoring}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded"
            >
              Stop Monitoring
            </button>
          </div>

          {isMonitoring && (
            <p className="text-green-400 text-sm">✓ Monitoring active</p>
          )}
        </div>
      </Card>

      {updateIndicators.length > 0 && (
        <Card className="p-4 bg-blue-900/20 border-blue-500">
          <h4 className="text-sm font-bold mb-2">🔄 Real-time Updates</h4>
          <div className="space-y-1">
            {updateIndicators.map((indicator) => (
              <div key={indicator.timestamp} className="text-sm text-blue-300 animate-pulse">
                <span className="font-semibold">[{indicator.type.toUpperCase()}]</span> {indicator.message}
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <NotificationSettings />
        <NotificationHistory />
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">Recent Events ({events.length})</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {events.length === 0 ? (
            <p className="text-gray-400">No events yet</p>
          ) : (
            events.map((event) => (
              <div key={event.id} className="p-3 bg-gray-800 rounded border border-gray-700">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-sm text-blue-400">{event.type}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(event.timestamp).toLocaleString()}
                  </span>
                </div>
                <pre className="text-xs text-gray-300 overflow-x-auto">
                  {JSON.stringify(event.data, null, 2)}
                </pre>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
