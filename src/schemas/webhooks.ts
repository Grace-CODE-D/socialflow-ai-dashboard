/**
 * Standardized Webhook Event Schema
 * 
 * Defines the common envelope and payload structures for all incoming 
 * and outgoing webhooks across the SocialFlow ecosystem.
 */

export type WebhookEventVersion = '1.0';

export type WebhookEventType = 
  | 'post.published'
  | 'post.failed'
  | 'analytics.report_ready'
  | 'blockchain.transaction_completed'
  | 'blockchain.transaction_failed'
  | 'system.health_check';

/**
 * Base envelope for all webhook events
 */
export interface WebhookEvent<T = Record<string, any>> {
  /** Unique identifier for the webhook event delivery */
  id: string;
  
  /** The schema version of the event payload */
  version: WebhookEventVersion;
  
  /** The type of event that occurred */
  event: WebhookEventType;
  
  /** ISO 8601 timestamp of when the event occurred */
  createdAt: string;
  
  /** The source system or service that generated the event */
  source: string;
  
  /** The event-specific data payload */
  data: T;
}

// --- Specific Event Payloads ---

export interface PostPublishedPayload {
  postId: string;
  platform: string;
  url: string;
  publishedAt: string;
}

export interface PostFailedPayload {
  postId: string;
  platform: string;
  error: string;
  failedAt: string;
}

export interface AnalyticsReportReadyPayload {
  reportId: string;
  period: string;
  downloadUrl: string;
}

export interface BlockchainTransactionPayload {
  transactionHash: string;
  status: 'success' | 'failed';
  amount?: number;
  asset?: string;
  error?: string;
}
