# Blockchain Event Monitor - Integration Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This will install:
- `@stellar/stellar-sdk` - Stellar blockchain SDK
- `jest`, `ts-jest` - Testing framework
- `@testing-library/react`, `@testing-library/jest-dom` - React testing utilities

### 2. Initialize the Monitor

In your main application file (e.g., `App.tsx`):

```typescript
import { initializeMonitor, MonitorConfig } from './services/blockchainEventMonitor';
import { BlockchainMonitor } from './components/BlockchainMonitor';

// Configure the monitor
const config: MonitorConfig = {
  accountId: 'YOUR_STELLAR_ACCOUNT_ID',
  largeTransactionThreshold: 1000,
  lowBalanceThreshold: 100,
  suspiciousActivityWindow: 5,
  maxTransactionsPerWindow: 10,
  enableNotifications: true,
  horizonUrl: 'https://horizon-testnet.stellar.org' // or mainnet
};

// Initialize and start
const monitor = initializeMonitor(config);
monitor.start();
```

### 3. Add UI Component

Add the `BlockchainMonitor` component to your application:

```tsx
import { BlockchainMonitor } from './components/BlockchainMonitor';

function App() {
  return (
    <div>
      {/* Your other components */}
      <BlockchainMonitor />
    </div>
  );
}
```

### 4. Add to Navigation (Optional)

If you have a sidebar navigation, add the monitor view:

```typescript
// In types.ts
export enum View {
  DASHBOARD = 'DASHBOARD',
  BLOCKCHAIN_MONITOR = 'BLOCKCHAIN_MONITOR',
  // ... other views
}

// In your navigation component
import { Activity } from 'lucide-react';

const navItems = [
  // ... other items
  {
    id: View.BLOCKCHAIN_MONITOR,
    label: 'Blockchain Monitor',
    icon: <Activity className="w-5 h-5" />
  }
];
```

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run in watch mode (for development)
npm run test:watch
```

## Configuration Options

### MonitorConfig

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `accountId` | string | Stellar account ID to monitor | Required |
| `largeTransactionThreshold` | number | XLM amount to trigger large transaction alert | Required |
| `lowBalanceThreshold` | number | XLM amount to trigger low balance warning | Required |
| `suspiciousActivityWindow` | number | Time window in minutes for activity monitoring | Required |
| `maxTransactionsPerWindow` | number | Max transactions allowed in window | Required |
| `enableNotifications` | boolean | Enable desktop notifications | Required |
| `horizonUrl` | string | Horizon server URL | 'https://horizon-testnet.stellar.org' |

### Recommended Settings

#### Production Environment
```typescript
{
  largeTransactionThreshold: 10000,
  lowBalanceThreshold: 1000,
  suspiciousActivityWindow: 5,
  maxTransactionsPerWindow: 20,
  enableNotifications: true,
  horizonUrl: 'https://horizon.stellar.org'
}
```

#### Development/Testing
```typescript
{
  largeTransactionThreshold: 10,
  lowBalanceThreshold: 5,
  suspiciousActivityWindow: 1,
  maxTransactionsPerWindow: 5,
  enableNotifications: false,
  horizonUrl: 'https://horizon-testnet.stellar.org'
}
```

## Event Handling

### Subscribe to Events

```typescript
import { getMonitorInstance } from './services/blockchainEventMonitor';

const monitor = getMonitorInstance();

monitor?.onEvent((event) => {
  console.log('New event:', event);
  
  // Custom handling
  if (event.type === 'payment') {
    updatePaymentDashboard(event.details);
  }
});
```

### Subscribe to Alerts

```typescript
monitor?.onAlert((alert) => {
  console.log('Security alert:', alert);
  
  // Custom handling
  if (alert.severity === 'critical') {
    sendEmailToAdmin(alert);
  }
});
```

## Troubleshooting

### Issue: Monitor not connecting

**Solution:**
1. Verify the account ID is valid
2. Check network connectivity
3. Ensure Horizon URL is correct
4. Check browser console for errors

```typescript
monitor.start()
  .then(() => console.log('Connected'))
  .catch(error => console.error('Connection failed:', error));
