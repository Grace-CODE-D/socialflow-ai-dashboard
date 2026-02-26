import { Transaction, NetworkRequest, ContractExecution, Platform } from '../../types';
import { generateAddress, generateHash } from './testDataGenerators';

// Base builder class for common functionality
abstract class BaseBuilder<T> {
  protected data: Partial<T> = {};

  abstract build(): T;

  reset(): this {
    this.data = {};
    return this;
  }
}

// Transaction Builder
export class TransactionBuilder extends BaseBuilder<Transaction> {
  constructor() {
    super();
    this.withDefaults();
  }

  private withDefaults(): this {
    this.data = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      type: 'post',
      platform: Platform.INSTAGRAM,
      description: 'Test transaction',
      timestamp: new Date(),
      status: 'pending',
      metadata: {
        userId: 'test_user_123'
      },
      isNew: false
    };
    return this;
  }

  withId(id: string): this {
    this.data.id = id;
    return this;
  }

  withType(type: Transaction['type']): this {
    this.data.type = type;
    return this;
  }

  withPlatform(platform: Platform): this {
    this.data.platform = platform;
    return this;
  }

  withDescription(description: string): this {
    this.data.description = description;
    return this;
  }

  withStatus(status: Transaction['status']): this {
    this.data.status = status;
    return this;
  }

  withTimestamp(timestamp: Date): this {
    this.data.timestamp = timestamp;
    return this;
  }

  withUserId(userId: string): this {
    if (!this.data.metadata) this.data.metadata = {};
    this.data.metadata.userId = userId;
    return this;
  }

  withAmount(amount: number): this {
    if (!this.data.metadata) this.data.metadata = {};
    this.data.metadata.amount = amount;
    return this;
  }

  withMetadata(metadata: Record<string, any>): this {
    this.data.metadata = { ...this.data.metadata, ...metadata };
    return this;
  }

  asNew(): this {
    this.data.isNew = true;
    return this;
  }

  asPending(): this {
    this.data.status = 'pending';
    return this;
  }

  asCompleted(): this {
    this.data.status = 'completed';
    return this;
  }

  asFailed(): this {
    this.data.status = 'failed';
    return this;
  }

  asPost(): this {
    this.data.type = 'post';
    this.data.description = 'New post published';
    return this;
  }

  asComment(): this {
    this.data.type = 'comment';
    this.data.description = 'Comment added';
    return this;
  }

  asLike(): this {
    this.data.type = 'like';
    this.data.description = 'Content liked';
    return this;
  }

  asPayment(): this {
    this.data.type = 'payment';
    this.data.description = 'Payment processed';
    this.withAmount(Math.floor(Math.random() * 1000) + 1);
    return this;
  }

  asCampaign(): this {
    this.data.type = 'campaign';
    this.data.description = 'Campaign launched';
    return this;
  }

  build(): Transaction {
    return this.data as Transaction;
  }
}

// Network Request Builder
export class NetworkRequestBuilder extends BaseBuilder<NetworkRequest> {
  constructor() {
    super();
    this.withDefaults();
  }

  private withDefaults(): this {
    this.data = {
      id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      method: 'GET',
      url: 'https://api.test.com/endpoint',
      status: 200,
      duration: 500,
      timestamp: new Date(),
      requestHeaders: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Agent/1.0'
      },
      responseHeaders: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    };
    return this;
  }

  withId(id: string): this {
    this.data.id = id;
    return this;
  }

  withMethod(method: NetworkRequest['method']): this {
    this.data.method = method;
    return this;
  }

  withUrl(url: string): this {
    this.data.url = url;
    return this;
  }

  withStatus(status: number): this {
    this.data.status = status;
    return this;
  }

  withDuration(duration: number): this {
    this.data.duration = duration;
    return this;
  }

  withTimestamp(timestamp: Date): this {
    this.data.timestamp = timestamp;
    return this;
  }

  withRequestHeaders(headers: Record<string, string>): this {
    this.data.requestHeaders = { ...this.data.requestHeaders, ...headers };
    return this;
  }

  withResponseHeaders(headers: Record<string, string>): this {
    this.data.responseHeaders = { ...this.data.responseHeaders, ...headers };
    return this;
  }

  withRequestBody(body: any): this {
    this.data.requestBody = body;
    return this;
  }

  withResponseBody(body: any): this {
    this.data.responseBody = body;
    return this;
  }

  withError(error: string): this {
    this.data.error = error;
    return this;
  }

  asGet(): this {
    this.data.method = 'GET';
    return this;
  }

  asPost(): this {
    this.data.method = 'POST';
    this.withRequestBody({
      title: 'Test Post',
      content: 'Test content'
    });
    return this;
  }

  asPut(): this {
    this.data.method = 'PUT';
    this.withRequestBody({
      id: 123,
      updated_at: new Date().toISOString()
    });
    return this;
  }

  asDelete(): this {
    this.data.method = 'DELETE';
    return this;
  }

  asSuccess(): this {
    this.data.status = 200;
    this.data.responseBody = {
      success: true,
      data: { id: 123, status: 'success' }
    };
    return this;
  }

  asClientError(): this {
    this.data.status = 400;
    this.data.error = 'Bad Request';
    return this;
  }

  asServerError(): this {
    this.data.status = 500;
    this.data.error = 'Internal Server Error';
    return this;
  }

  asUnauthorized(): this {
    this.data.status = 401;
    this.data.error = 'Unauthorized';
    return this;
  }

  asNotFound(): this {
    this.data.status = 404;
    this.data.error = 'Not Found';
    return this;
  }

  asSlow(): this {
    this.data.duration = Math.floor(Math.random() * 5000) + 3000; // 3-8 seconds
    return this;
  }

  asFast(): this {
    this.data.duration = Math.floor(Math.random() * 100) + 50; // 50-150ms
    return this;
  }

  build(): NetworkRequest {
    return this.data as NetworkRequest;
  }
}

