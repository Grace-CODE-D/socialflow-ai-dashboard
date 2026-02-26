import { Notification, nativeImage } from 'electron';
import { BlockchainEvent, BlockchainEventType } from '../src/blockchain/services/EventMonitorService';
import * as path from 'path';

export interface NotificationPreferences {
  enabled: boolean;
  sound: boolean;
  payment: boolean;
  tokenTransfer: boolean;
  nftTransfer: boolean;
  contractExecution: boolean;
  accountCreated: boolean;
  trustlineCreated: boolean;
  throttleMs: number;
}

interface NotificationHistoryItem {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  eventType: BlockchainEventType;
}

export class NotificationService {
  private preferences: NotificationPreferences = {
    enabled: true,
    sound: true,
    payment: true,
    tokenTransfer: true,
    nftTransfer: true,
    contractExecution: true,
    accountCreated: true,
    trustlineCreated: true,
    throttleMs: 3000,
  };
  
  private history: NotificationHistoryItem[] = [];
  private lastNotificationTime = new Map<BlockchainEventType, number>();
  private maxHistorySize = 100;

  setPreferences(prefs: Partial<NotificationPreferences>): void {
    this.preferences = { ...this.preferences, ...prefs };
  }

  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  getHistory(): NotificationHistoryItem[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
  }

  notify(event: BlockchainEvent): void {
    if (!this.preferences.enabled || !this.shouldNotify(event.type)) return;

    const now = Date.now();
    const lastTime = this.lastNotificationTime.get(event.type) || 0;
    
    if (now - lastTime < this.preferences.throttleMs) return;

    const { title, body } = this.getNotificationContent(event);
    
    const notification = new Notification({
      title,
      body,
      silent: !this.preferences.sound,
      urgency: this.getUrgency(event.type),
    });

    notification.show();

    this.addToHistory({
      id: event.id,
      title,
      body,
      timestamp: now,
      eventType: event.type,
    });

    this.lastNotificationTime.set(event.type, now);
  }

  private shouldNotify(type: BlockchainEventType): boolean {
    switch (type) {
      case BlockchainEventType.PAYMENT:
        return this.preferences.payment;
      case BlockchainEventType.TOKEN_TRANSFER:
        return this.preferences.tokenTransfer;
      case BlockchainEventType.NFT_TRANSFER:
        return this.preferences.nftTransfer;
      case BlockchainEventType.CONTRACT_EXECUTION:
        return this.preferences.contractExecution;
      case BlockchainEventType.ACCOUNT_CREATED:
        return this.preferences.accountCreated;
      case BlockchainEventType.TRUSTLINE_CREATED:
        return this.preferences.trustlineCreated;
      default:
        return false;
    }
  }

  private getNotificationContent(event: BlockchainEvent): { title: string; body: string } {
    switch (event.type) {
      case BlockchainEventType.PAYMENT:
        return {
          title: '💰 Payment Received',
          body: `${event.data.amount} ${event.data.asset} from ${event.data.from.slice(0, 8)}...`,
        };
      
      case BlockchainEventType.TOKEN_TRANSFER:
        return {
          title: '🪙 Token Transfer',
          body: `Token transfer detected`,
        };
      
      case BlockchainEventType.NFT_TRANSFER:
        return {
          title: '🖼️ NFT Transfer',
          body: `NFT transfer detected`,
        };
      
      case BlockchainEventType.CONTRACT_EXECUTION:
        return {
          title: '⚙️ Contract Executed',
          body: `Smart contract execution completed`,
        };
      
      case BlockchainEventType.ACCOUNT_CREATED:
        return {
          title: '✨ Account Created',
          body: `New account: ${event.data.account.slice(0, 8)}...`,
        };
      
      case BlockchainEventType.TRUSTLINE_CREATED:
        return {
          title: '🔗 Trustline Created',
          body: `Trustline for ${event.data.asset}`,
        };
      
      default:
        return {
          title: '🔔 Blockchain Event',
          body: `Event type: ${event.type}`,
        };
    }
  }

  private getUrgency(type: BlockchainEventType): 'normal' | 'critical' | 'low' {
    switch (type) {
      case BlockchainEventType.PAYMENT:
      case BlockchainEventType.NFT_TRANSFER:
        return 'normal';
      case BlockchainEventType.CONTRACT_EXECUTION:
        return 'critical';
      default:
        return 'low';
    }
  }

  private addToHistory(item: NotificationHistoryItem): void {
    this.history.unshift(item);
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(0, this.maxHistorySize);
    }
  }
}
