import { NotificationPreferences } from '../types';

export class NotificationManager {
  private static preferences: NotificationPreferences = {
    enabled: true,
    sound: true,
    soundType: 'default',
    grouping: true,
    showOnNewItem: true,
    showOnSignature: true,
    showOnConfirmation: true
  };

  private static audioContext: AudioContext | null = null;
  private static notificationQueue: Array<{ id: string; timestamp: number }> = [];

  static setPreferences(prefs: Partial<NotificationPreferences>) {
    this.preferences = { ...this.preferences, ...prefs };
  }

  static getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  static playSound(type: 'default' | 'subtle' | 'alert' = 'default') {
    if (!this.preferences.sound) return;

    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    const frequencies = { default: 800, subtle: 600, alert: 1000 };
    oscillator.frequency.value = frequencies[type];
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.2);
  }

  static shouldGroup(notificationId: string): boolean {
    if (!this.preferences.grouping) return false;

    const now = Date.now();
    this.notificationQueue = this.notificationQueue.filter(n => now - n.timestamp < 5000);

    const exists = this.notificationQueue.some(n => n.id === notificationId);
    if (!exists) {
      this.notificationQueue.push({ id: notificationId, timestamp: now });
    }

    return exists;
  }
}