// Contract Execution Builder
export class ContractExecutionBuilder extends BaseBuilder<ContractExecution> {
  constructor() {
    super();
    this.withDefaults();
  }

  private withDefaults(): this {
    this.data = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      contractAddress: generateAddress(),
      method: 'transfer',
      parameters: [],
      gasUsed: 21000,
      gasLimit: 100000,
      status: 'pending',
      timestamp: new Date(),
      logs: []
    };
    return this;
  }

  withId(id: string): this {
    this.data.id = id;
    return this;
  }

  withContractAddress(address: string): this {
    this.data.contractAddress = address;
    return this;
  }

  withMethod(method: string): this {
    this.data.method = method;
    return this;
  }

  withParameters(parameters: any[]): this {
    this.data.parameters = parameters;
    return this;
  }

  withGasUsed(gasUsed: number): this {
    this.data.gasUsed = gasUsed;
    return this;
  }

  withGasLimit(gasLimit: number): this {
    this.data.gasLimit = gasLimit;
    return this;
  }

  withStatus(status: ContractExecution['status']): this {
    this.data.status = status;
    return this;
  }

  withTimestamp(timestamp: Date): this {
    this.data.timestamp = timestamp;
    return this;
  }

  withTransactionHash(hash: string): this {
    this.data.transactionHash = hash;
    return this;
  }

  withBlockNumber(blockNumber: number): this {
    this.data.blockNumber = blockNumber;
    return this;
  }

  withError(error: string): this {
    this.data.error = error;
    return this;
  }

  withLogs(logs: any[]): this {
    this.data.logs = logs;
    return this;
  }

  asPending(): this {
    this.data.status = 'pending';
    return this;
  }

  asSuccess(): this {
    this.data.status = 'success';
    this.data.transactionHash = generateHash();
    this.data.blockNumber = Math.floor(Math.random() * 1000000) + 15000000;
    this.data.logs = this.generateSuccessLogs();
    return this;
  }

  asFailed(): this {
    this.data.status = 'failed';
    this.data.error = 'Transaction reverted';
    return this;
  }

  asTransfer(): this {
    this.data.method = 'transfer';
    this.data.parameters = [generateAddress(), '1000000000000000000']; // 1 ETH in wei
    return this;
  }

  asApprove(): this {
    this.data.method = 'approve';
    this.data.parameters = [generateAddress(), '1000000000000000000'];
    return this;
  }

  asMint(): this {
    this.data.method = 'mint';
    this.data.parameters = [generateAddress(), '100000000000000000000']; // 100 tokens
    return this;
  }

  asSwap(): this {
    this.data.method = 'swap';
    this.data.parameters = ['1000000000000000000', '2000000000000000000', generateAddress()];
    this.data.gasUsed = Math.floor(Math.random() * 200000) + 100000; // Higher gas for swaps
    return this;
  }

  asHighGas(): this {
    this.data.gasUsed = Math.floor(Math.random() * 500000) + 500000; // 500k-1M gas
    this.data.gasLimit = this.data.gasUsed + 100000;
    return this;
  }

  asLowGas(): this {
    this.data.gasUsed = Math.floor(Math.random() * 30000) + 21000; // 21k-51k gas
    this.data.gasLimit = this.data.gasUsed + 10000;
    return this;
  }

  private generateSuccessLogs(): any[] {
    return [
      {
        id: `log_${this.data.id}_0`,
        address: this.data.contractAddress,
        topics: [generateHash(), generateHash()],
        data: generateHash(128),
        blockNumber: this.data.blockNumber || 15000000,
        transactionHash: this.data.transactionHash || generateHash(),
        logIndex: 0
      }
    ];
  }

  build(): ContractExecution {
    return this.data as ContractExecution;
  }
}

// Batch builders for creating multiple items
export class BatchBuilder {
  static transactions(count: number): TransactionBuilder[] {
    return Array.from({ length: count }, () => new TransactionBuilder());
  }

  static networkRequests(count: number): NetworkRequestBuilder[] {
    return Array.from({ length: count }, () => new NetworkRequestBuilder());
  }

