import { Server, Horizon } from '@stellar/stellar-sdk';

export interface BlockchainEvent {
  id: string;
  type: 'payment' | 'account_created' | 'trustline' | 'trade' | 'offer' | 'data';
  timestamp: Date;
  details: any;
  severity: 'info' | 'warning' | 'critical';
  acknowledged: boolean;
}

export interface SecurityAlert {
  id: string;
  type: 'large_transaction' | 'suspicious_activity' | 'low_balance' | 'unusual_pattern';
  message: string;
  timestamp: Date;
  severity: 'warning' | 'critical';
  acknowledged: boolean;
  metadata?: any;
}

export interface MonitorConfig {
  accountId: string;
  largeTransactionThreshold: number; // in XLM
  lowBalanceThreshold: number; // in XLM
  suspiciousActivityWindow: number; // in minutes
  maxTransactionsPerWindow: number;
  enableNotifications: boolean;
  horizonUrl?: string;
}

export class BlockchainEventMonitor {
  private server: Server;
  private config: MonitorConfig;
  private eventStream: any;
  private events: BlockchainEvent[] = [];
  private alerts: SecurityAlert[] = [];
  private transactionHistory: Map<string, Date[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnected = false;
  private eventCallbacks: ((event: BlockchainEvent) => void)[] = [];
  private alertCallbacks: ((alert: SecurityAlert) => void)[] = [];

  constructor(config: MonitorConfig) {
    this.config = config;
    this.server = new Server(config.horizonUrl || 'https://horizon-testnet.stellar.org');
  }

  public async start(): Promise<void> {
    try {
      await this.validateAccount();
      await this.checkInitialBalance();
      this.startEventStream();
      this.isConnected = true;
      this.reconnectAttempts = 0;
    } catch (error) {
      console.error('Failed to start event monitor:', error);
      throw error;
    }
  }

  public stop(): void {
    if (this.eventStream) {
      this.eventStream();
      this.eventStream = null;
    }
    this.isConnected = false;
  }

  public onEvent(callback: (event: BlockchainEvent) => void): void {
    this.eventCallbacks.push(callback);
  }

  public onAlert(callback: (alert: SecurityAlert) => void): void {
    this.alertCallbacks.push(callback);
  }

  public getEvents(): BlockchainEvent[] {
    return [...this.events];
  }

  public getAlerts(): SecurityAlert[] {
    return [...this.alerts];
  }

  public acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
    }
  }

  public acknowledgeEvent(eventId: string): void {
    const event = this.events.find(e => e.id === eventId);
    if (event) {
      event.acknowledged = true;
    }
  }

  public getUnacknowledgedAlerts(): SecurityAlert[] {
    return this.alerts.filter(a => !a.acknowledged);
  }

  public isMonitorConnected(): boolean {
    return this.isConnected;
  }

  private async validateAccount(): Promise<void> {
    try {
      await this.server.loadAccount(this.config.accountId);
    } catch (error) {
      throw new Error(`Invalid account ID: ${this.config.accountId}`);
    }
  }

  private async checkInitialBalance(): Promise<void> {
    try {
      const account = await this.server.loadAccount(this.config.accountId);
      const xlmBalance = parseFloat(
        account.balances.find((b: any) => b.asset_type === 'native')?.balance || '0'
      );

      if (xlmBalance < this.config.lowBalanceThreshold) {
        this.createAlert({
          type: 'low_balance',
          message: `Account balance (${xlmBalance} XLM) is below threshold (${this.config.lowBalanceThreshold} XLM)`,
          severity: 'warning',
          metadata: { balance: xlmBalance, threshold: this.config.lowBalanceThreshold }
        });
      }
    } catch (error) {
      console.error('Failed to check initial balance:', error);
    }
  }

  private startEventStream(): void {
    this.eventStream = this.server
      .transactions()
      .forAccount(this.config.accountId)
      .cursor('now')
      .stream({
        onmessage: (transaction: any) => this.handleTransaction(transaction),
        onerror: (error: any) => this.handleStreamError(error)
      });
  }

  private async handleTransaction(transaction: any): Promise<void> {
    try {
      const operations = await transaction.operations();
      
      for (const operation of operations.records) {
        const event = this.createEvent(operation, transaction);
        this.events.push(event);
        this.notifyEventCallbacks(event);

        // Security checks
        await this.checkForSecurityIssues(operation, transaction);
      }

      // Check for suspicious activity patterns
      this.checkSuspiciousActivity(transaction);
    } catch (error) {
      console.error('Error handling transaction:', error);
    }
  }

  private createEvent(operation: any, transaction: any): BlockchainEvent {
    const event: BlockchainEvent = {
      id: `${transaction.id}-${operation.id}`,
      type: this.mapOperationType(operation.type),
      timestamp: new Date(operation.created_at),
      details: {
        operationId: operation.id,
        transactionId: transaction.id,
        sourceAccount: operation.source_account,
        ...this.extractOperationDetails(operation)
      },
      severity: 'info',
      acknowledged: false
    };

    return event;
  }

  private mapOperationType(type: string): BlockchainEvent['type'] {
    const typeMap: Record<string, BlockchainEvent['type']> = {
      'payment': 'payment',
      'create_account': 'account_created',
      'change_trust': 'trustline',
      'manage_buy_offer': 'offer',
      'manage_sell_offer': 'offer',
      'path_payment_strict_receive': 'payment',
      'path_payment_strict_send': 'payment',
      'manage_data': 'data'
    };

    return typeMap[type] || 'data';
  }

  private extractOperationDetails(operation: any): any {
    switch (operation.type) {
      case 'payment':
        return {
          from: operation.from,
          to: operation.to,
          amount: operation.amount,
          asset: operation.asset_type === 'native' ? 'XLM' : `${operation.asset_code}:${operation.asset_issuer}`
        };
      case 'create_account':
        return {
          account: operation.account,
          startingBalance: operation.starting_balance
        };
      case 'change_trust':
        return {
          asset: `${operation.asset_code}:${operation.asset_issuer}`,
          limit: operation.limit
        };
      default:
        return {};
    }
  }

  private async checkForSecurityIssues(operation: any, transaction: any): Promise<void> {
    // Check for large transactions
    if (operation.type === 'payment') {
      const amount = parseFloat(operation.amount);
      const isXLM = operation.asset_type === 'native';

      if (isXLM && amount >= this.config.largeTransactionThreshold) {
        this.createAlert({
          type: 'large_transaction',
          message: `Large transaction detected: ${amount} XLM`,
          severity: amount >= this.config.largeTransactionThreshold * 2 ? 'critical' : 'warning',
          metadata: {
            amount,
            from: operation.from,
            to: operation.to,
            transactionId: transaction.id
          }
        });
      }
    }

    // Check balance after transaction
    await this.checkBalanceAfterTransaction();
  }

  private async checkBalanceAfterTransaction(): Promise<void> {
    try {
      const account = await this.server.loadAccount(this.config.accountId);
      const xlmBalance = parseFloat(
        account.balances.find((b: any) => b.asset_type === 'native')?.balance || '0'
      );

      if (xlmBalance < this.config.lowBalanceThreshold) {
        this.createAlert({
          type: 'low_balance',
          message: `Low balance warning: ${xlmBalance} XLM remaining`,
          severity: xlmBalance < this.config.lowBalanceThreshold / 2 ? 'critical' : 'warning',
          metadata: { balance: xlmBalance, threshold: this.config.lowBalanceThreshold }
        });
      }
    } catch (error) {
      console.error('Failed to check balance:', error);
    }
  }

  private checkSuspiciousActivity(transaction: any): void {
    const now = new Date();
    const accountKey = transaction.source_account;
    
    if (!this.transactionHistory.has(accountKey)) {
      this.transactionHistory.set(accountKey, []);
    }

    const history = this.transactionHistory.get(accountKey)!;
    history.push(now);

    // Clean old entries outside the window
    const windowMs = this.config.suspiciousActivityWindow * 60 * 1000;
    const cutoff = new Date(now.getTime() - windowMs);
    const recentTransactions = history.filter(date => date > cutoff);
    this.transactionHistory.set(accountKey, recentTransactions);

    // Check if exceeds threshold
    if (recentTransactions.length > this.config.maxTransactionsPerWindow) {
      this.createAlert({
        type: 'suspicious_activity',
        message: `Unusual activity: ${recentTransactions.length} transactions in ${this.config.suspiciousActivityWindow} minutes`,
        severity: 'critical',
        metadata: {
          transactionCount: recentTransactions.length,
          windowMinutes: this.config.suspiciousActivityWindow,
          account: accountKey
        }
      });
    }
  }

  private createAlert(params: Omit<SecurityAlert, 'id' | 'timestamp' | 'acknowledged'>): void {
    const alert: SecurityAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      acknowledged: false,
      ...params
    };

    this.alerts.push(alert);
    this.notifyAlertCallbacks(alert);

    if (this.config.enableNotifications) {
      this.sendNotification(alert);
    }
  }

  private notifyEventCallbacks(event: BlockchainEvent): void {
    this.eventCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in event callback:', error);
      }
    });
  }

  private notifyAlertCallbacks(alert: SecurityAlert): void {
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error in alert callback:', error);
      }
    });
  }

  private sendNotification(alert: SecurityAlert): void {
    if (typeof window !== 'undefined' && window.electronAPI?.sendNotification) {
      window.electronAPI.sendNotification({
        title: `Security Alert: ${alert.type}`,
        body: alert.message,
        severity: alert.severity
      });
    }
  }

  private handleStreamError(error: any): void {
    console.error('Event stream error:', error);
    this.isConnected = false;

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.startEventStream();
      }, delay);
    } else {
      this.createAlert({
        type: 'unusual_pattern',
        message: 'Event monitor disconnected after multiple reconnection attempts',
        severity: 'critical',
        metadata: { reconnectAttempts: this.reconnectAttempts }
      });
    }
  }
}

// Singleton instance management
let monitorInstance: BlockchainEventMonitor | null = null;

export const initializeMonitor = (config: MonitorConfig): BlockchainEventMonitor => {
  if (monitorInstance) {
    monitorInstance.stop();
  }
  monitorInstance = new BlockchainEventMonitor(config);
  return monitorInstance;
};

export const getMonitorInstance = (): BlockchainEventMonitor | null => {
  return monitorInstance;
};
