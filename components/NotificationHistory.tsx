import { useState, useEffect } from 'react';
import { Card } from './ui/Card';

interface NotificationHistoryItem {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  eventType: string;
}

export function NotificationHistory() {
  const [history, setHistory] = useState<NotificationHistoryItem[]>([]);

  useEffect(() => {
    loadHistory();
    const interval = setInterval(loadHistory, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadHistory = async () => {
    const items = await window.electronAPI?.notifications.getHistory();
    if (items) setHistory(items);
  };

  const handleClear = async () => {
    await window.electronAPI?.notifications.clearHistory();
    setHistory([]);
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Notification History ({history.length})</h3>
        {history.length > 0 && (
          <button
            onClick={handleClear}
            className="text-sm px-3 py-1 bg-red-600 hover:bg-red-700 rounded"
          >
            Clear
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {history.length === 0 ? (
          <p className="text-gray-400">No notifications yet</p>
        ) : (
          history.map((item) => (
            <div key={item.id} className="p-3 bg-gray-800 rounded border border-gray-700">
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold text-sm">{item.title}</span>
                <span className="text-xs text-gray-400">
                  {new Date(item.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-300">{item.body}</p>
              <span className="text-xs text-gray-500 mt-1 inline-block">{item.eventType}</span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
