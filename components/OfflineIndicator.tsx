import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { offlineQueue } from '../services/offlineQueue';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      updatePendingCount();
    };

    const updatePendingCount = async () => {
      const count = await offlineQueue.getPendingCount();
      setPendingCount(count);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Update pending count every 5 seconds
    const interval = setInterval(updatePendingCount, 5000);
    updatePendingCount();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(interval);
    };
  }, []);

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg ${
      isOnline ? 'bg-yellow-500/90' : 'bg-red-500/90'
    } text-white`}>
      {isOnline ? (
        <>
          <Wifi className="w-5 h-5" />
          <span className="text-sm font-medium">
            Syncing {pendingCount} transaction{pendingCount !== 1 ? 's' : ''}...
          </span>
        </>
      ) : (
        <>
          <WifiOff className="w-5 h-5" />
          <span className="text-sm font-medium">Offline Mode</span>
          {pendingCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-white/20 rounded text-xs">
              {pendingCount} queued
            </span>
          )}
        </>
      )}
    </div>
  );
};
