export type TransactionStatus = 'pending' | 'signing' | 'dispatched' | 'confirmed' | 'failed';

export interface Transaction {
  id: string;
  hash?: string;
  type: string;
  status: TransactionStatus;
  amount?: string;
  asset?: string;
  recipient?: string;
  timestamp: number;
  estimatedConfirmTime?: number;
  error?: string;
}

export interface TransactionQueueItem extends Transaction {
  retryCount: number;
  lastRetry?: number;
}
