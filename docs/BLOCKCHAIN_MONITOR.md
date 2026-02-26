# Blockchain Event Monitor - Implementation Documentation

## Overview

The Blockchain Event Monitor is a comprehensive security and performance monitoring system for Stellar blockchain accounts. It provides real-time event detection, security alerts, and automated notifications for critical blockchain activities.

## Features

### 1. Event Detection & Filtering
- Real-time monitoring of blockchain transactions
- Support for multiple operation types:
  - Payments
  - Account creation
  - Trustline operations
  - Trading operations
  - Data management
- Event categorization by severity (info, warning, critical)
- Event acknowledgment system

### 2. Security Alerts

#### Large Transaction Detection
- Configurable threshold for large transactions
- Two-tier severity system:
  - Warning: Transactions >= threshold
  - Critical: Transactions >= 2x threshold
- Detailed metadata including amount, sender, and recipient

#### Low Balance Warnings
- Monitors account balance after each transaction
- Configurable low balance threshold
- Critical alerts when balance falls below 50% of threshold
- Helps prevent failed operations due to insufficient funds

#### Suspicious Activity Detection
- Time-window based transaction monitoring
- Configurable transaction rate limits
- Detects unusual patterns:
  - Rapid transaction sequences
  - Abnormal transaction volumes
  - Potential account compromise indicators

#### Unusual Pattern Recognition
- Connection failure monitoring
- Reconnection attempt tracking
- System health alerts

### 3. Alert Acknowledgment System
- Manual acknowledgment of security alerts
- Unacknowledged alert tracking
- Visual indicators for alert status
- Persistent alert history

### 4. IPC Communication
- Secure Electron IPC bridge
- Desktop notifications for critical events
- Whitelisted communication channels
- Context isolation for security

### 5. Reconnection Logic
- Automatic reconnection on stream errors
- Exponential backoff strategy
- Maximum retry limit (5 attempts)
- Connection status monitoring

## Architecture

### Service Layer (`services/blockchainEventMonitor.ts`)

```typescript
class BlockchainEventMonitor {
  // Core monitoring functionality
  start(): Promise<void>
  stop(): void
  
  // Event subscription
  onEvent(callback: (event: BlockchainEvent) => void): void
  onAlert(callback: (alert: SecurityAlert) => void): void
  
  // Data access
  getEvents(): BlockchainEvent[]
  getAlerts(): SecurityAlert[]
  getUnacknowledgedAlerts(): SecurityAlert[]
  
  // Alert management
  acknowledgeAlert(alertId: string): void
  acknowledgeEvent(eventId: string): void
  
  // Status
  isMonitorConnected(): boolean
}
```

### UI Layer (`components/BlockchainMonitor.tsx`)

- Real-time event and alert display
- Tab-based navigation (Alerts / Events)
- Connection status indicator
- Alert acknowledgment interface
- Severity-based visual styling

### IPC Layer

#### Main Process (`electron/main.js`)
- Notification handler
- IPC channel management

#### Preload Script (`electron/preload.js`)
- Context bridge setup
- API exposure to renderer

## Configuration

```typescript
interface MonitorConfig {
  accountId: string;                    // Stellar account to monitor
  largeTransactionThreshold: number;    // XLM threshold for large transactions
  lowBalanceThreshold: number;          // XLM threshold for low balance warnings
  suspiciousActivityWindow: number;     // Time window in minutes
  maxTransactionsPerWindow: number;     // Max transactions in window
  enableNotifications: boolean;         // Enable desktop notifications
  horizonUrl?: string;                  // Horizon server URL (optional)
}
```

### Example Configuration

```typescript
const config: MonitorConfig = {
  accountId: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  largeTransactionThreshold: 1000,      // Alert on transactions >= 1000 XLM
  lowBalanceThreshold: 100,             // Warn when balance < 100 XLM
  suspiciousActivityWindow: 5,          // 5-minute window
  maxTransactionsPerWindow: 10,         // Max 10 transactions per 5 minutes
  enableNotifications: true,
  horizonUrl: 'https://horizon-testnet.stellar.org'
};
```

## Usage

### Initialization

```typescript
import { initializeMonitor } from './services/blockchainEventMonitor';

const monitor = initializeMonitor(config);
await monitor.start();
```

### Event Subscription

```typescript
monitor.onEvent((event) => {
  console.log('New event:', event);
});

monitor.onAlert((alert) => {
  console.log('Security alert:', alert);
});
```

### Alert Management

```typescript
// Get all alerts
const alerts = monitor.getAlerts();

// Get unacknowledged alerts
const pending = monitor.getUnacknowledgedAlerts();

// Acknowledge an alert
monitor.acknowledgeAlert('alert-id');
```

### UI Integration

```tsx
import { BlockchainMonitor } from './components/BlockchainMonitor';

function App() {
  return (
    <div>
      <BlockchainMonitor />
    </div>
  );
}
```

## Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Test Coverage

The implementation includes comprehensive tests for:

1. **Event Detection** (`blockchainEventMonitor.test.ts`)
   - Event creation and mapping
   - Operation type handling
   - Event filtering

2. **Security Alerts** (`blockchainEventMonitor.test.ts`)
   - Large transaction detection
   - Low balance warnings
   - Suspicious activity patterns
   - Alert acknowledgment

3. **IPC Communication** (`ipcCommunication.test.ts`)
   - Notification sending
   - Message passing
   - Error handling

4. **UI Components** (`BlockchainMonitor.test.tsx`)
   - Component rendering
   - Tab navigation
   - Alert display
   - Event display
   - Real-time updates

### Coverage Requirements

- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

## Security Considerations

1. **Context Isolation**: Electron preload script uses context isolation
2. **Channel Whitelisting**: Only approved IPC channels are allowed
3. **No Private Key Access**: Monitor only reads public blockchain data
4. **Rate Limiting**: Built-in protection against API abuse
5. **Error Handling**: Graceful degradation on connection failures

## Performance Optimizations

1. **Event Limiting**: Stores only last 50 events in memory
2. **History Cleanup**: Automatic cleanup of old transaction history
3. **Exponential Backoff**: Prevents rapid reconnection attempts
4. **Callback Error Isolation**: Individual callback failures don't affect others
5. **Efficient Filtering**: Optimized alert and event queries

## Troubleshooting

### Monitor Not Connecting

1. Verify account ID is valid
2. Check Horizon server URL
3. Ensure network connectivity
4. Review console for error messages

### Missing Notifications

1. Verify `enableNotifications` is true
2. Check system notification permissions
3. Ensure Electron app has notification access

### High Memory Usage

1. Monitor stores last 50 events - older events are automatically discarded
2. Consider reducing `suspiciousActivityWindow` if monitoring high-volume accounts
3. Acknowledge alerts regularly to prevent accumulation

## Future Enhancements

1. Persistent storage for events and alerts
2. Configurable event retention policies
3. Advanced pattern recognition (ML-based)
4. Multi-account monitoring
5. Export functionality for audit logs
6. Webhook integration for external alerting
7. Custom alert rules engine

## Dependencies

- `@stellar/stellar-sdk`: Stellar blockchain interaction
- `lucide-react`: UI icons
- `electron`: Desktop application framework
- `jest`: Testing framework
- `ts-jest`: TypeScript support for Jest
- `@testing-library/react`: React component testing

## License

MIT
