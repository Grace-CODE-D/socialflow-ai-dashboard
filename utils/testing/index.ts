// Main testing utilities exports
export * from './mockWalletProvider';
export * from './testDataGenerators';
export * from './transactionBuilders';
export * from './testHelpers';
export * from './snapshotUtilities';

// Re-export commonly used testing library functions
export {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
  cleanup,
  within,
  getByRole,
  getByText,
  getByTestId,
  queryByRole,
  queryByText,
  queryByTestId,
  findByRole,
  findByText,
  findByTestId
} from '@testing-library/react';

export { userEvent } from '@testing-library/user-event';

// Jest utilities
export { jest, expect, describe, it, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';

// Custom testing utilities
import { testUtils } from './testHelpers';
import { SnapshotUtilities } from './snapshotUtilities';
import { mockWalletProvider } from './mockWalletProvider';
import {
  generateTestDataSet,
  generateErrorScenarioData,
  generatePerformanceTestData
} from './testDataGenerators';
import {
  createTransaction,
  createNetworkRequest,
  createContractExecution,
  ScenarioBuilder
} from './transactionBuilders';

// Consolidated testing toolkit
export const TestingToolkit = {
  // Test utilities
  utils: testUtils,
  
  // Snapshot utilities
  snapshots: SnapshotUtilities,
  
  // Mock providers
  mockWallet: mockWalletProvider,
  
  // Data generators
  data: {
    generateTestDataSet,
    generateErrorScenarioData,
    generatePerformanceTestData
  },
  
  // Builders
  builders: {
    transaction: createTransaction,
    networkRequest: createNetworkRequest,
    contractExecution: createContractExecution,
    scenarios: ScenarioBuilder
  }
};

// Default export
export default TestingToolkit;