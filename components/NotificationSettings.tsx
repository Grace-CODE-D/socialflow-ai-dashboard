import { useState, useEffect } from 'react';
import { Card } from './ui/Card';

interface NotificationPreferences {
  enabled: boolean;
  sound: boolean;
  payment: boolean;
  tokenTransfer: boolean;
  nftTransfer: boolean;
  contractExecution: boolean;
  accountCreated: boolean;
  trustlineCreated: boolean;
  throttleMs: number;
}

export function NotificationSettings() {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    const preferences = await window.electronAPI?.notifications.getPreferences();
    if (preferences) setPrefs(preferences);
  };

  const handleSave = async () => {
    if (!prefs) return;
    await window.electronAPI?.notifications.setPreferences(prefs);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!prefs) return null;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold mb-4">Notification Settings</h3>
      
      <div className="space-y-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={prefs.enabled}
            onChange={(e) => setPrefs({ ...prefs, enabled: e.target.checked })}
            className="w-4 h-4"
          />
          <span>Enable notifications</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={prefs.sound}
            onChange={(e) => setPrefs({ ...prefs, sound: e.target.checked })}
            disabled={!prefs.enabled}
            className="w-4 h-4"
          />
          <span>Sound</span>
        </label>

        <div className="border-t border-gray-700 pt-4 mt-4">
          <p className="text-sm text-gray-400 mb-2">Event Types</p>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={prefs.payment}
              onChange={(e) => setPrefs({ ...prefs, payment: e.target.checked })}
              disabled={!prefs.enabled}
              className="w-4 h-4"
            />
            <span>💰 Payments</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={prefs.tokenTransfer}
              onChange={(e) => setPrefs({ ...prefs, tokenTransfer: e.target.checked })}
              disabled={!prefs.enabled}
              className="w-4 h-4"
            />
            <span>🪙 Token Transfers</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={prefs.nftTransfer}
              onChange={(e) => setPrefs({ ...prefs, nftTransfer: e.target.checked })}
              disabled={!prefs.enabled}
              className="w-4 h-4"
            />
            <span>🖼️ NFT Transfers</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={prefs.contractExecution}
              onChange={(e) => setPrefs({ ...prefs, contractExecution: e.target.checked })}
              disabled={!prefs.enabled}
              className="w-4 h-4"
            />
            <span>⚙️ Contract Executions</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={prefs.accountCreated}
              onChange={(e) => setPrefs({ ...prefs, accountCreated: e.target.checked })}
              disabled={!prefs.enabled}
              className="w-4 h-4"
            />
            <span>✨ Account Created</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={prefs.trustlineCreated}
              onChange={(e) => setPrefs({ ...prefs, trustlineCreated: e.target.checked })}
              disabled={!prefs.enabled}
              className="w-4 h-4"
            />
            <span>🔗 Trustline Created</span>
          </label>
        </div>

        <div className="border-t border-gray-700 pt-4 mt-4">
          <label className="block text-sm mb-2">Throttle (ms)</label>
          <input
            type="number"
            value={prefs.throttleMs}
            onChange={(e) => setPrefs({ ...prefs, throttleMs: parseInt(e.target.value) })}
            disabled={!prefs.enabled}
            min="1000"
            step="1000"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
          />
          <p className="text-xs text-gray-400 mt-1">Minimum time between notifications of same type</p>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
        >
          {saved ? '✓ Saved' : 'Save Settings'}
        </button>
      </div>
    </Card>
  );
}
