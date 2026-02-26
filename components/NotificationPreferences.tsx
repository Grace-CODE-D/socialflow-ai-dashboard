import React, { useState, useEffect } from 'react';
import { 
  NotificationType, 
  NotificationPriority, 
  NotificationPreferences as NotificationPrefsType 
} from '../types';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  toggleDoNotDisturb,
  updateQuietHours,
  updateNotificationType,
  subscribeToNotifications
} from '../store/blockchainSlice';

export const NotificationPreferences: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [preferences, setPreferences] = useState<NotificationPrefsType>(getNotificationPreferences());

  useEffect(() => {
    const unsubscribe = subscribeToNotifications((prefs) => {
      setPreferences(prefs);
    });
    return unsubscribe;
  }, []);

  const Toggle = ({ 
    label, 
    checked, 
    onChange,
    description 
  }: { 
    label: string; 
    checked: boolean; 
    onChange: (val: boolean) => void;
    description?: string;
  }) => (
    <div className="flex justify-between items-start bg-[#1A1D1F] p-4 rounded-lg">
      <div className="flex-1">
        <span className="text-white block">{label}</span>
        {description && <span className="text-gray-400 text-sm">{description}</span>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out flex-shrink-0 ${
          checked ? 'bg-blue-600' : 'bg-gray-600'
        }`}
      >
        <div 
          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
            checked ? 'translate-x-6' : 'translate-x-0'
          }`} 
        />
      </button>
    </div>
  );

  const PriorityBadge = ({ priority }: { priority: NotificationPriority }) => {
    const colors = {
      [NotificationPriority.LOW]: 'bg-gray-600',
      [NotificationPriority.MEDIUM]: 'bg-blue-600',
      [NotificationPriority.HIGH]: 'bg-orange-600',
      [NotificationPriority.CRITICAL]: 'bg-red-600'
    };
    
    return (
      <span className={`${colors[priority]} text-white text-xs px-2 py-1 rounded`}>
        {priority}
      </span>
    );
  };

  const notificationTypeLabels = {
    [NotificationType.PAYMENT]: { label: 'Payment Received', icon: 'payments' },
    [NotificationType.TRANSFER]: { label: 'Token Transfer', icon: 'swap_horiz' },
    [NotificationType.CONTRACT]: { label: 'Smart Contract Event', icon: 'description' },
    [NotificationType.BALANCE_CHANGE]: { label: 'Balance Change', icon: 'account_balance_wallet' },
    [NotificationType.TRANSACTION_FAILED]: { label: 'Transaction Failed', icon: 'error' }
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <button 
          onClick={onBack}
          className="text-gray-400 hover:text-white mr-4"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-2xl font-bold text-white">Notification Preferences</h2>
      </div>

      <div className="space-y-6">
        {/* Do Not Disturb */}
        <div>
          <h3 className="text-lg font-semibold text-gray-400 mb-3">Quick Settings</h3>
          <Toggle
            label="Do Not Disturb"
            description="Disable all blockchain notifications"
            checked={preferences.doNotDisturb}
            onChange={toggleDoNotDisturb}
          />
        </div>

        {/* Quiet Hours */}
        <div>
          <h3 className="text-lg font-semibold text-gray-400 mb-3">Quiet Hours</h3>
          <div className="space-y-3">
            <Toggle
              label="Enable Quiet Hours"
              description="Silence notifications during specific times"
              checked={preferences.quietHours.enabled}
              onChange={(enabled) => updateQuietHours({ enabled })}
            />
            
            {preferences.quietHours.enabled && (
              <div className="bg-[#1A1D1F] p-4 rounded-lg space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm block mb-2">Start Time</label>
                    <input
                      type="time"
                      value={preferences.quietHours.startTime}
                      onChange={(e) => updateQuietHours({ startTime: e.target.value })}
                      className="w-full bg-[#0F1011] text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm block mb-2">End Time</label>
                    <input
                      type="time"
                      value={preferences.quietHours.endTime}
                      onChange={(e) => updateQuietHours({ endTime: e.target.value })}
                      className="w-full bg-[#0F1011] text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-gray-400 text-sm block mb-2">Active Days</label>
                  <div className="flex gap-2">
                    {dayLabels.map((day, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          const days = preferences.quietHours.days.includes(index)
                            ? preferences.quietHours.days.filter(d => d !== index)
                            : [...preferences.quietHours.days, index];
                          updateQuietHours({ days });
                        }}
                        className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${
                          preferences.quietHours.days.includes(index)
                            ? 'bg-blue-600 text-white'
                            : 'bg-[#0F1011] text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notification Types */}
        <div>
          <h3 className="text-lg font-semibold text-gray-400 mb-3">Notification Types</h3>
          <div className="space-y-3">
            {Object.values(NotificationType).map((type) => {
              const config = preferences.types[type];
              const { label, icon } = notificationTypeLabels[type];
              
              return (
                <div key={type} className="bg-[#1A1D1F] p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-blue-400">{icon}</span>
                      <div>
                        <span className="text-white block">{label}</span>
                        <PriorityBadge priority={config.priority} />
                      </div>
                    </div>
                    <button
                      onClick={() => updateNotificationType(type, { enabled: !config.enabled })}
                      className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${
                        config.enabled ? 'bg-blue-600' : 'bg-gray-600'
                      }`}
                    >
                      <div 
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                          config.enabled ? 'translate-x-6' : 'translate-x-0'
                        }`} 
                      />
                    </button>
                  </div>
                  
                  {config.enabled && (
                    <div className="ml-9 space-y-2">
                      <div className="flex items-center gap-4 text-sm">
                        <label className="flex items-center gap-2 text-gray-400">
                          <input
                            type="checkbox"
                            checked={config.sound}
                            onChange={(e) => updateNotificationType(type, { sound: e.target.checked })}
                            className="w-4 h-4 rounded bg-[#0F1011] border-gray-700"
                          />
                          Sound
                        </label>
                        <label className="flex items-center gap-2 text-gray-400">
                          <input
                            type="checkbox"
                            checked={config.desktop}
                            onChange={(e) => updateNotificationType(type, { desktop: e.target.checked })}
                            className="w-4 h-4 rounded bg-[#0F1011] border-gray-700"
                          />
                          Desktop
                        </label>
                        <label className="flex items-center gap-2 text-gray-400">
                          <input
                            type="checkbox"
                            checked={config.email}
                            onChange={(e) => updateNotificationType(type, { email: e.target.checked })}
                            className="w-4 h-4 rounded bg-[#0F1011] border-gray-700"
                          />
                          Email
                        </label>
                      </div>
                      
                      <div>
                        <label className="text-gray-400 text-xs block mb-1">Priority Level</label>
                        <select
                          value={config.priority}
                          onChange={(e) => updateNotificationType(type, { priority: e.target.value as NotificationPriority })}
                          className="w-full bg-[#0F1011] text-white px-3 py-1.5 rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-sm"
                        >
                          {Object.values(NotificationPriority).map((priority) => (
                            <option key={priority} value={priority}>{priority}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
