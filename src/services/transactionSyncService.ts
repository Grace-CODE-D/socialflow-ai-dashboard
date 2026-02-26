import { Horizon } from '@stellar/stellar-sdk';
import { transactionDB, TransactionRecord } from './transactionDB';

type HorizonServer = Horizon.Server;

export enum SyncStatus {
  IDLE = 'idle',
  SYNCING = 'syncing',
  SUCCESS = 'success',
  ERROR = 'error',
}

interface SyncState {
  status: SyncStatus;
  lastSyncTime?: number;
  totalSynced: number;
  error?: string;
}

class TransactionSyncService {
  private server: HorizonServer;
  private syncState: SyncState = {
    status: SyncStatus.IDLE,
    totalSynced: 0,
  };
  private listeners: Set<(state: SyncState) => void> = new Set();

  constructor(horizonUrl: string = 'https://horizon-testnet.stellar.org') {
    this.server = new Horizon.Server(horizonUrl);
  }

  getSyncState(): SyncState {
    return { ...this.syncState };
  }

  onSyncStateChange(callback: (state: SyncState) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private updateSyncState(updates: Partial<SyncState>): void {
    this.syncState = { ...this.syncState, ...updates };
    this.listeners.forEach(listener => listener(this.syncState));
  }

  async initialSync(accountId: string): Promise<void> {
    this.updateSyncState({ status: SyncStatus.SYNCING, error: undefined });

    try {
      await transactionDB.init();

      // Fetch last 100 transactions
      const response = await this.server
        .transactions()
        .forAccount(accountId)
        .order('desc')
        .limit(100)
        .call();

      const transactions: TransactionRecord[] = response.records.map(tx => 
        this.mapHorizonTransaction(tx)
      );

      await transactionDB.addTransactions(transactions);

      this.updateSyncState({
        status: SyncStatus.SUCCESS,
        lastSyncTime: Date.now(),
        totalSynced: transactions.length,
      });
    } catch (error) {
      this.updateSyncState({
        status: SyncStatus.ERROR,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async incrementalSync(accountId: string): Promise<void> {
    this.updateSyncState({ status: SyncStatus.SYNCING, error: undefined });

    try {
      await transactionDB.init();

      // Get latest transaction from DB
      const latestTx = await transactionDB.getLatestTransaction();
      const cursor = latestTx?.id;

      // Fetch new transactions since last sync
      let query = this.server
        .transactions()
        .forAccount(accountId)
        .order('desc')
        .limit(50);

      if (cursor) {
        query = query.cursor(cursor);
      }

      const response = await query.call();
      const newTransactions: TransactionRecord[] = response.records.map(tx =>
        this.mapHorizonTransaction(tx)
      );

      if (newTransactions.length > 0) {
        await transactionDB.addTransactions(newTransactions);
      }

      this.updateSyncState({
        status: SyncStatus.SUCCESS,
        lastSyncTime: Date.now(),
        totalSynced: this.syncState.totalSynced + newTransactions.length,
      });
    } catch (error) {
      this.updateSyncState({
        status: SyncStatus.ERROR,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async syncOnWalletConnect(accountId: string): Promise<void> {
    // Check if we have any transactions in DB
    await transactionDB.init();
    const existingTxs = await transactionDB.getAllTransactions();

    if (existingTxs.length === 0) {
      // First time sync - fetch last 100
      await this.initialSync(accountId);
    } else {
      // Incremental sync
      await this.incrementalSync(accountId);
    }
  }

  private mapHorizonTransaction(tx: any): TransactionRecord {
    return {
      id: tx.id,
      type: this.determineTransactionType(tx),
      amount: this.extractAmount(tx),
      asset: this.extractAsset(tx),
      timestamp: new Date(tx.created_at).getTime(),
      status: tx.successful ? 'confirmed' : 'failed',
      from: tx.source_account,
      to: this.extractDestination(tx),
      memo: tx.memo || undefined,
      fee: tx.fee_charged,
      ledger: tx.ledger_attr,
      operations: tx.operation_count ? [] : undefined, // Placeholder
      signatures: tx.signatures || [],
      rawData: tx,
      syncedAt: Date.now(),
    };
  }

  private determineTransactionType(tx: any): string {
    // Simple type determination based on memo or operation count
    if (tx.memo?.includes('NFT')) return 'nft';
    if (tx.memo?.includes('TOKEN')) return 'token';
    if (tx.memo?.includes('CONTRACT')) return 'contract';
    return 'payment';
  }

  private extractAmount(tx: any): string | undefined {
    // This would need to parse operations to get actual amount
    // Placeholder implementation
    return undefined;
  }

  private extractAsset(tx: any): string {
    // This would need to parse operations to get actual asset
    // Placeholder - defaults to XLM
    return 'XLM';
  }

  private extractDestination(tx: any): string | undefined {
    // This would need to parse operations to get destination
    // Placeholder implementation
    return undefined;
  }

  async startAutoSync(accountId: string, intervalMs: number = 30000): Promise<() => void> {
    const intervalId = setInterval(() => {
      this.incrementalSync(accountId).catch(console.error);
    }, intervalMs);

    return () => clearInterval(intervalId);
  }
}

export const transactionSyncService = new TransactionSyncService();
