import * as StellarSdk from '@stellar/stellar-sdk';

const Horizon = StellarSdk.Horizon;
type ServerApi = typeof StellarSdk.Horizon.HorizonApi;

export enum BlockchainEventType {
  PAYMENT = 'payment',
  TOKEN_TRANSFER = 'token_transfer',
  NFT_TRANSFER = 'nft_transfer',
  CONTRACT_EXECUTION = 'contract_execution',
  ACCOUNT_CREATED = 'account_created',
  TRUSTLINE_CREATED = 'trustline_created',
}

export interface BlockchainEvent {
  id: string;
  type: BlockchainEventType;
  timestamp: string;
  account: string;
  data: any;
}

export type EventCallback = (event: BlockchainEvent) => void;

export class EventMonitorService {
  private server: Horizon.Server;
  private listeners: Map<string, EventCallback[]> = new Map();
  private closeHandlers: (() => void)[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;

  constructor(horizonUrl: string = 'https://horizon-testnet.stellar.org') {
    this.server = new Horizon.Server(horizonUrl);
  }

  async startMonitoring(accountId: string): Promise<void> {
    this.monitorPayments(accountId);
    this.monitorOperations(accountId);
  }

  private monitorPayments(accountId: string): void {
    const closeHandler = this.server
      .payments()
      .forAccount(accountId)
      .cursor('now')
      .stream({
        onmessage: (payment) => this.handlePayment(payment, accountId),
        onerror: (error) => this.handleError(error, accountId),
      });

    this.closeHandlers.push(closeHandler);
  }

  private monitorOperations(accountId: string): void {
    const closeHandler = this.server
      .operations()
      .forAccount(accountId)
      .cursor('now')
      .stream({
        onmessage: (operation) => this.handleOperation(operation, accountId),
        onerror: (error) => this.handleError(error, accountId),
      });

    this.closeHandlers.push(closeHandler);
  }

  private handlePayment(
    payment: any,
    accountId: string
  ): void {
    const event: BlockchainEvent = {
      id: payment.id,
      type: BlockchainEventType.PAYMENT,
      timestamp: payment.created_at,
      account: accountId,
      data: {
        from: payment.from,
        to: payment.to,
        amount: payment.amount,
        asset: payment.asset_type === 'native' ? 'XLM' : payment.asset_code,
      },
    };

    this.emit(BlockchainEventType.PAYMENT, event);
  }

  private handleOperation(
    operation: any,
    accountId: string
  ): void {
    const eventType = this.detectEventType(operation);
    if (!eventType) return;

    const event: BlockchainEvent = {
      id: operation.id,
      type: eventType,
      timestamp: operation.created_at,
      account: accountId,
      data: this.extractOperationData(operation),
    };

    this.emit(eventType, event);
  }

  private detectEventType(operation: any): BlockchainEventType | null {
    switch (operation.type) {
      case 'payment':
        return BlockchainEventType.PAYMENT;
      case 'path_payment_strict_receive':
      case 'path_payment_strict_send':
        return BlockchainEventType.TOKEN_TRANSFER;
      case 'create_account':
        return BlockchainEventType.ACCOUNT_CREATED;
      case 'change_trust':
        return BlockchainEventType.TRUSTLINE_CREATED;
      case 'invoke_host_function':
        return BlockchainEventType.CONTRACT_EXECUTION;
      case 'manage_buy_offer':
      case 'manage_sell_offer':
        const op = operation as any;
        if (op.buying_asset_type === 'credit_alphanum4' || op.selling_asset_type === 'credit_alphanum4') {
          return BlockchainEventType.NFT_TRANSFER;
        }
        return null;
      default:
        return null;
    }
  }

  private extractOperationData(operation: any): any {
    const baseData = {
      type: operation.type,
      transactionHash: operation.transaction_hash,
    };

    switch (operation.type) {
      case 'payment':
        const payment = operation as any;
        return {
          ...baseData,
          from: payment.from,
          to: payment.to,
          amount: payment.amount,
          asset: payment.asset_type === 'native' ? 'XLM' : payment.asset_code,
        };

      case 'create_account':
        const createAccount = operation as ServerApi.CreateAccountOperationRecord;
        return {
          ...baseData,
          account: createAccount.account,
          startingBalance: createAccount.starting_balance,
        };

      case 'change_trust':
        const changeTrust = operation as ServerApi.ChangeTrustOperationRecord;
        return {
          ...baseData,
          asset: changeTrust.asset_code,
          limit: changeTrust.limit,
        };

      case 'invoke_host_function':
        return {
          ...baseData,
          function: 'contract_execution',
        };

      default:
        return baseData;
    }
  }

  private handleError(error: any, accountId: string): void {
    console.error(`Event stream error for ${accountId}:`, error);

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
        this.startMonitoring(accountId);
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  on(eventType: BlockchainEventType, callback: EventCallback): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);
  }

  off(eventType: BlockchainEventType, callback: EventCallback): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(eventType: BlockchainEventType, event: BlockchainEvent): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach((callback) => callback(event));
    }
  }

  stopMonitoring(): void {
    this.closeHandlers.forEach((close) => close());
    this.closeHandlers = [];
    this.listeners.clear();
    this.reconnectAttempts = 0;
  }
}
