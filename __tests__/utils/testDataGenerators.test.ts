import {
  generateMockTransaction,
  generateTransactionBatch,
  generateMockNetworkRequest,
  generateNetworkRequestBatch,
  generateMockContractExecution,
  generateContractExecutionBatch,
  generateMockLogEntry,
  generateLogEntryBatch,
  generateTestDataSet,
  generateErrorScenarioData,
  generatePerformanceTestData
} from '../../utils/testing/testDataGenerators';

import {
  validateTransaction,
  validateNetworkRequest,
  validateContractExecution,
  validateLogEntry
} from '../../utils/testing/testHelpers';

describe('Test Data Generators', () => {
  describe('generateMockTransaction', () => {
    it('should generate a valid transaction', () => {
      const transaction = generateMockTransaction();
      expect(validateTransaction(transaction)).toBe(true);
    });

    it('should accept overrides', () => {
      const overrides = {
        type: 'payment' as const,
        status: 'completed' as const,
        description: 'Custom payment'
      };
      
      const transaction = generateMockTransaction(overrides);
      
      expect(transaction.type).toBe('payment');
      expect(transaction.status).toBe('completed');
      expect(transaction.description).toBe('Custom payment');
    });

    it('should generate unique IDs', () => {
      const transaction1 = generateMockTransaction();
      const transaction2 = generateMockTransaction();
      
      expect(transaction1.id).not.toBe(transaction2.id);
    });
  });

  describe('generateTransactionBatch', () => {
    it('should generate the specified number of transactions', () => {
      const count = 5;
      const transactions = generateTransactionBatch(count);
      
      expect(transactions).toHaveLength(count);
      transactions.forEach(transaction => {
        expect(validateTransaction(transaction)).toBe(true);
      });
    });

    it('should generate unique transactions', () => {
      const transactions = generateTransactionBatch(10);
      const ids = transactions.map(t => t.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(transactions.length);
    });
  });

  describe('generateMockNetworkRequest', () => {
    it('should generate a valid network request', () => {
      const request = generateMockNetworkRequest();
      expect(validateNetworkRequest(request)).toBe(true);
    });

    it('should accept overrides', () => {
      const overrides = {
        method: 'POST' as const,
        status: 201,
        url: 'https://custom.api.com/endpoint'
      };
      
      const request = generateMockNetworkRequest(overrides);
      
      expect(request.method).toBe('POST');
      expect(request.status).toBe(201);
      expect(request.url).toBe('https://custom.api.com/endpoint');
    });

    it('should generate appropriate request body for POST requests', () => {
      const request = generateMockNetworkRequest({ method: 'POST' });
      expect(request.requestBody).toBeDefined();
    });

    it('should not generate request body for GET requests', () => {
      const request = generateMockNetworkRequest({ method: 'GET' });
      expect(request.requestBody).toBeUndefined();
    });
  });

  describe('generateMockContractExecution', () => {
    it('should generate a valid contract execution', () => {
      const execution = generateMockContractExecution();
      expect(validateContractExecution(execution)).toBe(true);
    });

    it('should generate valid contract address', () => {
      const execution = generateMockContractExecution();
      expect(execution.contractAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should generate appropriate parameters for different methods', () => {
      const transferExecution = generateMockContractExecution({ method: 'transfer' });
      expect(transferExecution.parameters).toHaveLength(2);
      
      const burnExecution = generateMockContractExecution({ method: 'burn' });
      expect(burnExecution.parameters).toHaveLength(1);
    });

    it('should include transaction hash for successful executions', () => {
      const execution = generateMockContractExecution({ status: 'success' });
      expect(execution.transactionHash).toBeDefined();
      expect(execution.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });
  });

  describe('generateMockLogEntry', () => {
    it('should generate a valid log entry', () => {
      const log = generateMockLogEntry();
      expect(validateLogEntry(log)).toBe(true);
    });

    it('should include stack trace for error logs', () => {
      const errorLog = generateMockLogEntry({ level: 'error' });
      expect(errorLog.stackTrace).toBeDefined();
    });

    it('should not include stack trace for non-error logs', () => {
      const infoLog = generateMockLogEntry({ level: 'info' });
      expect(infoLog.stackTrace).toBeUndefined();
    });

    it('should generate appropriate metadata based on source', () => {
      const networkLog = generateMockLogEntry({ source: 'network' });
      expect(networkLog.metadata?.url).toBeDefined();
      
      const databaseLog = generateMockLogEntry({ source: 'database' });
      expect(databaseLog.metadata?.query).toBeDefined();
    });
  });

  describe('generateTestDataSet', () => {
    it('should generate a complete test data set', () => {
      const dataSet = generateTestDataSet();
      
      expect(dataSet.transactions).toHaveLength(25);
      expect(dataSet.networkRequests).toHaveLength(30);
      expect(dataSet.contractExecutions).toHaveLength(20);
      expect(dataSet.logEntries).toHaveLength(100);
      expect(dataSet.posts).toHaveLength(15);
      expect(dataSet.conversations).toHaveLength(8);
    });

    it('should generate valid data in all categories', () => {
      const dataSet = generateTestDataSet();
      
      dataSet.transactions.forEach(t => expect(validateTransaction(t)).toBe(true));
      dataSet.networkRequests.forEach(r => expect(validateNetworkRequest(r)).toBe(true));
      dataSet.contractExecutions.forEach(e => expect(validateContractExecution(e)).toBe(true));
      dataSet.logEntries.forEach(l => expect(validateLogEntry(l)).toBe(true));
    });
  });

  describe('generateErrorScenarioData', () => {
    it('should generate error scenario data', () => {
      const errorData = generateErrorScenarioData();
      
      expect(errorData.failedTransactions).toHaveLength(5);
      expect(errorData.errorRequests).toHaveLength(10);
      expect(errorData.failedExecutions).toHaveLength(3);
      expect(errorData.errorLogs).toHaveLength(20);
    });

    it('should generate only failed/error items', () => {
      const errorData = generateErrorScenarioData();
      
      errorData.failedTransactions.forEach(t => {
        expect(t.status).toBe('failed');
      });
      
      errorData.errorRequests.forEach(r => {
        expect(r.status).toBeGreaterThanOrEqual(400);
      });
      
      errorData.failedExecutions.forEach(e => {
        expect(e.status).toBe('failed');
      });
      
      errorData.errorLogs.forEach(l => {
        expect(l.level).toBe('error');
      });
    });
  });

  describe('generatePerformanceTestData', () => {
    it('should generate performance test data', () => {
      const perfData = generatePerformanceTestData();
      
      expect(perfData.slowRequests).toHaveLength(15);
      expect(perfData.highGasExecutions).toHaveLength(10);
      expect(perfData.heavyLogs).toHaveLength(200);
    });

    it('should generate slow requests', () => {
      const perfData = generatePerformanceTestData();
      
      perfData.slowRequests.forEach(r => {
        expect(r.duration).toBeGreaterThanOrEqual(3000);
      });
    });

    it('should generate high gas executions', () => {
      const perfData = generatePerformanceTestData();
      
      perfData.highGasExecutions.forEach(e => {
        expect(e.gasUsed).toBeGreaterThanOrEqual(800000);
      });
    });
  });
});