import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TransactionDebugger } from '../../../components/debug/TransactionDebugger';
import { 
  createTransaction, 
  ScenarioBuilder,
  mockTransactionDebugger,
  setupMocks,
  cleanupMocks,
  testUtils
} from '../../../utils/testing';

// Mock the transaction debugger service
jest.mock('../../../services/transactionDebugger', () => ({
  transactionDebugger: mockTransactionDebugger
}));

describe('TransactionDebugger Component', () => {
  beforeEach(() => {
    setupMocks();
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanupMocks();
  });

  it('should render without crashing', () => {
    render(<TransactionDebugger />);
    
    expect(screen.getByText('Transaction Debugger')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search transactions...')).toBeInTheDocument();
  });

  it('should display transactions from the service', async () => {
    const mockTransactions = [
      {
        transaction: createTransaction().asPost().asCompleted().build(),
        debugData: {
          executionTime: 150,
          memoryUsage: 45,
          apiCalls: ['POST /api/v1/posts'],
          errors: [],
          warnings: [],
          performance: {
            startTime: 1000,
            endTime: 1150,
            duration: 150,
            steps: [
              { name: 'Initialize', duration: 50, timestamp: 1050 },
              { name: 'Validate', duration: 100, timestamp: 1150 }
            ]
          }
        }
      }
    ];

    mockTransactionDebugger.getDebuggedTransactions.mockReturnValue(mockTransactions);

    render(<TransactionDebugger />);

    expect(screen.getByText('Transactions (1)')).toBeInTheDocument();
    expect(screen.getByText('post')).toBeInTheDocument();
    expect(screen.getByText('150.0ms')).toBeInTheDocument();
  });

  it('should filter transactions by search term', async () => {
    const mockTransactions = [
      {
        transaction: createTransaction().withDescription('Payment processed').build(),
        debugData: { executionTime: 100, memoryUsage: 30, apiCalls: [], errors: [], warnings: [], performance: { startTime: 0, endTime: 100, duration: 100, steps: [] } }
      },
      {
        transaction: createTransaction().withDescription('Post published').build(),
        debugData: { executionTime: 200, memoryUsage: 40, apiCalls: [], errors: [], warnings: [], performance: { startTime: 0, endTime: 200, duration: 200, steps: [] } }
      }
    ];

    mockTransactionDebugger.getDebuggedTransactions.mockReturnValue(mockTransactions);

    render(<TransactionDebugger />);

    const searchInput = screen.getByPlaceholderText('Search transactions...');
    fireEvent.change(searchInput, { target: { value: 'payment' } });

    await waitFor(() => {
      expect(screen.getByText('Payment processed')).toBeInTheDocument();
      expect(screen.queryByText('Post published')).not.toBeInTheDocument();
    });
  });

  it('should filter transactions by status', async () => {
    const mockTransactions = [
      {
        transaction: createTransaction().asCompleted().build(),
        debugData: { executionTime: 100, memoryUsage: 30, apiCalls: [], errors: [], warnings: [], performance: { startTime: 0, endTime: 100, duration: 100, steps: [] } }
      },
      {
        transaction: createTransaction().asFailed().build(),
        debugData: { executionTime: 200, memoryUsage: 40, apiCalls: [], errors: ['Network error'], warnings: [], performance: { startTime: 0, endTime: 200, duration: 200, steps: [] } }
      }
    ];

    mockTransactionDebugger.getDebuggedTransactions.mockReturnValue(mockTransactions);

    render(<TransactionDebugger />);

    const statusFilter = screen.getByDisplayValue('All Status');
    fireEvent.change(statusFilter, { target: { value: 'failed' } });

    await waitFor(() => {
      expect(screen.getByText('Transactions (1)')).toBeInTheDocument();
    });
  });

  it('should display transaction details when selected', async () => {
    const mockTransaction = {
      transaction: createTransaction().asPost().asCompleted().build(),
      debugData: {
        executionTime: 150,
        memoryUsage: 45,
        apiCalls: ['POST /api/v1/posts'],
        errors: [],
        warnings: ['Rate limit approaching'],
        performance: {
          startTime: 1000,
          endTime: 1150,
          duration: 150,
          steps: [
            { name: 'Initialize', duration: 50, timestamp: 1050 },
            { name: 'Validate Input', duration: 100, timestamp: 1150 }
          ]
        }
      }
    };

    mockTransactionDebugger.getDebuggedTransactions.mockReturnValue([mockTransaction]);

    render(<TransactionDebugger />);

    // Click on the transaction
    const transactionItem = screen.getByText('post');
    fireEvent.click(transactionItem);

    await waitFor(() => {
      expect(screen.getByText('Debug Details')).toBeInTheDocument();
      expect(screen.getByText('Performance')).toBeInTheDocument();
      expect(screen.getByText('150.0ms')).toBeInTheDocument();
      expect(screen.getByText('45MB')).toBeInTheDocument();
    });
  });

  it('should display execution steps', async () => {
    const mockTransaction = {
      transaction: createTransaction().build(),
      debugData: {
        executionTime: 150,
        memoryUsage: 45,
        apiCalls: [],
        errors: [],
        warnings: [],
        performance: {
          startTime: 1000,
          endTime: 1150,
          duration: 150,
          steps: [
            { name: 'Initialize', duration: 50, timestamp: 1050 },
            { name: 'Validate Input', duration: 100, timestamp: 1150 }
          ]
        }
      }
    };

    mockTransactionDebugger.getDebuggedTransactions.mockReturnValue([mockTransaction]);

    render(<TransactionDebugger />);

    // Select the transaction
    fireEvent.click(screen.getByText('post'));

    await waitFor(() => {
      expect(screen.getByText('Execution Steps')).toBeInTheDocument();
      expect(screen.getByText('Initialize')).toBeInTheDocument();
      expect(screen.getByText('Validate Input')).toBeInTheDocument();
      expect(screen.getByText('50.0ms')).toBeInTheDocument();
      expect(screen.getByText('100.0ms')).toBeInTheDocument();
    });
  });

  it('should display API calls', async () => {
    const mockTransaction = {
      transaction: createTransaction().build(),
      debugData: {
        executionTime: 150,
        memoryUsage: 45,
        apiCalls: ['POST /api/v1/posts', 'GET /api/v1/users/123'],
        errors: [],
        warnings: [],
        performance: { startTime: 0, endTime: 150, duration: 150, steps: [] }
      }
    };

    mockTransactionDebugger.getDebuggedTransactions.mockReturnValue([mockTransaction]);

    render(<TransactionDebugger />);

    fireEvent.click(screen.getByText('post'));

    await waitFor(() => {
      expect(screen.getByText('API Calls')).toBeInTheDocument();
      expect(screen.getByText(/POST \/api\/v1\/posts/)).toBeInTheDocument();
      expect(screen.getByText(/GET \/api\/v1\/users\/123/)).toBeInTheDocument();
    });
  });

  it('should display warnings', async () => {
    const mockTransaction = {
      transaction: createTransaction().build(),
      debugData: {
        executionTime: 150,
        memoryUsage: 45,
        apiCalls: [],
        errors: [],
        warnings: ['Rate limit approaching', 'Large payload detected'],
        performance: { startTime: 0, endTime: 150, duration: 150, steps: [] }
      }
    };

    mockTransactionDebugger.getDebuggedTransactions.mockReturnValue([mockTransaction]);

    render(<TransactionDebugger />);

    fireEvent.click(screen.getByText('post'));

    await waitFor(() => {
      expect(screen.getByText('Warnings')).toBeInTheDocument();
      expect(screen.getByText('Rate limit approaching')).toBeInTheDocument();
      expect(screen.getByText('Large payload detected')).toBeInTheDocument();
    });
  });

  it('should display errors', async () => {
    const mockTransaction = {
      transaction: createTransaction().asFailed().build(),
      debugData: {
        executionTime: 150,
        memoryUsage: 45,
        apiCalls: [],
        errors: ['Network timeout', 'Authentication failed'],
        warnings: [],
        performance: { startTime: 0, endTime: 150, duration: 150, steps: [] }
      }
    };

    mockTransactionDebugger.getDebuggedTransactions.mockReturnValue([mockTransaction]);

    render(<TransactionDebugger />);

    fireEvent.click(screen.getByText('post'));

    await waitFor(() => {
      expect(screen.getByText('Errors')).toBeInTheDocument();
      expect(screen.getByText('Network timeout')).toBeInTheDocument();
      expect(screen.getByText('Authentication failed')).toBeInTheDocument();
    });
  });

  it('should display stack trace for failed transactions', async () => {
    const stackTrace = `Error: Transaction failed
    at processTransaction (transaction.service.ts:45:12)
    at handleRequest (api.controller.ts:123:8)`;

    const mockTransaction = {
      transaction: createTransaction().asFailed().build(),
      debugData: {
        executionTime: 150,
        memoryUsage: 45,
        apiCalls: [],
        errors: ['Transaction failed'],
        warnings: [],
        stackTrace,
        performance: { startTime: 0, endTime: 150, duration: 150, steps: [] }
      }
    };

    mockTransactionDebugger.getDebuggedTransactions.mockReturnValue([mockTransaction]);

    render(<TransactionDebugger />);

    fireEvent.click(screen.getByText('post'));

    await waitFor(() => {
      expect(screen.getByText('Stack Trace')).toBeInTheDocument();
      expect(screen.getByText(/Error: Transaction failed/)).toBeInTheDocument();
    });
  });

  it('should clear debug data when clear button is clicked', async () => {
    render(<TransactionDebugger />);

    const clearButton = screen.getByText('Clear');
    fireEvent.click(clearButton);

    expect(mockTransactionDebugger.clearDebugData).toHaveBeenCalled();
  });

  it('should handle empty state', () => {
    mockTransactionDebugger.getDebuggedTransactions.mockReturnValue([]);

    render(<TransactionDebugger />);

    expect(screen.getByText('Transactions (0)')).toBeInTheDocument();
    expect(screen.getByText('Select a transaction to view debug details')).toBeInTheDocument();
  });

  it('should subscribe to transaction debugger on mount', () => {
    render(<TransactionDebugger />);

    expect(mockTransactionDebugger.subscribe).toHaveBeenCalled();
  });

  it('should unsubscribe on unmount', () => {
    const unsubscribeMock = jest.fn();
    mockTransactionDebugger.subscribe.mockReturnValue(unsubscribeMock);

    const { unmount } = render(<TransactionDebugger />);
    unmount();

    expect(unsubscribeMock).toHaveBeenCalled();
  });

  it('should handle real-time updates', async () => {
    let subscriptionCallback: (debugInfo: any) => void;
    mockTransactionDebugger.subscribe.mockImplementation((callback) => {
      subscriptionCallback = callback;
      return jest.fn();
    });

    render(<TransactionDebugger />);

    // Simulate new debug info
    const newDebugInfo = {
      transaction: createTransaction().asPayment().build(),
      debugData: {
        executionTime: 200,
        memoryUsage: 50,
        apiCalls: [],
        errors: [],
        warnings: [],
        performance: { startTime: 0, endTime: 200, duration: 200, steps: [] }
      }
    };

    // Trigger the subscription callback
    subscriptionCallback!(newDebugInfo);

    await waitFor(() => {
      expect(screen.getByText('payment')).toBeInTheDocument();
    });
  });
});