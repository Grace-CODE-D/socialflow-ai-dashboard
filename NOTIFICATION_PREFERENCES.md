# Blockchain Notification Preferences

## Overview
Comprehensive notification system for blockchain events with granular control over notification types, priorities, and delivery methods.

## Features Implemented

### 1. Notification Settings UI
- Accessible from Settings → Notification Preferences
- Clean, intuitive interface with toggle switches
- Real-time updates with localStorage persistence

### 2. Notification Types
Five distinct notification categories:
- **Payment Received** - Incoming payment notifications (HIGH priority)
- **Token Transfer** - Token transfer events (MEDIUM priority)
- **Smart Contract Event** - Contract execution notifications (HIGH priority)
- **Balance Change** - Account balance updates (LOW priority)
- **Transaction Failed** - Failed transaction alerts (CRITICAL priority)

### 3. Priority Levels
Four priority levels for each notification type:
- **LOW** - Non-urgent updates
- **MEDIUM** - Standard notifications
- **HIGH** - Important events
- **CRITICAL** - Urgent alerts requiring immediate attention

### 4. Delivery Methods
Each notification type supports three delivery channels:
- **Sound** - Audio notification
- **Desktop** - System desktop notification
- **Email** - Email notification

### 5. Quiet Hours Configuration
- Enable/disable quiet hours
- Set start and end times (24-hour format)
- Select active days (Sunday-Saturday)
- Handles overnight quiet hours (e.g., 22:00-08:00)

### 6. Do Not Disturb Mode
- One-click toggle to disable all blockchain notifications
- Overrides all other notification settings when enabled

## Technical Implementation

### Type Definitions (`types.ts`)
```typescript
enum NotificationType {
  PAYMENT, TRANSFER, CONTRACT, BALANCE_CHANGE, TRANSACTION_FAILED
}

enum NotificationPriority {
  LOW, MEDIUM, HIGH, CRITICAL
}

interface NotificationPreferences {
  doNotDisturb: boolean;
  quietHours: QuietHours;
  types: Record<NotificationType, NotificationTypeConfig>;
}
```

### State Management (`store/blockchainSlice.ts`)
- Separate state management for notification preferences
- localStorage persistence
- Subscription-based updates
- Helper function `shouldShowNotification()` for notification filtering

### Key Functions
- `getNotificationPreferences()` - Get current preferences
- `updateNotificationPreferences()` - Update preferences
- `toggleDoNotDisturb()` - Toggle DND mode
- `updateQuietHours()` - Update quiet hours settings
- `updateNotificationType()` - Update specific notification type config
- `shouldShowNotification()` - Check if notification should be shown
- `subscribeToNotifications()` - Subscribe to preference changes

### UI Component (`components/NotificationPreferences.tsx`)
- Responsive design matching app theme
- Real-time state synchronization
- Intuitive controls for all settings
- Back navigation to main settings

## Usage

### Accessing Notification Preferences
1. Navigate to Settings
2. Click "Notification Preferences"
3. Configure desired settings
4. Changes are saved automatically

### Configuring Quiet Hours
1. Enable "Quiet Hours" toggle
2. Set start and end times
3. Select active days
4. Notifications will be silenced during configured periods

### Setting Notification Priorities
1. Expand any notification type
2. Select priority level from dropdown
3. Choose delivery methods (sound, desktop, email)

### Checking Notification Status
```typescript
import { shouldShowNotification } from './store/blockchainSlice';

if (shouldShowNotification(NotificationType.PAYMENT)) {
  // Show payment notification
}
```

## Default Configuration
- All notification types enabled
- Payment, Contract, Transaction Failed: HIGH/CRITICAL priority
- Token Transfer: MEDIUM priority
- Balance Change: LOW priority
- Quiet Hours: 22:00-08:00 (disabled by default)
- Do Not Disturb: Disabled

## Future Enhancements
- Push notifications for mobile
- Custom notification sounds
- Notification history/log
- Notification grouping
- Snooze functionality
- Per-wallet notification settings
