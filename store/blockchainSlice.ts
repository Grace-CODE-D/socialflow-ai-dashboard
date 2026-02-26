import { WalletState, TokenBalance, NotificationPreferences, NotificationType, NotificationPriority } from '../types';

// Default notification preferences
const defaultNotificationPreferences: NotificationPreferences = {
  doNotDisturb: false,
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00',
    days: [0, 1, 2, 3, 4, 5, 6] // All days
  },
  types: {
    [NotificationType.PAYMENT]: {
      enabled: true,
      priority: NotificationPriority.HIGH,
      sound: true,
      desktop: true,
      email: true
    },
    [NotificationType.TRANSFER]: {
      enabled: true,
      priority: NotificationPriority.MEDIUM,
      sound: true,
      desktop: true,
      email: false
    },
    [NotificationType.CONTRACT]: {
      enabled: true,
      priority: NotificationPriority.HIGH,
      sound: true,
      desktop: true,
      email: true
    },
    [NotificationType.BALANCE_CHANGE]: {
      enabled: true,
      priority: NotificationPriority.LOW,
      sound: false,
      desktop: true,
      email: false
    },
    [NotificationType.TRANSACTION_FAILED]: {
      enabled: true,
      priority: NotificationPriority.CRITICAL,
      sound: true,
      desktop: true,
      email: true
    }
  }
};

// Simple state management without Redux dependency
let walletState: WalletState = {
  isConnected: false,
  publicKey: null,
  provider: null,
  network: 'testnet',
  xlmBalance: null,
  tokenBalances: [],
  isLoading: false,
  error: null
};

let notificationPreferences: NotificationPreferences = { ...defaultNotificationPreferences };

const listeners: Set<(state: WalletState) => void> = new Set();
const notificationListeners: Set<(prefs: NotificationPreferences) => void> = new Set();

// Load persisted state from localStorage
const loadPersistedState = (): void => {
  try {
    const persisted = localStorage.getItem('walletState');
    if (persisted) {
      const parsed = JSON.parse(persisted);
      walletState = { ...walletState, ...parsed };
    }
    
    const persistedPrefs = localStorage.getItem('notificationPreferences');
    if (persistedPrefs) {
      const parsed = JSON.parse(persistedPrefs);
      notificationPreferences = { ...defaultNotificationPreferences, ...parsed };
    }
  } catch (error) {
    console.error('Failed to load persisted wallet state:', error);
  }
};

// Persist state to localStorage
const persistState = (): void => {
  try {
    localStorage.setItem('walletState', JSON.stringify(walletState));
  } catch (error) {
    console.error('Failed to persist wallet state:', error);
  }
};

const persistNotificationPreferences = (): void => {
  try {
    localStorage.setItem('notificationPreferences', JSON.stringify(notificationPreferences));
  } catch (error) {
    console.error('Failed to persist notification preferences:', error);
  }
};

// Notify all listeners
const notifyListeners = (): void => {
  listeners.forEach(listener => listener(walletState));
};

const notifyNotificationListeners = (): void => {
  notificationListeners.forEach(listener => listener(notificationPreferences));
};

// Actions
export const connectWallet = async (provider: string, publicKey: string): Promise<void> => {
  walletState = {
    ...walletState,
    isLoading: true,
    error: null
  };
  notifyListeners();

  try {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    walletState = {
      ...walletState,
      isConnected: true,
      publicKey,
      provider,
      isLoading: false,
      xlmBalance: '1000.5000000', // Mock balance
      tokenBalances: [
        { code: 'USDC', issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN', balance: '500.0000000' },
        { code: 'yXLM', issuer: 'GARDNV3Q7YGT4AKSDF25LT32YSCCW4EV22Y2TV3I2PU2MMXJTEDL5T55', balance: '250.0000000' }
      ]
    };
    persistState();
    notifyListeners();
  } catch (error) {
    walletState = {
      ...walletState,
      isLoading: false,
      error: error instanceof Error ? error.message : 'Connection failed'
    };
    notifyListeners();
  }
};

export const disconnectWallet = (): void => {
  walletState = {
    isConnected: false,
    publicKey: null,
    provider: null,
    network: 'testnet',
    xlmBalance: null,
    tokenBalances: [],
    isLoading: false,
    error: null
  };
  persistState();
  notifyListeners();
};

export const switchWallet = async (provider: string, publicKey: string): Promise<void> => {
  await connectWallet(provider, publicKey);
};

export const setError = (error: string | null): void => {
  walletState = { ...walletState, error };
  notifyListeners();
};

// Selectors
export const getWalletState = (): WalletState => walletState;

export const isWalletConnected = (): boolean => walletState.isConnected;

export const getPublicKey = (): string | null => walletState.publicKey;

export const getProvider = (): string | null => walletState.provider;

// Subscribe to state changes
export const subscribe = (listener: (state: WalletState) => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const subscribeToNotifications = (listener: (prefs: NotificationPreferences) => void): (() => void) => {
  notificationListeners.add(listener);
  return () => notificationListeners.delete(listener);
};

// Notification Preferences Actions
export const getNotificationPreferences = (): NotificationPreferences => notificationPreferences;

export const updateNotificationPreferences = (prefs: Partial<NotificationPreferences>): void => {
  notificationPreferences = { ...notificationPreferences, ...prefs };
  persistNotificationPreferences();
  notifyNotificationListeners();
};

export const toggleDoNotDisturb = (): void => {
  notificationPreferences.doNotDisturb = !notificationPreferences.doNotDisturb;
  persistNotificationPreferences();
  notifyNotificationListeners();
};

export const updateQuietHours = (quietHours: Partial<NotificationPreferences['quietHours']>): void => {
  notificationPreferences.quietHours = { ...notificationPreferences.quietHours, ...quietHours };
  persistNotificationPreferences();
  notifyNotificationListeners();
};

export const updateNotificationType = (type: NotificationType, config: Partial<NotificationPreferences['types'][NotificationType]>): void => {
  notificationPreferences.types[type] = { ...notificationPreferences.types[type], ...config };
  persistNotificationPreferences();
  notifyNotificationListeners();
};

export const shouldShowNotification = (type: NotificationType): boolean => {
  // Check do not disturb
  if (notificationPreferences.doNotDisturb) {
    return false;
  }

  // Check quiet hours
  if (notificationPreferences.quietHours.enabled) {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    if (notificationPreferences.quietHours.days.includes(currentDay)) {
      const { startTime, endTime } = notificationPreferences.quietHours;
      
      // Handle quiet hours that span midnight
      if (startTime > endTime) {
        if (currentTime >= startTime || currentTime <= endTime) {
          return false;
        }
      } else {
        if (currentTime >= startTime && currentTime <= endTime) {
          return false;
        }
      }
    }
  }

  // Check if notification type is enabled
  return notificationPreferences.types[type].enabled;
};

// Initialize
loadPersistedState();
