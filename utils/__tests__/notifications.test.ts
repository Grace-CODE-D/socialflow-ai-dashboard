import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationManager } from '../notifications';

describe('NotificationManager', () => {
  beforeEach(() => {
    NotificationManager.setPreferences({
      enabled: true,
      sound: true,
      soundType: 'default',
      grouping: true,
      showOnNewItem: true,
      showOnSignature: true,
      showOnConfirmation: true
    });
  });

  it('sets and gets preferences', () => {
    NotificationManager.setPreferences({ sound: false });
    const prefs = NotificationManager.getPreferences();
    expect(prefs.sound).toBe(false);
  });

  it('groups duplicate notifications', () => {
    const shouldGroup1 = NotificationManager.shouldGroup('test-notification');
    expect(shouldGroup1).toBe(false);

    const shouldGroup2 = NotificationManager.shouldGroup('test-notification');
    expect(shouldGroup2).toBe(true);
  });

  it('does not group when grouping disabled', () => {
    NotificationManager.setPreferences({ grouping: false });
    
    const shouldGroup1 = NotificationManager.shouldGroup('test-1');
    const shouldGroup2 = NotificationManager.shouldGroup('test-1');
    
    expect(shouldGroup1).toBe(false);
    expect(shouldGroup2).toBe(false);
  });

  it('clears old notifications from queue', () => {
    NotificationManager.shouldGroup('old-notification');
    
    vi.useFakeTimers();
    vi.advanceTimersByTime(6000);
    
    const shouldGroup = NotificationManager.shouldGroup('old-notification');
    expect(shouldGroup).toBe(false);
    
    vi.useRealTimers();
  });
});
