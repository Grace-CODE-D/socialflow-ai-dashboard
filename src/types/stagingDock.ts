/**
 * Staging Dock Type Definitions
 * Requirements: 4.1, 10.1, 2.4, 4.4, 20.1, 20.2, 20.3
 */

/**
 * Transaction status types
 */
export type TransactionStatus = 
  | 'pending'
  | 'signing'
  | 'dispatched'
  | 'confirmed'
  | 'failed';

/**
 * Transaction type categories
 */
export type TransactionType = 
  | 'post_publish'
  | 'trustline'
  | 'payment'
  | 'swap'
  | 'nft_mint'
  | 'other';

/**
 * Priority levels for transaction queue
 */
export type QueuePriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Pending transaction interface
 */
export interface PendingTransaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  priority: QueuePriority;
  createdAt: number;
  updatedAt: number;
  postId?: string;
  title: string;
  description: string;
  fee?: number;
  estimatedGas?: number;
  xdr?: string;
  dependencies: string[];
  retryCount: number;
  error?: string;
}

/**
 * Transaction group for bundling
 */
export interface TransactionGroup {
  id: string;
  transactions: string[];
  totalFee: number;
  status: TransactionStatus;
  createdAt: number;
}

/**
 * Queue processing status
 */
export interface QueueStatus {
  isProcessing: boolean;
  currentTransactionId: string | null;
  totalPending: number;
  totalGroups: number;
  processedCount: number;
  failedCount: number;
  lastProcessedAt: number | null;
}

/**
 * Notification types for dock
 */
export type NotificationType = 
  | 'item_added'
  | 'signature_required'
  | 'transaction_confirmed'
  | 'transaction_failed'
  | 'queue_processing';

/**
 * Dock notification interface
 */
export interface DockNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  transactionId?: string;
}

/**
 * Sound preferences for notifications
 */
export interface NotificationSoundPreferences {
  enabled: boolean;
  volume: number;
  itemAdded: boolean;
  signatureRequired: boolean;
  transactionConfirmed: boolean;
  transactionFailed: boolean;
}

/**
 * StagingDock component props
 */
export interface StagingDockProps {
  isOpen: boolean;
  onToggle: () => void;
}

/**
 * Transaction summary for authorization
 */
export interface TransactionSummary {
  totalTransactions: number;
  totalGroups: number;
  totalFee: number;
  estimatedTime: number;
  transactions: PendingTransaction[];
}

/**
 * Authorization progress
 */
export interface AuthorizationProgress {
  total: number;
  current: number;
  currentTransactionId: string | null;
  failed: string[];
  completed: string[];
}

/**
 * IndexedDB stored queue item
 */
export interface StoredQueueItem extends PendingTransaction {
  groupId?: string;
}
