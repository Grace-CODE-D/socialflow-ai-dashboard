/**
 * Standardized Webhook Event Schema
 *
 * Event types are sourced from @socialflow/shared (canonical list).
 */

export { SUPPORTED_EVENTS } from '@socialflow/shared';
export type { WebhookEventType } from '@socialflow/shared';

/** Base envelope for all webhook events */
export interface WebhookEvent<T = Record<string, any>> {
  /** Unique identifier for the webhook event delivery */
  id: string;
  /** The schema version of the event payload */
  version: '1.0';
  /** The type of event that occurred */
  event: import('@socialflow/shared').WebhookEventType;
  /** ISO 8601 timestamp of when the event occurred */
  createdAt: string;
  /** The source system or service that generated the event */
  source: string;
  /** The event-specific data payload */
  data: T;
}

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
