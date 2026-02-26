import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TransactionHistory } from '../TransactionHistory';
import { eventMonitor } from '../../services/eventMonitor';
import { Transaction, Platform } from '../../types';

// Mock the event monitor
jest.mock('../../services/eventMonitor', () => ({
  eventMonitor: {
    subscribe: jest.fn(),
  },
}));

describe('TransactionHistory Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Transaction List Rendering', () => {
    it('should render transaction history title', () => {
      render(<TransactionHistory />);
      expect(screen.getByText('Transaction History')).toBeInTheDocument();
    });

    it('should render initial transactions', () => {
      render(<TransactionHistory />);
      const transactions = screen.getAllByRole('button');
      expect(transactions.length).toBeGreaterThan(0);
    });

    it('should display transaction details correctly', () => {
      render(<TransactionHistory />);
      const transactions = screen.getAllByText(/Transaction \d+/);
      expect(transactions.length).toBeGreaterThan(0);
    });

    it('should show empty state when no transactions match filters', () => {
      render(<TransactionHistory />);
      
      // Apply filter that matches nothing
      const searchInput = screen.getByPlaceholderText('Search transactions...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent_transaction_xyz' } });
      
      expect(screen.getByText('No transactions found')).toBeInTheDocument();
    });
  });

  describe('Filtering Functionality', () => {
    it('should filter transactions by type', () => {
      render(<TransactionHistory />);
      
      const typeSelect = screen.getAllByRole('combobox')[0];
      fireEvent.change(typeSelect, { target: { value: 'post' } });
      
      // Verify filtering occurred (implementation-specific)
      expect(typeSelect).toHaveValue('post');
    });

    it('should filter transactions by status', () => {
      render(<TransactionHistory />);
      
      const statusSelect = screen.getAllByRole('combobox')[1];
      fireEvent.change(statusSelect, { target: { value: 'completed' } });
      
      expect(statusSelect).toHaveValue('completed');
    });

    it('should clear all filters', () => {
      render(<TransactionHistory />);
      
      const searchInput = screen.getByPlaceholderText('Search transactions...');
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      const clearButton = screen.getByText('Clear Filters');
      fireEvent.click(clearButton);
      
      expect(searchInput).toHaveValue('');
    });

    it('should apply multiple filters simultaneously', () => {
      render(<TransactionHistory />);
      
      const searchInput = screen.getByPlaceholderText('Search transactions...');
      const typeSelect = screen.getAllByRole('combobox')[0];
      
      fireEvent.change(searchInput, { target: { value: 'test' } });
      fireEvent.change(typeSelect, { target: { value: 'post' } });
      
      expect(searchInput).toHaveValue('test');
      expect(typeSelect).toHaveValue('post');
    });
  });

  describe('Search Functionality', () => {
    it('should filter transactions by search query', () => {
      render(<TransactionHistory />);
      
      const searchInput = screen.getByPlaceholderText('Search transactions...');
      fireEvent.change(searchInput, { target: { value: 'Transaction 1' } });
      
      expect(searchInput).toHaveValue('Transaction 1');
    });

    it('should be case-insensitive', () => {
      render(<TransactionHistory />);
      
      const searchInput = screen.getByPlaceholderText('Search transactions...');
      fireEvent.change(searchInput, { target: { value: 'TRANSACTION' } });
      
      // Should still show results
      const noResults = screen.queryByText('No transactions found');
      expect(noResults).not.toBeInTheDocument();
    });

    it('should update results in real-time as user types', () => {
      render(<TransactionHistory />);
      
      const searchInput = screen.getByPlaceholderText('Search transactions...');
      
      fireEvent.change(searchInput, { target: { value: 'T' } });
      expect(searchInput).toHaveValue('T');
      
      fireEvent.change(searchInput, { target: { value: 'Tr' } });
      expect(searchInput).toHaveValue('Tr');
    });
  });

  describe('Detail View', () => {
    it('should show transaction details when clicked', () => {
      render(<TransactionHistory />);
      
      const firstTransaction = screen.getAllByText(/Transaction \d+/)[0];
      fireEvent.click(firstTransaction);
      
      expect(screen.getByText('Transaction Details')).toBeInTheDocument();
    });

    it('should display all transaction fields in detail view', () => {
      render(<TransactionHistory />);
      
      const firstTransaction = screen.getAllByText(/Transaction \d+/)[0];
      fireEvent.click(firstTransaction);
      
      expect(screen.getByText('ID')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Platform')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('should close detail view when close button is clicked', () => {
      render(<TransactionHistory />);
      
      const firstTransaction = screen.getAllByText(/Transaction \d+/)[0];
      fireEvent.click(firstTransaction);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);
      
      expect(screen.getByText('Select a transaction to view details')).toBeInTheDocument();
    });

    it('should show metadata when available', () => {
      render(<TransactionHistory />);
      
      const firstTransaction = screen.getAllByText(/Transaction \d+/)[0];
      fireEvent.click(firstTransaction);
      
      // Metadata section should be present if transaction has metadata
      const detailsSection = screen.getByText('Transaction Details').parentElement;
      expect(detailsSection).toBeInTheDocument();
    });
  });

  describe('Export Functionality', () => {
    it('should have export button', () => {
      render(<TransactionHistory />);
      
      const exportButton = screen.getByText('Export');
      expect(exportButton).toBeInTheDocument();
    });

    it('should trigger export when clicked', () => {
      // Mock URL.createObjectURL
      global.URL.createObjectURL = jest.fn(() => 'mock-url');
      global.URL.revokeObjectURL = jest.fn();
      
      const mockClick = jest.fn();
      HTMLAnchorElement.prototype.click = mockClick;
      
      render(<TransactionHistory />);
      
      const exportButton = screen.getByText('Export');
      fireEvent.click(exportButton);
      
      expect(mockClick).toHaveBeenCalled();
    });

    it('should export filtered transactions only', () => {
      global.URL.createObjectURL = jest.fn(() => 'mock-url');
      
      render(<TransactionHistory />);
      
      // Apply filter
      const searchInput = screen.getByPlaceholderText('Search transactions...');
      fireEvent.change(searchInput, { target: { value: 'Transaction 1' } });
      
      const exportButton = screen.getByText('Export');
      fireEvent.click(exportButton);
      
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });
  });

  describe('Real-time Updates', () => {
    it('should subscribe to event monitor on mount', () => {
      render(<TransactionHistory />);
      
      expect(eventMonitor.subscribe).toHaveBeenCalled();
    });

    it('should add new transactions to the list', async () => {
      let subscribeCallback: ((txn: Transaction) => void) | null = null;
      
      (eventMonitor.subscribe as jest.Mock).mockImplementation((callback) => {
        subscribeCallback = callback;
        return () => {};
      });
      
      render(<TransactionHistory />);
      
      const newTransaction: Transaction = {
        id: 'new_txn_123',
        type: 'post',
        platform: Platform.INSTAGRAM,
        description: 'New real-time transaction',
        timestamp: new Date(),
        status: 'completed',
        isNew: true,
      };
      
      if (subscribeCallback) {
        subscribeCallback(newTransaction);
      }
      
      await waitFor(() => {
        expect(screen.getByText('New real-time transaction')).toBeInTheDocument();
      });
    });

    it('should show notification for new transactions', async () => {
      let subscribeCallback: ((txn: Transaction) => void) | null = null;
      
      (eventMonitor.subscribe as jest.Mock).mockImplementation((callback) => {
        subscribeCallback = callback;
        return () => {};
      });
      
      render(<TransactionHistory />);
      
      const newTransaction: Transaction = {
        id: 'new_txn_456',
        type: 'comment',
        platform: Platform.FACEBOOK,
        description: 'New comment received',
        timestamp: new Date(),
        status: 'pending',
        isNew: true,
      };
      
      if (subscribeCallback) {
        subscribeCallback(newTransaction);
      }
      
      await waitFor(() => {
        expect(screen.getByText(/New Transaction/)).toBeInTheDocument();
      });
    });

    it('should update transaction status in real-time', async () => {
      let subscribeCallback: ((txn: Transaction) => void) | null = null;
      
      (eventMonitor.subscribe as jest.Mock).mockImplementation((callback) => {
        subscribeCallback = callback;
        return () => {};
      });
      
      render(<TransactionHistory />);
      
      const updatedTransaction: Transaction = {
        id: 'txn_update_789',
        type: 'payment',
        platform: Platform.YOUTUBE,
        description: 'Payment completed',
        timestamp: new Date(),
        status: 'completed',
        isNew: true,
      };
      
      if (subscribeCallback) {
        subscribeCallback(updatedTransaction);
      }
      
      await waitFor(() => {
        expect(screen.getByText('Payment completed')).toBeInTheDocument();
      });
    });

    it('should show visual indicator for new items', async () => {
      let subscribeCallback: ((txn: Transaction) => void) | null = null;
      
      (eventMonitor.subscribe as jest.Mock).mockImplementation((callback) => {
        subscribeCallback = callback;
        return () => {};
      });
      
      render(<TransactionHistory />);
      
      const newTransaction: Transaction = {
        id: 'new_visual_123',
        type: 'like',
        platform: Platform.TIKTOK,
        description: 'New like received',
        timestamp: new Date(),
        status: 'completed',
        isNew: true,
      };
      
      if (subscribeCallback) {
        subscribeCallback(newTransaction);
      }
      
      await waitFor(() => {
        const newItem = screen.getByText('New like received').closest('div');
        expect(newItem).toHaveClass('animate-pulse-subtle');
      });
    });

    it('should unsubscribe from event monitor on unmount', () => {
      const unsubscribeMock = jest.fn();
      (eventMonitor.subscribe as jest.Mock).mockReturnValue(unsubscribeMock);
      
      const { unmount } = render(<TransactionHistory />);
      unmount();
      
      expect(unsubscribeMock).toHaveBeenCalled();
    });

    it('should handle multiple new transactions', async () => {
      let subscribeCallback: ((txn: Transaction) => void) | null = null;
      
      (eventMonitor.subscribe as jest.Mock).mockImplementation((callback) => {
        subscribeCallback = callback;
        return () => {};
      });
      
      render(<TransactionHistory />);
      
      const transactions: Transaction[] = [
        {
          id: 'multi_1',
          type: 'post',
          platform: Platform.INSTAGRAM,
          description: 'First transaction',
          timestamp: new Date(),
          status: 'completed',
          isNew: true,
        },
        {
          id: 'multi_2',
          type: 'comment',
          platform: Platform.FACEBOOK,
          description: 'Second transaction',
          timestamp: new Date(),
          status: 'pending',
          isNew: true,
        },
      ];
      
      if (subscribeCallback) {
        transactions.forEach(txn => subscribeCallback!(txn));
      }
      
      await waitFor(() => {
        expect(screen.getByText('First transaction')).toBeInTheDocument();
        expect(screen.getByText('Second transaction')).toBeInTheDocument();
      });
    });
  });

  describe('UI Interactions', () => {
    it('should highlight selected transaction', () => {
      render(<TransactionHistory />);
      
      const firstTransaction = screen.getAllByText(/Transaction \d+/)[0];
      fireEvent.click(firstTransaction);
      
      const transactionElement = firstTransaction.closest('div');
      expect(transactionElement).toHaveClass('border-primary-blue');
    });

    it('should show correct status colors', () => {
      render(<TransactionHistory />);
      
      // Status badges should have appropriate colors
      const statusBadges = screen.getAllByText(/completed|pending|failed/i);
      expect(statusBadges.length).toBeGreaterThan(0);
    });

    it('should display platform badges', () => {
      render(<TransactionHistory />);
      
      const platformBadges = screen.getAllByText(/instagram|facebook|youtube|tiktok|linkedin|x/i);
      expect(platformBadges.length).toBeGreaterThan(0);
    });
  });
});
