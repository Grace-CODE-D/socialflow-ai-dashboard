import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BlockchainMonitor } from '../BlockchainMonitor';
import { getMonitorInstance } from '../../services/blockchainEventMonitor';

// Mock the monitor service
jest.mock('../../services/blockchainEventMonitor', () => ({
  getMonitorInstance: jest.fn()
}));

describe('BlockchainMonitor Component', () => {
  let mockMonitor: any;

  beforeEach(() => {
    mockMonitor = {
      onEvent: jest.fn(),
      onAlert: jest.fn(),
      getEvents: jest.fn(() => []),
      getAlerts: jest.fn(() => []),
      isMonitorConnected: jest.fn(() => true),
      acknowledgeAlert: jest.fn()
    };

    (getMonitorInstance as jest.Mock).mockReturnValue(mockMonitor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('should render monitor header', () => {
      render(<BlockchainMonitor />);
      
      expect(screen.getByText('Blockchain Event Monitor')).toBeInTheDocument();
      expect(screen.getByText('Real-time monitoring and security alerts')).toBeInTheDocument();
    });

    test('should show connected status', () => {
      render(<BlockchainMonitor />);
      
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    test('should show disconnected status', () => {
      mockMonitor.isMonitorConnected.mockReturnValue(false);
      
      render(<BlockchainMonitor />);
      
      expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });

    test('should show alert count badge', () => {
      mockMonitor.getAlerts.mockReturnValue([
        {
          id: 'alert-1',
          type: 'large_transaction',
          message: 'Test alert',
          timestamp: new Date(),
          severity: 'warning',
          acknowledged: false
        }
      ]);

      render(<BlockchainMonitor />);
      
      expect(screen.getByText('1 Alert')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    test('should switch between alerts and events tabs', () => {
      render(<BlockchainMonitor />);
      
      const eventsTab = screen.getByText(/Events/);
      fireEvent.click(eventsTab);
      
      expect(screen.getByText('No events recorded yet')).toBeInTheDocument();
    });

    test('should show alerts tab by default', () => {
      render(<BlockchainMonitor />);
      
      expect(screen.getByText('No security alerts')).toBeInTheDocument();
    });
  });

  describe('Alert Display', () => {
    test('should display alerts correctly', () => {
      const mockAlerts = [
        {
          id: 'alert-1',
          type: 'large_transaction',
          message: 'Large transaction detected: 1500 XLM',
          timestamp: new Date('2024-01-01T12:00:00Z'),
          severity: 'warning' as const,
          acknowledged: false
        }
      ];

      mockMonitor.getAlerts.mockReturnValue(mockAlerts);

      render(<BlockchainMonitor />);
      
      expect(screen.getByText('Large transaction detected: 1500 XLM')).toBeInTheDocument();
      expect(screen.getByText('LARGE TRANSACTION')).toBeInTheDocument();
    });

    test('should show acknowledge button for unacknowledged alerts', () => {
      const mockAlerts = [
        {
          id: 'alert-1',
          type: 'large_transaction',
          message: 'Test alert',
          timestamp: new Date(),
          severity: 'warning' as const,
          acknowledged: false
        }
      ];

      mockMonitor.getAlerts.mockReturnValue(mockAlerts);

      render(<BlockchainMonitor />);
      
      expect(screen.getByText('Acknowledge')).toBeInTheDocument();
    });

    test('should hide acknowledge button for acknowledged alerts', () => {
      const mockAlerts = [
        {
          id: 'alert-1',
          type: 'large_transaction',
          message: 'Test alert',
          timestamp: new Date(),
          severity: 'warning' as const,
          acknowledged: true
        }
      ];

      mockMonitor.getAlerts.mockReturnValue(mockAlerts);

      render(<BlockchainMonitor />);
      
      expect(screen.queryByText('Acknowledge')).not.toBeInTheDocument();
    });
  });

  describe('Alert Acknowledgment', () => {
    test('should acknowledge alert when button clicked', async () => {
      const mockAlerts = [
        {
          id: 'alert-1',
          type: 'large_transaction',
          message: 'Test alert',
          timestamp: new Date(),
          severity: 'warning' as const,
          acknowledged: false
        }
      ];

      mockMonitor.getAlerts.mockReturnValue(mockAlerts);

      render(<BlockchainMonitor />);
      
      const acknowledgeButton = screen.getByText('Acknowledge');
      fireEvent.click(acknowledgeButton);

      await waitFor(() => {
        expect(mockMonitor.acknowledgeAlert).toHaveBeenCalledWith('alert-1');
      });
    });
  });

  describe('Event Display', () => {
    test('should display events correctly', () => {
      const mockEvents = [
        {
          id: 'event-1',
          type: 'payment' as const,
          timestamp: new Date('2024-01-01T12:00:00Z'),
          details: {
            from: 'GFROM',
            to: 'GTO',
            amount: '100',
            asset: 'XLM'
          },
          severity: 'info' as const,
          acknowledged: false
        }
      ];

      mockMonitor.getEvents.mockReturnValue(mockEvents);

      render(<BlockchainMonitor />);
      
      const eventsTab = screen.getByText(/Events/);
      fireEvent.click(eventsTab);
      
      expect(screen.getByText('PAYMENT')).toBeInTheDocument();
    });

    test('should show empty state when no events', () => {
      render(<BlockchainMonitor />);
      
      const eventsTab = screen.getByText(/Events/);
      fireEvent.click(eventsTab);
      
      expect(screen.getByText('No events recorded yet')).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    test('should register event callback', () => {
      render(<BlockchainMonitor />);
      
      expect(mockMonitor.onEvent).toHaveBeenCalled();
    });

    test('should register alert callback', () => {
      render(<BlockchainMonitor />);
      
      expect(mockMonitor.onAlert).toHaveBeenCalled();
    });

    test('should update connection status periodically', async () => {
      jest.useFakeTimers();
      
      render(<BlockchainMonitor />);
      
      jest.advanceTimersByTime(1000);
      
      await waitFor(() => {
        expect(mockMonitor.isMonitorConnected).toHaveBeenCalled();
      });
      
      jest.useRealTimers();
    });
  });

  describe('Severity Indicators', () => {
    test('should show warning severity correctly', () => {
      const mockAlerts = [
        {
          id: 'alert-1',
          type: 'low_balance',
          message: 'Low balance warning',
          timestamp: new Date(),
          severity: 'warning' as const,
          acknowledged: false
        }
      ];

      mockMonitor.getAlerts.mockReturnValue(mockAlerts);

      render(<BlockchainMonitor />);
      
      expect(screen.getByText('LOW BALANCE')).toBeInTheDocument();
    });

    test('should show critical severity correctly', () => {
      const mockAlerts = [
        {
          id: 'alert-1',
          type: 'suspicious_activity',
          message: 'Suspicious activity detected',
          timestamp: new Date(),
          severity: 'critical' as const,
          acknowledged: false
        }
      ];

      mockMonitor.getAlerts.mockReturnValue(mockAlerts);

      render(<BlockchainMonitor />);
      
      expect(screen.getByText('SUSPICIOUS ACTIVITY')).toBeInTheDocument();
    });
  });
});