```

### Issue: No notifications appearing

**Solution:**
1. Verify `enableNotifications` is `true`
2. Check system notification permissions
3. Ensure Electron app has notification access
4. Test with a simple notification:

```typescript
window.electronAPI?.sendNotification({
  title: 'Test',
  body: 'Testing notifications',
  severity: 'warning'
});
```

### Issue: Tests failing

**Solution:**
1. Ensure all dependencies are installed: `npm install`
2. Clear Jest cache: `npx jest --clearCache`
3. Check for TypeScript errors: `npx tsc --noEmit`
4. Run tests with verbose output: `npm test -- --verbose`

### Issue: High memory usage

**Solution:**
1. The monitor stores only the last 50 events
2. Acknowledge alerts regularly to prevent accumulation
3. Consider reducing `suspiciousActivityWindow` for high-volume accounts
4. Monitor connection status and restart if needed

## Best Practices

### 1. Error Handling

Always wrap monitor operations in try-catch blocks:

```typescript
try {
  await monitor.start();
} catch (error) {
  console.error('Failed to start monitor:', error);
  // Fallback logic
}
```

### 2. Graceful Shutdown

Stop the monitor when the application closes:

```typescript
useEffect(() => {
  return () => {
    monitor?.stop();
  };
}, []);
```

### 3. Alert Management

Regularly acknowledge processed alerts:

```typescript
const processAlerts = () => {
  const alerts = monitor.getUnacknowledgedAlerts();
  
  alerts.forEach(alert => {
    // Process alert
    handleAlert(alert);
    
    // Acknowledge after processing
    monitor.acknowledgeAlert(alert.id);
  });
};
```

### 4. Connection Monitoring

Monitor connection status and handle disconnections:

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    if (!monitor.isMonitorConnected()) {
      console.warn('Monitor disconnected');
      // Show UI warning
      // Attempt reconnection
    }
  }, 5000);
  
  return () => clearInterval(interval);
}, []);
```

## Advanced Usage

### Custom Alert Rules

Extend the monitor with custom alert logic:

```typescript
monitor.onEvent((event) => {
  // Custom rule: Alert on payments to specific address
  if (event.type === 'payment' && 
      event.details.to === 'GSPECIALADDRESS...') {
    // Trigger custom alert
    notifySpecialPayment(event);
  }
});
```

### Integration with Analytics

Send events to analytics platform:

```typescript
monitor.onEvent((event) => {
  analytics.track('blockchain_event', {
    type: event.type,
    timestamp: event.timestamp,
    severity: event.severity
  });
});
```

### Webhook Integration

Forward alerts to external systems:

```typescript
monitor.onAlert(async (alert) => {
  if (alert.severity === 'critical') {
    await fetch('https://your-webhook-url.com/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert)
    });
  }
});
```

## Performance Considerations

1. **Event Limiting**: Monitor stores max 50 events in memory
2. **Efficient Queries**: Use `getUnacknowledgedAlerts()` instead of filtering all alerts
3. **Callback Optimization**: Keep event/alert callbacks lightweight
4. **Reconnection Strategy**: Exponential backoff prevents API abuse
5. **Memory Management**: Old transaction history is automatically cleaned

## Security Considerations

1. **No Private Keys**: Monitor only reads public blockchain data
2. **Context Isolation**: Electron preload uses context isolation
3. **Channel Whitelisting**: Only approved IPC channels allowed
4. **Rate Limiting**: Built-in protection against API abuse
5. **Error Isolation**: Individual callback failures don't affect others

## Next Steps

1. Review the [full documentation](./BLOCKCHAIN_MONITOR.md)
2. Check out [usage examples](../examples/monitorUsage.ts)
3. Run the test suite to verify installation
4. Configure alerts for your specific use case
5. Integrate with your existing dashboard

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review test files for usage examples
3. Consult the main documentation
4. Check console logs for detailed error messages
