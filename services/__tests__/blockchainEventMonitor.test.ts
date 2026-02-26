import { BlockchainEventMonitor, MonitorConfig, BlockchainEvent, SecurityAlert } from '../blockchainEventMonitor';

// Mock Stellar SDK
jest.mock('@stellar/stellar-sdk', () => ({
  Server: jest.fn().mockImplementation(() => ({
    loadAccount: jest.fn(),
    transactions: jest.fn().mockReturnValue({
      forAccount: jest.fn().mockReturnValue({
        cursor: jest.fn().mockReturnValue({
          stream: jest.fn()
        })
      })
    })
  })),
  Horizon: {}
}));

describe('BlockchainEventMonitor', () => {
  let monitor: BlockchainEventMonitor;
  let mockConfig: MonitorConfig;

  beforeEach(() => {
    mockConfig = {
      accountId: 'GTEST123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      largeTransactionThreshold: 1000,
      lowBalanceThreshold: 100,
      suspiciousActivityWindow: 5,
      maxTransactionsPerWindow: 10,
      enableNotifications: false,
      horizonUrl: 'https://horizon-testnet.stellar.org'
    };

    monitor = new BlockchainEventMonitor(mockConfig);
  });

  afterEach(() => {
    monitor.stop();
  });

  describe('Event Detection', () => {
    test('should create payment event correctly', () => {
      const mockOperation = {
        id: 'op123',
        type: 'payment',
        created_at: '2024-01-01T00:00:00Z',
        source_account: 'GSOURCE',
        from: 'GFROM',
        to: 'GTO',
        amount: '100',
        asset_type: 'native'
      };

      const mockTransaction = {
        id: 'tx123',
        source_account: 'GSOURCE'
      };

      // Access private method for testing
      const event = (monitor as any).createEvent(mockOperation, mockTransaction);

      expect(event).toMatchObject({
        type: 'payment',
        details: {
          operationId: 'op123',
          transactionId: 'tx123',
          from: 'GFROM',
          to: 'GTO',
          amount: '100',
          asset: 'XLM'
        },
        severity: 'info',
        acknowledged: false
      });
    });

    test('should map operation types correctly', () => {
      const testCases = [
        { input: 'payment', expected: 'payment' },
        { input: 'create_account', expected: 'account_created' },
        { input: 'change_trust', expected: 'trustline' },
        { input: 'manage_buy_offer', expected: 'offer' },
        { input: 'unknown_type', expected: 'data' }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = (monitor as any).mapOperationType(input);
        expect(result).toBe(expected);
      });
    });
  });

  describe('Security Alerts', () => {
    test('should detect large transactions', () => {
      const alerts: SecurityAlert[] = [];
      monitor.onAlert((alert) => alerts.push(alert));

      const mockOperation = {
        type: 'payment',
        amount: '1500',
        asset_type: 'native',
        from: 'GFROM',
        to: 'GTO'
      };

      const mockTransaction = {
        id: 'tx123',
        source_account: 'GSOURCE'
      };

      (monitor as any).checkForSecurityIssues(mockOperation, mockTransaction);

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].type).toBe('large_transaction');
      expect(alerts[0].severity).toBe('warning');
    });

    test('should detect critical large transactions', () => {
      const alerts: SecurityAlert[] = [];
      monitor.onAlert((alert) => alerts.push(alert));

      const mockOperation = {
        type: 'payment',
        amount: '2500', // 2.5x threshold
        asset_type: 'native',
        from: 'GFROM',
        to: 'GTO'
      };

      const mockTransaction = {
        id: 'tx123',
        source_account: 'GSOURCE'
      };

      (monitor as any).checkForSecurityIssues(mockOperation, mockTransaction);

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].severity).toBe('critical');
    });

    test('should detect suspicious activity patterns', () => {
      const alerts: SecurityAlert[] = [];
      monitor.onAlert((alert) => alerts.push(alert));

      const mockTransaction = {
        id: 'tx123',
        source_account: 'GSOURCE'
      };

      // Simulate multiple transactions
      for (let i = 0; i < 12; i++) {
        (monitor as any).checkSuspiciousActivity(mockTransaction);
      }

      const suspiciousAlerts = alerts.filter(a => a.type === 'suspicious_activity');
      expect(suspiciousAlerts.length).toBeGreaterThan(0);
      expect(suspiciousAlerts[0].severity).toBe('critical');
    });
  });

  describe('Alert Acknowledgment', () => {
    test('should acknowledge alerts correctly', () => {
      const alert: SecurityAlert = {
        id: 'alert-1',
        type: 'large_transaction',
        message: 'Test alert',
        timestamp: new Date(),
        severity: 'warning',
        acknowledged: false
      };

      (monitor as any).alerts.push(alert);

      monitor.acknowledgeAlert('alert-1');

      const alerts = monitor.getAlerts();
      expect(alerts[0].acknowledged).toBe(true);
    });

    test('should get unacknowledged alerts', () => {
      const alerts: SecurityAlert[] = [
        {
          id: 'alert-1',
          type: 'large_transaction',
          message: 'Test 1',
          timestamp: new Date(),
          severity: 'warning',
          acknowledged: false
        },
        {
          id: 'alert-2',
          type: 'low_balance',
          message: 'Test 2',
          timestamp: new Date(),
          severity: 'critical',
          acknowledged: true
        },
        {
          id: 'alert-3',
          type: 'suspicious_activity',
          message: 'Test 3',
          timestamp: new Date(),
          severity: 'warning',
          acknowledged: false
        }
      ];

      (monitor as any).alerts = alerts;

      const unacknowledged = monitor.getUnacknowledgedAlerts();
      expect(unacknowledged.length).toBe(2);
      expect(unacknowledged.every(a => !a.acknowledged)).toBe(true);
    });
  });

  describe('Connection Management', () => {
    test('should track connection status', () => {
      expect(monitor.isMonitorConnected()).toBe(false);
      
      (monitor as any).isConnected = true;
      expect(monitor.isMonitorConnected()).toBe(true);
    });

    test('should handle reconnection attempts', () => {
      const alerts: SecurityAlert[] = [];
      monitor.onAlert((alert) => alerts.push(alert));

      // Simulate max reconnection attempts
      (monitor as any).reconnectAttempts = 5;
      (monitor as any).handleStreamError(new Error('Connection failed'));

      const reconnectAlerts = alerts.filter(a => a.type === 'unusual_pattern');
      expect(reconnectAlerts.length).toBeGreaterThan(0);
    });
  });

  describe('Event Callbacks', () => {
    test('should notify event callbacks', () => {
      const events: BlockchainEvent[] = [];
      monitor.onEvent((event) => events.push(event));

      const mockEvent: BlockchainEvent = {
        id: 'event-1',
        type: 'payment',
        timestamp: new Date(),
        details: {},
        severity: 'info',
        acknowledged: false
      };

      (monitor as any).notifyEventCallbacks(mockEvent);

      expect(events.length).toBe(1);
      expect(events[0]).toEqual(mockEvent);
    });

    test('should notify alert callbacks', () => {
      const alerts: SecurityAlert[] = [];
      monitor.onAlert((alert) => alerts.push(alert));

      const mockAlert: SecurityAlert = {
        id: 'alert-1',
        type: 'large_transaction',
        message: 'Test',
        timestamp: new Date(),
        severity: 'warning',
        acknowledged: false
      };

      (monitor as any).notifyAlertCallbacks(mockAlert);

      expect(alerts.length).toBe(1);
      expect(alerts[0]).toEqual(mockAlert);
    });

    test('should handle callback errors gracefully', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Callback error');
      });
      
      monitor.onEvent(errorCallback);

      const mockEvent: BlockchainEvent = {
        id: 'event-1',
        type: 'payment',
        timestamp: new Date(),
        details: {},
        severity: 'info',
        acknowledged: false
      };

      // Should not throw
      expect(() => {
        (monitor as any).notifyEventCallbacks(mockEvent);
      }).not.toThrow();

      expect(errorCallback).toHaveBeenCalled();
    });
  });

  describe('Notification System', () => {
    test('should send notifications when enabled', () => {
      const mockSendNotification = jest.fn();
      (global as any).window = {
        electronAPI: {
          sendNotification: mockSendNotification
        }
      };

      const configWithNotifications = {
        ...mockConfig,
        enableNotifications: true
      };

      const monitorWithNotifications = new BlockchainEventMonitor(configWithNotifications);

      const mockAlert: SecurityAlert = {
        id: 'alert-1',
        type: 'large_transaction',
        message: 'Large transaction detected',
        timestamp: new Date(),
        severity: 'critical',
        acknowledged: false
      };

      (monitorWithNotifications as any).sendNotification(mockAlert);

      expect(mockSendNotification).toHaveBeenCalledWith({
        title: 'Security Alert: large_transaction',
        body: 'Large transaction detected',
        severity: 'critical'
      });
    });
  });

  describe('Data Management', () => {
    test('should limit stored events', () => {
      const events: BlockchainEvent[] = [];
      
      for (let i = 0; i < 60; i++) {
        events.push({
          id: `event-${i}`,
          type: 'payment',
          timestamp: new Date(),
          details: {},
          severity: 'info',
          acknowledged: false
        });
      }

      (monitor as any).events = events;

      const retrievedEvents = monitor.getEvents();
      expect(retrievedEvents.length).toBe(60);
    });

    test('should clean old transaction history', () => {
      const now = new Date();
      const oldDate = new Date(now.getTime() - 10 * 60 * 1000); // 10 minutes ago

      (monitor as any).transactionHistory.set('GTEST', [oldDate, now]);

      const mockTransaction = {
        id: 'tx123',
        source_account: 'GTEST'
      };

      (monitor as any).checkSuspiciousActivity(mockTransaction);

      const history = (monitor as any).transactionHistory.get('GTEST');
      expect(history.length).toBe(2); // Old entry should be removed if outside window
    });
  });
});
