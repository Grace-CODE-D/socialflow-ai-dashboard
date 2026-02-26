import {
  TransactionBuilder,
  NetworkRequestBuilder,
  ContractExecutionBuilder,
  BatchBuilder,
  ScenarioBuilder,
  createTransaction,
  createNetworkRequest,
  createContractExecution
} from '../../utils/testing/transactionBuilders';

import { Platform } from '../../types';

describe('Transaction Builders', () => {
  describe('TransactionBuilder', () => {
    it('should create a transaction with default values', () => {
      const transaction = new TransactionBuilder().build();
      
      expect(transaction.id).toBeDefined();
      expect(transaction.type).toBe('post');
      expect(transaction.platform).toBe(Platform.INSTAGRAM);
      expect(transaction.status).toBe('pending');
      expect(transaction.metadata.userId).toBe('test_user_123');
    });

    it('should allow method chaining', () => {
      const transaction = new TransactionBuilder()
        .withType('payment')
        .withStatus('completed')
        .withAmount(500)
        .asNew()
        .build();
      
      expect(transaction.type).toBe('payment');
      expect(transaction.status).toBe('completed');
      expect(transaction.metadata.amount).toBe(500);
      expect(transaction.isNew).toBe(true);
    });

    it('should provide convenience methods', () => {
      const paymentTransaction = new TransactionBuilder()
        .asPayment()
        .asCompleted()
        .build();
      
      expect(paymentTransaction.type).toBe('payment');
      expect(paymentTransaction.status).toBe('completed');
      expect(paymentTransaction.metadata.amount).toBeDefined();
    });

    it('should reset to defaults', () => {
      const builder = new TransactionBuilder()
        .withType('payment')
        .withAmount(1000);
      
      const transaction1 = builder.build();
      expect(transaction1.type).toBe('payment');
      
      const transaction2 = builder.reset().build();
      expect(transaction2.type).toBe('post');
      expect(transaction2.metadata.amount).toBeUndefined();
    });
  });

  describe('NetworkRequestBuilder', () => {
    it('should create a network request with default values', () => {
      const request = new NetworkRequestBuilder().build();
      
      expect(request.id).toBeDefined();
      expect(request.method).toBe('GET');
      expect(request.url).toBe('https://api.test.com/endpoint');
      expect(request.status).toBe(200);
      expect(request.requestHeaders).toBeDefined();
      expect(request.responseHeaders).toBeDefined();
    });

    it('should handle different HTTP methods', () => {
      const postRequest = new NetworkRequestBuilder()
        .asPost()
        .build();
      
      expect(postRequest.method).toBe('POST');
      expect(postRequest.requestBody).toBeDefined();
    });

    it('should handle error scenarios', () => {
      const errorRequest = new NetworkRequestBuilder()
        .asServerError()
        .build();
      
      expect(errorRequest.status).toBe(500);
      expect(errorRequest.error).toBe('Internal Server Error');
    });

    it('should handle performance scenarios', () => {
      const slowRequest = new NetworkRequestBuilder()
        .asSlow()
        .build();
      
      expect(slowRequest.duration).toBeGreaterThanOrEqual(3000);
      
      const fastRequest = new NetworkRequestBuilder()
        .asFast()
        .build();
      
      expect(fastRequest.duration).toBeLessThanOrEqual(150);
    });
  });

  describe('ContractExecutionBuilder', () => {
    it('should create a contract execution with default values', () => {
      const execution = new ContractExecutionBuilder().build();
      
      expect(execution.id).toBeDefined();
      expect(execution.contractAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(execution.method).toBe('transfer');
      expect(execution.status).toBe('pending');
      expect(execution.gasUsed).toBe(21000);
    });

    it('should handle different contract methods', () => {
      const swapExecution = new ContractExecutionBuilder()
        .asSwap()
        .build();
      
      expect(swapExecution.method).toBe('swap');
      expect(swapExecution.parameters).toHaveLength(3);
      expect(swapExecution.gasUsed).toBeGreaterThan(21000);
    });

    it('should handle success scenarios', () => {
      const successExecution = new ContractExecutionBuilder()
        .asSuccess()
        .build();
      
      expect(successExecution.status).toBe('success');
      expect(successExecution.transactionHash).toBeDefined();
      expect(successExecution.blockNumber).toBeDefined();
      expect(successExecution.logs).toHaveLength(1);
    });

    it('should handle failure scenarios', () => {
      const failedExecution = new ContractExecutionBuilder()
        .asFailed()
        .build();
      
      expect(failedExecution.status).toBe('failed');
      expect(failedExecution.error).toBe('Transaction reverted');
    });

    it('should handle gas scenarios', () => {
      const highGasExecution = new ContractExecutionBuilder()
        .asHighGas()
        .build();
      
      expect(highGasExecution.gasUsed).toBeGreaterThanOrEqual(500000);
      
      const lowGasExecution = new ContractExecutionBuilder()
        .asLowGas()
        .build();
      
      expect(lowGasExecution.gasUsed).toBeLessThanOrEqual(51000);
    });
  });

  describe('BatchBuilder', () => {
    it('should create multiple builders', () => {
      const builders = BatchBuilder.transactions(5);
      expect(builders).toHaveLength(5);
      expect(builders[0]).toBeInstanceOf(TransactionBuilder);
    });

    it('should build multiple items with configuration', () => {
      const transactions = BatchBuilder.buildTransactions(3, (builder, index) => 
        builder.withType('payment').withAmount(100 * (index + 1))
      );
      
      expect(transactions).toHaveLength(3);
      expect(transactions[0].metadata.amount).toBe(100);
      expect(transactions[1].metadata.amount).toBe(200);
      expect(transactions[2].metadata.amount).toBe(300);
    });
  });

  describe('ScenarioBuilder', () => {
    it('should create failed transaction scenario', () => {
      const failedTransactions = ScenarioBuilder.failedTransactionScenario();
      
      expect(failedTransactions).toHaveLength(3);
      failedTransactions.forEach(transaction => {
        expect(transaction.status).toBe('failed');
      });
    });

    it('should create network error scenario', () => {
      const errorRequests = ScenarioBuilder.networkErrorScenario();
      
      expect(errorRequests).toHaveLength(3);
      errorRequests.forEach(request => {
        expect(request.status).toBeGreaterThanOrEqual(400);
      });
    });

    it('should create contract failure scenario', () => {
      const failedExecutions = ScenarioBuilder.contractFailureScenario();
      
      expect(failedExecutions).toHaveLength(3);
      failedExecutions.forEach(execution => {
        expect(execution.status).toBe('failed');
        expect(execution.error).toBeDefined();
      });
    });

    it('should create successful transaction flow', () => {
      const successFlow = ScenarioBuilder.successfulTransactionFlow();
      
      expect(successFlow).toHaveLength(3);
      successFlow.forEach(transaction => {
        expect(transaction.status).toBe('completed');
        expect(transaction.metadata.userId).toBe('test_user_123');
        expect(transaction.platform).toBe(Platform.INSTAGRAM);
      });
    });

    it('should create time series scenario', () => {
      const timeSeries = ScenarioBuilder.timeSeriesScenario(5);
      
      expect(timeSeries).toHaveLength(5);
      
      // Check that timestamps are in descending order (most recent first)
      for (let i = 1; i < timeSeries.length; i++) {
        expect(timeSeries[i].timestamp.getTime()).toBeLessThan(
          timeSeries[i - 1].timestamp.getTime()
        );
      }
    });

    it('should create mixed status scenario', () => {
      const mixedTransactions = ScenarioBuilder.mixedStatusScenario();
      
      expect(mixedTransactions).toHaveLength(5);
      
      const statuses = mixedTransactions.map(t => t.status);
      expect(statuses).toContain('completed');
      expect(statuses).toContain('pending');
      expect(statuses).toContain('failed');
    });
  });

  describe('Factory Functions', () => {
    it('should create transaction builder', () => {
      const builder = createTransaction();
      expect(builder).toBeInstanceOf(TransactionBuilder);
    });

    it('should create network request builder', () => {
      const builder = createNetworkRequest();
      expect(builder).toBeInstanceOf(NetworkRequestBuilder);
    });

    it('should create contract execution builder', () => {
      const builder = createContractExecution();
      expect(builder).toBeInstanceOf(ContractExecutionBuilder);
    });
  });
});