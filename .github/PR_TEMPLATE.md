## Issue #301.2-301.5: Blockchain Event Monitor - Notification Preferences

### Description
Implements comprehensive notification preferences system for blockchain events with granular control over notification types, priorities, delivery methods, quiet hours, and do-not-disturb mode.

### Changes Made

#### 1. Type Definitions (`types.ts`)
- Added `NotificationType` enum (PAYMENT, TRANSFER, CONTRACT, BALANCE_CHANGE, TRANSACTION_FAILED)
- Added `NotificationPriority` enum (LOW, MEDIUM, HIGH, CRITICAL)
- Added `NotificationTypeConfig` interface for per-type settings
- Added `QuietHours` interface for time-based notification control
- Added `NotificationPreferences` interface for complete preference state

#### 2. State Management (`store/blockchainSlice.ts`)
- Implemented notification preferences state with default configuration
- Added localStorage persistence for preferences
- Created subscription system for preference updates
- Implemented key functions:
  - `getNotificationPreferences()` - Get current preferences
  - `updateNotificationPreferences()` - Update preferences
  - `toggleDoNotDisturb()` - Toggle DND mode
  - `updateQuietHours()` - Configure quiet hours
  - `updateNotificationType()` - Configure specific notification type
  - `shouldShowNotification()` - Smart notification filtering logic
  - `subscribeToNotifications()` - Subscribe to preference changes

#### 3. UI Component (`components/NotificationPreferences.tsx`)
- Created comprehensive notification settings interface
- Features:
  - Do Not Disturb toggle
  - Quiet Hours configuration (time range + day selection)
  - Per-notification-type settings with:
    - Enable/disable toggle
    - Priority level selector
    - Delivery method checkboxes (sound, desktop, email)
  - Visual priority badges
  - Material icons for notification types
  - Responsive design matching app theme

#### 4. Settings Integration (`components/Settings.tsx`)
- Added navigation to Notification Preferences
- Integrated NotificationPreferences component
- Maintained existing settings structure

#### 5. Documentation (`NOTIFICATION_PREFERENCES.md`)
- Comprehensive feature documentation
- Usage examples
- Technical implementation details
- Default configuration reference

### Features Implemented

✅ Notification Settings UI  
✅ Configure notification types (payment, transfer, contract, balance change, transaction failed)  
✅ Set notification priority levels (LOW, MEDIUM, HIGH, CRITICAL)  
✅ Add quiet hours configuration (time range + day selection)  
✅ Implement do-not-disturb mode  
✅ Delivery method configuration (sound, desktop, email)  
✅ localStorage persistence  
✅ Real-time state synchronization  

### Testing Checklist
- [ ] Navigate to Settings → Notification Preferences
- [ ] Toggle Do Not Disturb mode
- [ ] Configure quiet hours with different time ranges
- [ ] Select/deselect active days for quiet hours
- [ ] Enable/disable individual notification types
- [ ] Change priority levels for notification types
- [ ] Toggle delivery methods (sound, desktop, email)
- [ ] Verify settings persist after page reload
- [ ] Test `shouldShowNotification()` logic with different configurations

### Screenshots
The UI includes:
- Clean toggle switches for quick settings
- Time pickers for quiet hours
- Day selector buttons
- Expandable notification type cards
- Priority badges with color coding
- Delivery method checkboxes
- Material icons for visual clarity

### Default Configuration
- All notification types: Enabled
- Payment notifications: HIGH priority, all delivery methods
- Transfer notifications: MEDIUM priority, sound + desktop
- Contract notifications: HIGH priority, all delivery methods
- Balance change: LOW priority, desktop only
- Transaction failed: CRITICAL priority, all delivery methods
- Quiet hours: 22:00-08:00 (disabled by default)
- Do Not Disturb: Disabled

### Technical Notes
- Uses subscription pattern for reactive updates
- Smart notification filtering based on DND, quiet hours, and type settings
- Handles overnight quiet hours correctly (e.g., 22:00-08:00)
- Type-safe implementation with TypeScript
- Minimal dependencies (React hooks only)

### Related Issues
Closes #301.2, #301.3, #301.4, #301.5

### Target Branch
`develop`
