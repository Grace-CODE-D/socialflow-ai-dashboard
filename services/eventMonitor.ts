import { Transaction, Platform } from '../types';

type TransactionListener = (transaction: Transaction) => void;

class EventMonitor {
  private listeners: TransactionListener[] = [];
  private isMonitoring = false;
  private intervalId?: NodeJS.Timeout;

  subscribe(listener: TransactionListener): () => void {
    this.listeners.push(listener);
    
    if (!this.isMonitoring) {
      this.startMonitoring();
    }

    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
      if (this.listeners.length === 0) {
        this.stopMonitoring();
      }
    };
  }

  private startMonitoring(): void {
    this.isMonitoring = true;
    
    // Simulate real-time events (in production, this would connect to WebSocket/SSE)
    this.intervalId = setInterval(() => {
      if (Math.random() > 0.7) {
        const transaction = this.generateMockTransaction();
        this.notifyListeners(transaction);
      }
    }, 5000);
  }

  private stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  private notifyListeners(transaction: Transaction): void {
    this.listeners.forEach(listener => listener(transaction));
  }

  private generateMockTransaction(): Transaction {
    const types: Transaction['type'][] = ['post', 'comment', 'like', 'share', 'follow', 'message', 'campaign', 'payment'];
    const platforms = Object.values(Platform);
    const statuses: Transaction['status'][] = ['pending', 'completed', 'failed'];
    
    const type = types[Math.floor(Math.random() * types.length)];
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    return {
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      platform,
      description: this.getDescription(type, platform),
      timestamp: new Date(),
      status,
      metadata: {
        userId: `user_${Math.floor(Math.random() * 1000)}`,
        amount: type === 'payment' ? Math.floor(Math.random() * 1000) : undefined,
      },
      isNew: true,
    };
  }

  private getDescription(type: Transaction['type'], platform: Platform): string {
    const descriptions: Record<Transaction['type'], string[]> = {
      post: ['New post published', 'Post scheduled', 'Post updated'],
      comment: ['New comment received', 'Comment replied', 'Comment moderated'],
      like: ['Post liked', 'Comment liked', 'Story liked'],
      share: ['Content shared', 'Post reshared', 'Story shared'],
      follow: ['New follower', 'Following new account', 'Follower milestone reached'],
      message: ['New message received', 'Message sent', 'Message read'],
      campaign: ['Campaign started', 'Campaign completed', 'Campaign updated'],
      payment: ['Payment processed', 'Payment pending', 'Payment refunded'],
    };

    const options = descriptions[type];
    return `${options[Math.floor(Math.random() * options.length)]} on ${platform}`;
  }
}

export const eventMonitor = new EventMonitor();
