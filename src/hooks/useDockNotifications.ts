/**
 * Dock Notifications Hook
 * Requirements: 20.2, 20.3
 */

import { useState, useCallback, useEffect } from "react";
import type {
  DockNotification,
  NotificationType,
  NotificationSoundPreferences,
} from "../types/stagingDock";

const NOTIFICATIONS_KEY = "socialflow-dock-notifications";
const SOUND_PREFS_KEY = "socialflow-notification-sounds";

/**
 * Default sound preferences
 */
const defaultSoundPreferences: NotificationSoundPreferences = {
  enabled: true,
  volume: 0.5,
  itemAdded: true,
  signatureRequired: true,
  transactionConfirmed: true,
  transactionFailed: true,
};

/**
 * Use Dock Notifications Hook
 */
export const useDockNotifications = () => {
  const [notifications, setNotifications] = useState<DockNotification[]>([]);
  const [soundPreferences, setSoundPreferences] =
    useState<NotificationSoundPreferences>(defaultSoundPreferences);
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  /**
   * Generate unique ID
   */
  const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  /**
   * Play notification sound
   */
  const playSound = useCallback(
    (type: NotificationType) => {
      if (!soundEnabled || !soundPreferences.enabled) return;

      const shouldPlay = {
        item_added: soundPreferences.itemAdded,
        signature_required: soundPreferences.signatureRequired,
        transaction_confirmed: soundPreferences.transactionConfirmed,
        transaction_failed: soundPreferences.transactionFailed,
        queue_processing: false,
      };

      if (shouldPlay[type]) {
        // Create a simple beep sound using Web Audio API
        try {
          const audioContext = new (
            window.AudioContext || (window as any).webkitAudioContext
          )();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.frequency.value =
            type === "transaction_failed" ? 200 : 800;
          oscillator.type = "sine";
          gainNode.gain.value = soundPreferences.volume * 0.3;

          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.15);
        } catch (e) {
          console.warn("Could not play notification sound:", e);
        }
      }
    },
    [soundEnabled, soundPreferences],
  );

  /**
   * Add notification
   */
  const addNotification = useCallback(
    (
      type: NotificationType,
      title: string,
      message: string,
      transactionId?: string,
    ): string => {
      const id = generateId();
      const notification: DockNotification = {
        id,
        type,
        title,
        message,
        timestamp: Date.now(),
        read: false,
        transactionId,
      };

      setNotifications((prev) => [notification, ...prev].slice(0, 50)); // Keep last 50
      setUnreadCount((prev) => prev + 1);
      playSound(type);

      // Store in localStorage for persistence
      try {
        const stored = localStorage.getItem(NOTIFICATIONS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          localStorage.setItem(
            NOTIFICATIONS_KEY,
            JSON.stringify([notification, ...parsed].slice(0, 50)),
          );
        } else {
          localStorage.setItem(
            NOTIFICATIONS_KEY,
            JSON.stringify([notification]),
          );
        }
      } catch (e) {
        console.warn("Could not save notification to localStorage:", e);
      }

      return id;
    },
    [playSound],
  );

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  /**
   * Remove notification
   */
  const removeNotification = useCallback(
    (id: string) => {
      const notification = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (notification && !notification.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    },
    [notifications],
  );

  /**
   * Clear all notifications
   */
  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem(NOTIFICATIONS_KEY);
  }, []);

  /**
   * Update sound preferences
   */
  const updateSoundPreferences = useCallback(
    (prefs: Partial<NotificationSoundPreferences>) => {
      setSoundPreferences((prev) => {
        const updated = { ...prev, ...prefs };
        localStorage.setItem(SOUND_PREFS_KEY, JSON.stringify(updated));
        return updated;
      });
    },
    [],
  );

  /**
   * Toggle sound
   */
  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  /**
   * Group notifications by type
   */
  const groupedNotifications = notifications.reduce(
    (acc, notification) => {
      const type = notification.type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(notification);
      return acc;
    },
    {} as Record<NotificationType, DockNotification[]>,
  );

  // Load saved data on mount
  useEffect(() => {
    try {
      const storedNotifications = localStorage.getItem(NOTIFICATIONS_KEY);
      if (storedNotifications) {
        const parsed = JSON.parse(storedNotifications);
        setNotifications(parsed);
        setUnreadCount(parsed.filter((n: DockNotification) => !n.read).length);
      }

      const storedPrefs = localStorage.getItem(SOUND_PREFS_KEY);
      if (storedPrefs) {
        setSoundPreferences(JSON.parse(storedPrefs));
      }
    } catch (e) {
      console.warn("Could not load notifications from localStorage:", e);
    }
  }, []);

  // Auto-remove old notifications (older than 24 hours)
  useEffect(() => {
    const cleanup = setInterval(
      () => {
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        setNotifications((prev) => {
          const filtered = prev.filter((n) => n.timestamp > oneDayAgo);
          if (filtered.length !== prev.length) {
            setUnreadCount(filtered.filter((n) => !n.read).length);
          }
          return filtered;
        });
      },
      60 * 60 * 1000,
    ); // Run every hour

    return () => clearInterval(cleanup);
  }, []);

  return {
    notifications,
    unreadCount,
    soundEnabled,
    soundPreferences,
    groupedNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    updateSoundPreferences,
    toggleSound,
  };
};
