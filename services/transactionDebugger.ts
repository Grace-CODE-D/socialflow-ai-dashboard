import { Transaction } from '../types';
import { eventMonitor } from './eventMonitor';

interface TransactionDebugInfo {
  transaction: Transaction;
  debugData: {
    executionTime: number;
    memoryUsage: number;
    apiCalls: string[];
    errors: string[];
    warnings: string[];
    stackTrace?: string;
    performance: {
      startTime: number;
      endTime: number;
      duration: number;
      steps: Array<{
        name: string;
        duration: number;
        timestamp: number;
      }>;
    };
  };
}

type TransactionDebugListener = (debugInfo: TransactionDebugInfo) => void;

class TransactionDebugger {
  private listeners: TransactionDebugListener[] = [];
  private debuggedTransactions: Map<string, TransactionDebugInfo> = new Map();
  private isDebugging = false;
  private unsubscribeEventMonitor?: () => void;

  subscribe(listener: TransactionDebugListener): () => void {
    this.listeners.push(listener);
    
    if (!this.isDebugging) {
      this.startDebugging();
    }

    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
      if (this.listeners.length === 0) {
        this.stopDebugging();
      }
    };
  }

  getDebuggedTransactions(): TransactionDebugInfo[] {
    return Array.from(this.debuggedTransactions.values());
  }

  getTransactionDebugInfo(transactionId: string): TransactionDebugInfo | undefined {
    return this.debuggedTransactions.get(transactionId);
  }

  clearDebugData(): void {
    this.debuggedTransactions.clear();
  }

  debugTransaction(transaction: Transaction): TransactionDebugInfo {
    const startTime = performance.now();
    
    const debugInfo: TransactionDebugInfo = {
      transaction,
      debugData: {
        executionTime: 0,
        memoryUsage: this.getMemoryUsage(),
        apiCalls: [],
        errors: [],
        warnings: [],
        performance: {
          startTime,
          endTime: 0,
          duration: 0,
          steps: []
        }
      }
    };

    // Simulate debugging steps
    this.simulateDebugging(debugInfo);
    
    return debugInfo;
  }

  private startDebugging(): void {
    this.isDebugging = true;
    
    // Subscribe to event monitor to debug all transactions
    this.unsubscribeEventMonitor = eventMonitor.subscribe((transaction) => {
      const debugInfo = this.debugTransaction(transaction);
      this.debuggedTransactions.set(transaction.id, debugInfo);
      this.notifyListeners(debugInfo);
    });
  }

  private stopDebugging(): void {
    this.isDebugging = false;
    
    if (this.unsubscribeEventMonitor) {
      this.unsubscribeEventMonitor();
      this.unsubscribeEventMonitor = undefined;
    }
  }

  private simulateDebugging(debugInfo: TransactionDebugInfo): void {
    const { transaction } = debugInfo;
    const steps = this.getDebuggingSteps(transaction.type);
    
    let currentTime = debugInfo.debugData.performance.startTime;
    
    steps.forEach((stepName, index) => {
      const stepDuration = Math.random() * 50 + 10; // 10-60ms per step
      currentTime += stepDuration;
      
      debugInfo.debugData.performance.steps.push({
        name: stepName,
        duration: stepDuration,
        timestamp: currentTime
      });

      // Simulate API calls
      if (stepName.includes('API') || stepName.includes('Network')) {
        debugInfo.debugData.apiCalls.push(`${stepName}: ${this.generateApiCall(transaction.type)}`);
      }

      // Simulate potential issues
      if (Math.random() > 0.8) {
        if (Math.random() > 0.5) {
          debugInfo.debugData.warnings.push(`${stepName}: ${this.generateWarning()}`);
        } else {
          debugInfo.debugData.errors.push(`${stepName}: ${this.generateError()}`);
        }
      }
    });

    debugInfo.debugData.performance.endTime = currentTime;
    debugInfo.debugData.performance.duration = currentTime - debugInfo.debugData.performance.startTime;
    debugInfo.debugData.executionTime = debugInfo.debugData.performance.duration;

    // Add stack trace for failed transactions
    if (transaction.status === 'failed') {
      debugInfo.debugData.stackTrace = this.generateStackTrace(transaction.type);
    }
  }

  private getDebuggingSteps(transactionType: Transaction['type']): string[] {
    const commonSteps = ['Initialize', 'Validate Input', 'Check Permissions'];
    
    const typeSpecificSteps: Record<Transaction['type'], string[]> = {
      post: ['Content Validation', 'Media Processing', 'Platform API Call', 'Schedule Post', 'Update Database'],
      comment: ['Content Moderation', 'Spam Check', 'Platform API Call', 'Notification Send', 'Update Database'],
      like: ['Rate Limit Check', 'Platform API Call', 'Update Counters', 'Cache Update'],
      share: ['Content Validation', 'Privacy Check', 'Platform API Call', 'Analytics Update', 'Update Database'],
      follow: ['User Validation', 'Relationship Check', 'Platform API Call', 'Notification Send', 'Update Database'],
      message: ['Content Moderation', 'Encryption', 'Platform API Call', 'Delivery Confirmation', 'Update Database'],
      campaign: ['Budget Validation', 'Target Audience', 'Creative Review', 'Platform API Call', 'Analytics Setup'],
      payment: ['Amount Validation', 'Payment Gateway', 'Transaction Processing', 'Confirmation', 'Update Balance']
    };

    return [...commonSteps, ...typeSpecificSteps[transactionType], 'Cleanup', 'Response'];
  }

  private generateApiCall(transactionType: Transaction['type']): string {
    const apis = {
      post: 'POST /api/v1/posts',
      comment: 'POST /api/v1/comments',
      like: 'POST /api/v1/likes',
      share: 'POST /api/v1/shares',
      follow: 'POST /api/v1/follows',
      message: 'POST /api/v1/messages',
      campaign: 'POST /api/v1/campaigns',
      payment: 'POST /api/v1/payments'
    };

    return apis[transactionType] || 'POST /api/v1/generic';
  }

  private generateWarning(): string {
    const warnings = [
      'Rate limit approaching (80% of limit used)',
      'Large payload size detected (>1MB)',
      'Deprecated API endpoint used',
      'Slow response time detected (>2s)',
      'High memory usage during processing',
      'Cache miss - fetching from database',
      'Non-optimal query detected'
    ];

    return warnings[Math.floor(Math.random() * warnings.length)];
  }

  private generateError(): string {
    const errors = [
      'Network timeout after 30 seconds',
      'Invalid authentication token',
      'Rate limit exceeded',
      'Insufficient permissions',
      'Malformed request payload',
      'Database connection failed',
      'External service unavailable',
      'Validation failed: missing required field'
    ];

    return errors[Math.floor(Math.random() * errors.length)];
  }

  private generateStackTrace(transactionType: Transaction['type']): string {
    return `Error: Transaction failed during ${transactionType} processing
    at TransactionProcessor.process (transaction-processor.ts:45:12)
    at SocialMediaService.${transactionType} (social-media.service.ts:123:8)
    at ApiController.handle${transactionType.charAt(0).toUpperCase() + transactionType.slice(1)} (api.controller.ts:67:15)
    at Router.dispatch (router.ts:234:9)
    at Layer.handle (layer.ts:95:5)
    at next (router.ts:137:13)
    at middleware (auth.middleware.ts:28:3)
    at Layer.handle (layer.ts:95:5)
    at trim_prefix (router.ts:315:13)
    at Router.process_params (router.ts:335:12)`;
  }

  private getMemoryUsage(): number {
    // Simulate memory usage in MB
    return Math.floor(Math.random() * 100) + 50;
  }

  private notifyListeners(debugInfo: TransactionDebugInfo): void {
    this.listeners.forEach(listener => listener(debugInfo));
  }

  // Analysis methods
  getPerformanceAnalysis(): {
    averageExecutionTime: number;
    slowestTransactions: TransactionDebugInfo[];
    mostCommonErrors: Array<{ error: string; count: number }>;
    apiCallFrequency: Array<{ api: string; count: number }>;
  } {
    const transactions = Array.from(this.debuggedTransactions.values());
    
    if (transactions.length === 0) {
      return {
        averageExecutionTime: 0,
        slowestTransactions: [],
        mostCommonErrors: [],
        apiCallFrequency: []
      };
    }

    const averageExecutionTime = transactions.reduce((sum, t) => sum + t.debugData.executionTime, 0) / transactions.length;
    
    const slowestTransactions = transactions
      .sort((a, b) => b.debugData.executionTime - a.debugData.executionTime)
      .slice(0, 5);

    const errorCounts = new Map<string, number>();
    const apiCounts = new Map<string, number>();

    transactions.forEach(t => {
      t.debugData.errors.forEach(error => {
        errorCounts.set(error, (errorCounts.get(error) || 0) + 1);
      });
      
      t.debugData.apiCalls.forEach(api => {
        apiCounts.set(api, (apiCounts.get(api) || 0) + 1);
      });
    });

    const mostCommonErrors = Array.from(errorCounts.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const apiCallFrequency = Array.from(apiCounts.entries())
      .map(([api, count]) => ({ api, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      averageExecutionTime,
      slowestTransactions,
      mostCommonErrors,
      apiCallFrequency
    };
  }
}

export const transactionDebugger = new TransactionDebugger();