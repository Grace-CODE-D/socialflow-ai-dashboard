interface BlockchainEvent {
  id: string;
  type: string;
  timestamp: string;
  account: string;
  data: any;
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

export {};
