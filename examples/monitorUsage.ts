/**
 * Blockchain Event Monitor - Usage Examples
 * 
 * This file demonstrates how to use the Blockchain Event Monitor
 * in various scenarios.
 */

import { initializeMonitor, MonitorConfig } from '../services/blockchainEventMonitor';

// Example 1: Basic Setup
export function basicSetup() {
  const config: MonitorConfig = {
    accountId: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    largeTransactionThreshold: 1000,
    lowBalanceThreshold: 100,
    suspiciousActivityWindow: 5,
    maxTransactionsPerWindow: 10,
    enableNotifications: true
  };

  const monitor = initializeMonitor(config);
  
  // Start monitoring
  monitor.start()
    .then(() => console.log('Monitor started successfully'))
    .catch(error => console.error('Failed to start monitor:', error));

  return monitor;
}

// Example 2: Event Handling
export function eventHandling() {
  const monitor = basicSetup();

  // Subscribe to all events
  monitor.onEvent((event) => {
    console.log(`New ${event.type} event:`, event.details);
    
    // Handle specific event types
    switch (event.type) {
      case 'payment':
        console.log(`Payment: ${event.details.amount} ${event.details.asset}`);
        break;
      case 'account_created':
        console.log(`New account created: ${event.details.account}`);
        break;
      case 'trustline':
        console.log(`Trustline modified: ${event.details.asset}`);
        break;
    }
  });

  return monitor;
}

// Example 3: Security Alert Handling
export function securityAlertHandling() {
  const monitor = basicSetup();

  monitor.onAlert((alert) => {
    console.log(`🚨 Security Alert: ${alert.type}`);
    console.log(`Severity: ${alert.severity}`);
    console.log(`Message: ${alert.message}`);

    // Handle different alert types
    switch (alert.type) {
      case 'large_transaction':
        handleLargeTransaction(alert);
        break;
      case 'low_balance':
        handleLowBalance(alert);
        break;
      case 'suspicious_activity':
        handleSuspiciousActivity(alert);
        break;
      case 'unusual_pattern':
        handleUnusualPattern(alert);
        break;
    }
  });

  return monitor;
}

function handleLargeTransaction(alert: any) {
  console.log('Large transaction detected!');
  console.log(`Amount: ${alert.metadata?.amount} XLM`);
  console.log(`From: ${alert.metadata?.from}`);
  console.log(`To: ${alert.metadata?.to}`);
  
  // Send notification to admin
  // Log to audit system
  // Trigger additional verification
}

function handleLowBalance(alert: any) {
  console.log('Low balance warning!');
  console.log(`Current balance: ${alert.metadata?.balance} XLM`);
  console.log(`Threshold: ${alert.metadata?.threshold} XLM`);
  
  // Send notification to fund the account
  // Pause automated operations
  // Alert finance team
}

function handleSuspiciousActivity(alert: any) {
  console.log('Suspicious activity detected!');
  console.log(`Transaction count: ${alert.metadata?.transactionCount}`);
  console.log(`Time window: ${alert.metadata?.windowMinutes} minutes`);
  
  // Freeze account temporarily
  // Require 2FA for next transaction
  // Alert security team
}

function handleUnusualPattern(alert: any) {
  console.log('Unusual pattern detected!');
  
  // Check system health
  // Attempt manual reconnection
  // Alert DevOps team
}

// Example 4: Alert Management
export function alertManagement() {
  const monitor = basicSetup();

  // Get all alerts
  const allAlerts = monitor.getAlerts();
  console.log(`Total alerts: ${allAlerts.length}`);

  // Get unacknowledged alerts
  const pendingAlerts = monitor.getUnacknowledgedAlerts();
  console.log(`Pending alerts: ${pendingAlerts.length}`);

  // Acknowledge alerts
  pendingAlerts.forEach(alert => {
    if (alert.severity === 'warning') {
      // Auto-acknowledge warnings after review
      monitor.acknowledgeAlert(alert.id);
      console.log(`Acknowledged alert: ${alert.id}`);
    }
  });

  return monitor;
}