  static contractExecutions(count: number): ContractExecutionBuilder[] {
    return Array.from({ length: count }, () => new ContractExecutionBuilder());
  }

  // Build multiple items with the same configuration
  static buildTransactions(count: number, configureFn: (builder: TransactionBuilder, index: number) => TransactionBuilder): Transaction[] {
    return Array.from({ length: count }, (_, index) => {
      const builder = new TransactionBuilder();
      return configureFn(builder, index).build();
    });
  }

  static buildNetworkRequests(count: number, configureFn: (builder: NetworkRequestBuilder, index: number) => NetworkRequestBuilder): NetworkRequest[] {
    return Array.from({ length: count }, (_, index) => {
      const builder = new NetworkRequestBuilder();
      return configureFn(builder, index).build();
    });
  }

  static buildContractExecutions(count: number, configureFn: (builder: ContractExecutionBuilder, index: number) => ContractExecutionBuilder): ContractExecution[] {
    return Array.from({ length: count }, (_, index) => {
      const builder = new ContractExecutionBuilder();
      return configureFn(builder, index).build();
    });
  }
}

// Scenario builders for common test scenarios
export class ScenarioBuilder {
  // Error scenarios
  static failedTransactionScenario(): Transaction[] {
    return [
      new TransactionBuilder().asFailed().asPayment().withAmount(500).build(),
      new TransactionBuilder().asFailed().asPost().withPlatform(Platform.FACEBOOK).build(),
      new TransactionBuilder().asFailed().asCampaign().withMetadata({ budget: 1000 }).build()
    ];
  }

  static networkErrorScenario(): NetworkRequest[] {
    return [
      new NetworkRequestBuilder().asPost().asServerError().build(),
      new NetworkRequestBuilder().asGet().asNotFound().build(),
      new NetworkRequestBuilder().asPut().asUnauthorized().build()
    ];
  }

  static contractFailureScenario(): ContractExecution[] {
    return [
      new ContractExecutionBuilder().asTransfer().asFailed().withError('Insufficient balance').build(),
      new ContractExecutionBuilder().asSwap().asFailed().withError('Slippage too high').build(),
      new ContractExecutionBuilder().asMint().asFailed().withError('Max supply reached').build()
    ];
  }

  // Performance scenarios
  static slowNetworkScenario(): NetworkRequest[] {
    return BatchBuilder.buildNetworkRequests(10, (builder, index) => 
      builder.asSlow().withUrl(`https://api.test.com/slow-endpoint-${index}`)
    );
  }

  static highGasScenario(): ContractExecution[] {
    return BatchBuilder.buildContractExecutions(5, (builder, index) => 
      builder.asHighGas().asSwap().withMethod(`complexOperation${index}`)
    );
  }

  // Success scenarios
  static successfulTransactionFlow(): Transaction[] {
    const userId = 'test_user_123';
    return [
      new TransactionBuilder().asPost().asCompleted().withUserId(userId).withPlatform(Platform.INSTAGRAM).build(),
      new TransactionBuilder().asLike().asCompleted().withUserId(userId).withPlatform(Platform.INSTAGRAM).build(),
      new TransactionBuilder().asComment().asCompleted().withUserId(userId).withPlatform(Platform.INSTAGRAM).build()
    ];
  }

  static successfulContractFlow(): ContractExecution[] {
    const contractAddress = generateAddress();
    return [
      new ContractExecutionBuilder().asApprove().asSuccess().withContractAddress(contractAddress).build(),
      new ContractExecutionBuilder().asTransfer().asSuccess().withContractAddress(contractAddress).build(),
      new ContractExecutionBuilder().asSwap().asSuccess().withContractAddress(contractAddress).build()
    ];
  }

  // Mixed scenarios
  static mixedStatusScenario(): Transaction[] {
    return [
      new TransactionBuilder().asCompleted().asPost().build(),
      new TransactionBuilder().asPending().asPayment().build(),
      new TransactionBuilder().asFailed().asCampaign().build(),
      new TransactionBuilder().asCompleted().asLike().build(),
      new TransactionBuilder().asPending().asComment().build()
    ];
  }

  // Time-based scenarios
  static timeSeriesScenario(hours: number = 24): Transaction[] {
    const now = new Date();
    const transactions: Transaction[] = [];
    
    for (let i = 0; i < hours; i++) {
      const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000)); // i hours ago
      transactions.push(
        new TransactionBuilder()
          .withTimestamp(timestamp)
          .asCompleted()
          .asPost()
          .withUserId(`user_${i % 10}`)
          .build()
      );
    }
    
    return transactions;
  }
}

// Factory functions for easy access
export const createTransaction = () => new TransactionBuilder();
export const createNetworkRequest = () => new NetworkRequestBuilder();
export const createContractExecution = () => new ContractExecutionBuilder();

// Export all builders
export {
  TransactionBuilder,
  NetworkRequestBuilder,
  ContractExecutionBuilder,
  BatchBuilder,
  ScenarioBuilder
};