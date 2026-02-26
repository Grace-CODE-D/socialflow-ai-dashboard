# Testing Utilities Documentation

## Overview

This document provides comprehensive documentation for the testing utilities implemented for the SocialFlow AI Dashboard. These utilities provide a complete testing framework including mock providers, data generators, transaction builders, test helpers, and snapshot utilities.

## Table of Contents

1. [Installation & Setup](#installation--setup)
2. [Mock Wallet Provider](#mock-wallet-provider)
3. [Test Data Generators](#test-data-generators)
4. [Transaction Builders](#transaction-builders)
5. [Test Helpers](#test-helpers)
6. [Snapshot Utilities](#snapshot-utilities)
7. [Usage Examples](#usage-examples)
8. [Best Practices](#best-practices)

## Installation & Setup

### Dependencies

The testing utilities require the following dependencies (already added to package.json):

```json
{
  "devDependencies": {
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^5.16.5",
    "@testing-library/user-event": "^14.4.3",
    "@types/jest": "^29.5.5",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "ts-jest": "^29.1.1"
  }
}
```

### Configuration

Jest is configured with:
- TypeScript support via ts-jest
- JSDOM environment for React testing
- Custom setup file for global mocks
- Coverage reporting

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Mock Wallet Provider

### Overview

The Mock Wallet Provider simulates a Web3 wallet for testing blockchain interactions without requiring a real wallet or network connection.

### Features

- ✅ Connection/disconnection simulation
- ✅ Account management
- ✅ Transaction sending and tracking
- ✅ Balance management
- ✅ Network switching
- ✅ Event emission
- ✅ Configurable delays and failures

### Basic Usage

```typescript
import { createMockWalletProvider } from '../utils/testing';

describe('Wallet Integration', () => {
  let mockWallet;

  beforeEach(() => {
    mockWallet = createMockWalletProvider();
  });

  it('should connect to wallet', async () => {
    const accounts = await mockWallet.connect();
    expect(mockWallet.isConnected).toBe(true);
    expect(accounts).toHaveLength(1);
  });

  it('should send transaction', async () => {
    await mockWallet.connect();
    const txHash = await mockWallet.sendTransaction({
      to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b2',
      value: '1000000000000000000' // 1 ETH
    });
    expect(txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
  });
});
```

### Advanced Features

```typescript
// Simulate transaction failures
mockWallet.simulateTransactionFailure(true);

// Set custom balances
mockWallet.setBalance(address, '2000000000000000000000'); // 2000 ETH

// Add custom accounts
mockWallet.addAccount({
  address: '0x1234567890123456789012345678901234567890',
  balance: '500000000000000000000'
});

// Listen to events
mockWallet.on('transactionConfirmed', (tx) => {
  console.log('Transaction confirmed:', tx.hash);
});
```

## Test Data Generators

### Overview

Test data generators provide realistic mock data for all application entities including transactions, network requests, contract executions, and logs.

### Available Generators

#### Transaction Generators

```typescript
import { generateMockTransaction, generateTransactionBatch } from '../utils/testing';

// Generate single transaction
const transaction = generateMockTransaction();

// Generate batch of transactions
const transactions = generateTransactionBatch(10);

// Generate with overrides
const paymentTransaction = generateMockTransaction({
  type: 'payment',
  status: 'completed',
  metadata: { amount: 500 }
});
```

#### Network Request Generators

```typescript
import { generateMockNetworkRequest, generateNetworkRequestBatch } from '../utils/testing';

// Generate single request
const request = generateMockNetworkRequest();

// Generate batch
const requests = generateNetworkRequestBatch(20);

// Generate specific request type
const postRequest = generateMockNetworkRequest({
  method: 'POST',
  status: 201,
  requestBody: { title: 'Test Post' }
});
```

#### Contract Execution Generators

```typescript
import { generateMockContractExecution, generateContractExecutionBatch } from '../utils/testing';

// Generate single execution
const execution = generateMockContractExecution();

// Generate successful execution
const successExecution = generateMockContractExecution({
  status: 'success',
  method: 'transfer',
  gasUsed: 21000
});
```

#### Scenario Generators

```typescript
import { generateTestDataSet, generateErrorScenarioData, generatePerformanceTestData } from '../utils/testing';

// Complete test dataset
const testData = generateTestDataSet();
// Returns: { transactions, networkRequests, contractExecutions, logEntries, posts, conversations }

// Error scenarios
const errorData = generateErrorScenarioData();
// Returns: { failedTransactions, errorRequests, failedExecutions, errorLogs }

// Performance test data
const perfData = generatePerformanceTestData();
// Returns: { slowRequests, highGasExecutions, heavyLogs }
```

## Transaction Builders

### Overview

Transaction builders provide a fluent API for creating test data with specific configurations using the builder pattern.

### Available Builders

#### TransactionBuilder

```typescript
import { createTransaction, TransactionBuilder } from '../utils/testing';

// Using factory function
const transaction = createTransaction()
  .asPayment()
  .asCompleted()
  .withAmount(500)
  .withUserId('user_123')
  .build();

// Using class directly
const builder = new TransactionBuilder()
  .withType('post')
  .withPlatform(Platform.INSTAGRAM)
  .asNew()
  .build();
```

#### NetworkRequestBuilder

```typescript
import { createNetworkRequest } from '../utils/testing';

const request = createNetworkRequest()
  .asPost()
  .withUrl('https://api.test.com/posts')
  .asSuccess()
  .withResponseBody({ id: 123, status: 'created' })
  .build();

// Error scenarios
const errorRequest = createNetworkRequest()
  .asGet()
  .asServerError()
  .withError('Internal Server Error')
  .build();
```

#### ContractExecutionBuilder

```typescript
import { createContractExecution } from '../utils/testing';

const execution = createContractExecution()
  .asTransfer()
  .asSuccess()
  .withGasUsed(21000)
  .withTransactionHash('0x123...')
  .build();

// High gas execution
const highGasExecution = createContractExecution()
  .asSwap()
  .asHighGas()
  .build();
```

#### Batch Builders

```typescript
import { BatchBuilder } from '../utils/testing';

// Create multiple configured items
const transactions = BatchBuilder.buildTransactions(5, (builder, index) =>
  builder.withType('payment').withAmount(100 * (index + 1))
);

const requests = BatchBuilder.buildNetworkRequests(10, (builder, index) =>
  builder.asGet().withUrl(`https://api.test.com/items/${index}`)
);
```

#### Scenario Builders

```typescript
import { ScenarioBuilder } from '../utils/testing';

// Pre-built scenarios
const failedTransactions = ScenarioBuilder.failedTransactionScenario();
const networkErrors = ScenarioBuilder.networkErrorScenario();
const contractFailures = ScenarioBuilder.contractFailureScenario();

// Time-based scenarios
const timeSeries = ScenarioBuilder.timeSeriesScenario(24); // 24 hours of data

// Success flows
const successFlow = ScenarioBuilder.successfulTransactionFlow();
```

## Test Helpers

### Overview

Test helpers provide utilities for component testing, mocking, assertions, and test environment setup.

### Custom Render Function

```typescript
import { render } from '../utils/testing';

// Custom render with providers
const { container, getByText } = render(<MyComponent />, {
  theme: 'dark',
  initialState: { user: { id: '123' } }
});
```

### Mock Services

```typescript
import { 
  mockEventMonitor,
  mockNetworkMonitor,
  mockTransactionDebugger,
  setupMocks,
  cleanupMocks
} from '../utils/testing';

describe('Component Tests', () => {
  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    cleanupMocks();
  });

  it('should use mock services', () => {
    mockEventMonitor.subscribe.mockReturnValue(jest.fn());
    // Test component that uses event monitor
  });
});
```

### Utility Functions

```typescript
import { 
  waitFor,
  sleep,
  measureExecutionTime,
  simulateUserInteraction,
  expectElementToBeVisible
} from '../utils/testing';

// Wait for condition
await waitFor(() => element.textContent === 'Loaded');

// Measure performance
const { result, duration } = await measureExecutionTime(async () => {
  return await expensiveOperation();
});

// Simulate interactions
await simulateUserInteraction(button, 'click');

// Custom assertions
expectElementToBeVisible(screen.getByTestId('modal'));
```

### Validation Helpers

```typescript
import { 
  validateTransaction,
  validateNetworkRequest,
  validateContractExecution,
  validateLogEntry
} from '../utils/testing';

// Validate data structure
expect(validateTransaction(mockTransaction)).toBe(true);
expect(validateNetworkRequest(mockRequest)).toBe(true);
```

## Snapshot Utilities

### Overview

Snapshot utilities provide advanced snapshot testing capabilities including responsive snapshots, theme variations, and interaction-based snapshots.

### Basic Usage

```typescript
import { createSnapshot, SnapshotUtilities } from '../utils/testing';

// Simple snapshot
createSnapshot(<MyComponent />, { name: 'MyComponent-default' });

// Configure globally
SnapshotUtilities.configure({
  theme: 'dark',
  excludeAttributes: ['data-testid'],
  includeStyles: false
});
```

### Responsive Snapshots

```typescript
import { createResponsiveSnapshots } from '../utils/testing';

// Creates snapshots for mobile, tablet, and desktop
createResponsiveSnapshots(<MyComponent />, 'MyComponent');
```

### Theme Snapshots

```typescript
import { createThemeSnapshots } from '../utils/testing';

// Creates snapshots for light and dark themes
createThemeSnapshots(<MyComponent />, 'MyComponent');
```

### State-based Snapshots

```typescript
import { createStateSnapshots } from '../utils/testing';

createStateSnapshots(
  (props) => <MyComponent {...props} />,
  [
    { name: 'loading', props: { isLoading: true } },
    { name: 'error', props: { error: 'Something went wrong' } },
    { name: 'success', props: { data: mockData } }
  ],
  'MyComponent'
);
```

### Interaction Snapshots

```typescript
import { createInteractionSnapshots } from '../utils/testing';

await createInteractionSnapshots(
  <MyComponent />,
  [
    {
      name: 'clicked',
      action: async (result) => {
        fireEvent.click(result.getByText('Click me'));
      }
    },
    {
      name: 'hovered',
      action: async (result) => {
        fireEvent.mouseEnter(result.getByTestId('hover-target'));
      }
    }
  ],
  'MyComponent'
);
```

### Snapshot Test Suite Generator

```typescript
import { generateSnapshotTestSuite } from '../utils/testing';

generateSnapshotTestSuite('MyComponent', <MyComponent />, {
  responsive: true,
  themes: true,
  states: [
    { name: 'loading', props: { isLoading: true } },
    { name: 'error', props: { error: 'Error message' } }
  ],
  interactions: [
    {
      name: 'clicked',
      action: (result) => fireEvent.click(result.getByText('Button'))
    }
  ]
});
```

## Usage Examples

### Complete Component Test

```typescript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { 
  createTransaction,
  mockTransactionDebugger,
  setupMocks,
  cleanupMocks,
  createSnapshot
} from '../utils/testing';
import { TransactionDebugger } from '../components/debug/TransactionDebugger';

describe('TransactionDebugger', () => {
  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    cleanupMocks();
  });

  it('should render and display transactions', async () => {
    const mockTransactions = [
      {
        transaction: createTransaction().asPayment().asCompleted().build(),
        debugData: {
          executionTime: 150,
          memoryUsage: 45,
          apiCalls: ['POST /api/payments'],
          errors: [],
          warnings: [],
          performance: { startTime: 0, endTime: 150, duration: 150, steps: [] }
        }
      }
    ];

    mockTransactionDebugger.getDebuggedTransactions.mockReturnValue(mockTransactions);

    render(<TransactionDebugger />);

    expect(screen.getByText('Transaction Debugger')).toBeInTheDocument();
    expect(screen.getByText('payment')).toBeInTheDocument();
  });

  it('should match snapshot', () => {
    createSnapshot(<TransactionDebugger />, { name: 'TransactionDebugger-empty' });
  });
});
```

### Integration Test with Mock Wallet

```typescript
import { createMockWalletProvider } from '../utils/testing';

describe('Wallet Integration', () => {
  let mockWallet;

  beforeEach(() => {
    mockWallet = createMockWalletProvider();
  });

  it('should handle complete transaction flow', async () => {
    // Connect wallet
    await mockWallet.connect();
    expect(mockWallet.isConnected).toBe(true);

    // Send transaction
    const txHash = await mockWallet.sendTransaction({
      to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b2',
      value: '1000000000000000000'
    });

    // Wait for confirmation
    const confirmedTx = await mockWallet.waitForTransaction(txHash);
    expect(confirmedTx.status).toBe('confirmed');
    expect(confirmedTx.blockNumber).toBeDefined();
  });
});
```

### Performance Testing

```typescript
import { measureExecutionTime, generatePerformanceTestData } from '../utils/testing';

describe('Performance Tests', () => {
  it('should handle large datasets efficiently', async () => {
    const perfData = generatePerformanceTestData();
    
    const { duration } = await measureExecutionTime(async () => {
      // Process large dataset
      return processLogs(perfData.heavyLogs);
    });

    expect(duration).toBeLessThan(1000); // Should complete within 1 second
  });
});
```

## Best Practices

### 1. Test Organization

```typescript
describe('Component/Feature Name', () => {
  // Setup and teardown
  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    cleanupMocks();
  });

  // Group related tests
  describe('Rendering', () => {
    // Rendering tests
  });

  describe('User Interactions', () => {
    // Interaction tests
  });

  describe('Data Handling', () => {
    // Data processing tests
  });
});
```

### 2. Mock Management

```typescript
// Use specific mocks for each test
beforeEach(() => {
  mockService.method.mockReturnValue(expectedValue);
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
```

### 3. Data Generation

```typescript
// Use builders for complex scenarios
const transaction = createTransaction()
  .asPayment()
  .withAmount(500)
  .asCompleted()
  .build();

// Use generators for bulk data
const testData = generateTestDataSet();
```

### 4. Snapshot Testing

```typescript
// Use descriptive names
createSnapshot(<Component />, { name: 'Component-loading-state' });

// Test multiple states
createStateSnapshots(
  (props) => <Component {...props} />,
  [
    { name: 'loading', props: { isLoading: true } },
    { name: 'error', props: { error: 'Error' } },
    { name: 'success', props: { data: mockData } }
  ]
);
```

### 5. Async Testing

```typescript
// Use waitFor for async operations
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});

// Handle promises properly
await expect(asyncFunction()).resolves.toBe(expectedValue);
```

### 6. Error Testing

```typescript
// Test error scenarios
const errorData = generateErrorScenarioData();
mockService.method.mockRejectedValue(new Error('Test error'));

await expect(component.handleAction()).rejects.toThrow('Test error');
```

## Conclusion

The testing utilities provide a comprehensive framework for testing all aspects of the SocialFlow AI Dashboard. They enable:

- **Realistic Testing**: Mock providers and data generators create realistic test scenarios
- **Efficient Development**: Builders and helpers reduce boilerplate code
- **Comprehensive Coverage**: Snapshot utilities ensure UI consistency
- **Performance Validation**: Performance testing utilities validate application efficiency
- **Maintainable Tests**: Well-structured utilities make tests easy to maintain and extend

Use these utilities to create robust, maintainable tests that ensure the quality and reliability of the application.