// Example 5: High-Volume Account Monitoring
export function highVolumeMonitoring() {
  const config: MonitorConfig = {
    accountId: 'GHIGHVOLUME123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    largeTransactionThreshold: 10000, // Higher threshold
    lowBalanceThreshold: 1000,
    suspiciousActivityWindow: 1, // Shorter window
    maxTransactionsPerWindow: 100, // Higher limit
    enableNotifications: true
  };

  const monitor = initializeMonitor(config);
  
  monitor.onEvent((event) => {
    // Log only critical events for high-volume accounts
    if (event.severity === 'critical') {
      console.log('Critical event:', event);
    }
  });

  return monitor;
}

// Example 6: Development/Testing Setup
export function developmentSetup() {
  const config: MonitorConfig = {
    accountId: 'GTESTACCOUNT123456789ABCDEFGHIJKLMNOPQRSTUVW',
    largeTransactionThreshold: 10, // Low threshold for testing
    lowBalanceThreshold: 5,
    suspiciousActivityWindow: 1,
    maxTransactionsPerWindow: 3,
    enableNotifications: false, // Disable notifications in dev
    horizonUrl: 'https://horizon-testnet.stellar.org'
  };

  const monitor = initializeMonitor(config);
  
  // Verbose logging for development
  monitor.onEvent((event) => {
    console.log('[DEV] Event:', JSON.stringify(event, null, 2));
  });

  monitor.onAlert((alert) => {
    console.log('[DEV] Alert:', JSON.stringify(alert, null, 2));
  });

  return monitor;
}

// Example 7: Connection Status Monitoring
export function connectionMonitoring() {
  const monitor = basicSetup();

  // Check connection status periodically
  setInterval(() => {
    const isConnected = monitor.isMonitorConnected();
    console.log(`Monitor status: ${isConnected ? 'Connected' : 'Disconnected'}`);

    if (!isConnected) {
      console.log('Monitor disconnected! Attempting to restart...');
      monitor.stop();
      setTimeout(() => {
        monitor.start().catch(console.error);
      }, 5000);
    }
  }, 10000); // Check every 10 seconds

  return monitor;
}

// Example 8: Multi-Account Monitoring (Future Enhancement)
export function multiAccountSetup() {
  const accounts = [
    'GACCOUNT1XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'GACCOUNT2XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'GACCOUNT3XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
  ];

  const monitors = accounts.map(accountId => {
    const config: MonitorConfig = {
      accountId,
      largeTransactionThreshold: 1000,
      lowBalanceThreshold: 100,
      suspiciousActivityWindow: 5,
      maxTransactionsPerWindow: 10,
      enableNotifications: true
    };

    const monitor = initializeMonitor(config);
    
    monitor.onAlert((alert) => {
      console.log(`Alert for ${accountId}:`, alert.message);
    });

    return monitor;
  });

  // Start all monitors
  Promise.all(monitors.map(m => m.start()))
    .then(() => console.log('All monitors started'))
    .catch(console.error);

  return monitors;
}

// Example 9: Graceful Shutdown
export function gracefulShutdown(monitor: any) {
  // Handle application shutdown
  process.on('SIGINT', () => {
    console.log('Shutting down monitor...');
    monitor.stop();
    console.log('Monitor stopped');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('Shutting down monitor...');
    monitor.stop();
    console.log('Monitor stopped');
    process.exit(0);
  });
}

// Example 10: Custom Alert Filtering
export function customAlertFiltering() {
  const monitor = basicSetup();

  monitor.onAlert((alert) => {
    // Only process critical alerts during business hours
    const hour = new Date().getHours();
    const isBusinessHours = hour >= 9 && hour <= 17;

    if (alert.severity === 'critical' || isBusinessHours) {
      console.log('Processing alert:', alert.message);
      // Send notification
      // Log to system
    } else {
      console.log('Alert queued for business hours:', alert.message);
      // Queue for later processing
    }
  });

  return monitor;
}
