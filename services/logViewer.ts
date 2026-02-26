import { LogEntry } from '../types';

type LogListener = (log: LogEntry) => void;

class LogViewer {
  private listeners: LogListener[] = [];
  private logs: LogEntry[] = [];
  private isLogging = false;
  private originalConsole: {
    log: typeof console.log;
    warn: typeof console.warn;
    error: typeof console.error;
    debug: typeof console.debug;
    info: typeof console.info;
  };

  constructor() {
    this.originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
      info: console.info
    };
  }

  subscribe(listener: LogListener): () => void {
    this.listeners.push(listener);
    
    if (!this.isLogging) {
      this.startLogging();
    }

    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
      if (this.listeners.length === 0) {
        this.stopLogging();
      }
    };
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  filterLogs(level?: LogEntry['level'], source?: string, search?: string): LogEntry[] {
    return this.logs.filter(log => {
      if (level && log.level !== level) return false;
      if (source && !log.source.toLowerCase().includes(source.toLowerCase())) return false;
      if (search && !log.message.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }

  log(level: LogEntry['level'], message: string, source: string = 'app', metadata?: Record<string, any>): void {
    const logEntry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      level,
      message,
      timestamp: new Date(),
      source,
      metadata,
      stackTrace: level === 'error' ? new Error().stack : undefined
    };

    this.addLog(logEntry);
  }

  private startLogging(): void {
    this.isLogging = true;
    this.interceptConsole();
    this.simulateSystemLogs();
  }

  private stopLogging(): void {
    this.isLogging = false;
    this.restoreConsole();
  }

  private interceptConsole(): void {
    const self = this;

    console.log = function(...args: any[]) {
      self.originalConsole.log.apply(console, args);
      self.log('info', args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '), 'console');
    };

    console.info = function(...args: any[]) {
      self.originalConsole.info.apply(console, args);
      self.log('info', args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '), 'console');
    };

    console.warn = function(...args: any[]) {
      self.originalConsole.warn.apply(console, args);
      self.log('warn', args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '), 'console');
    };

    console.error = function(...args: any[]) {
      self.originalConsole.error.apply(console, args);
      self.log('error', args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '), 'console');
    };

    console.debug = function(...args: any[]) {
      self.originalConsole.debug.apply(console, args);
      self.log('debug', args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '), 'console');
    };
  }

  private restoreConsole(): void {
    console.log = this.originalConsole.log;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
    console.debug = this.originalConsole.debug;
    console.info = this.originalConsole.info;
  }

  private simulateSystemLogs(): void {
    // Simulate various system logs
    setInterval(() => {
      if (Math.random() > 0.6) {
        this.generateRandomLog();
      }
    }, 3000);

    // Initial system logs
    this.log('info', 'Application started', 'system');
    this.log('info', 'Debug tools initialized', 'debug-tools');
    this.log('debug', 'Event monitor started', 'event-monitor');
    this.log('debug', 'Network monitor started', 'network-monitor');
  }

  private generateRandomLog(): void {
    const sources = ['system', 'network', 'database', 'auth', 'api', 'ui', 'background-task'];
    const levels: LogEntry['level'][] = ['debug', 'info', 'warn', 'error'];
    
    const messages = {
      debug: [
        'Processing background task',
        'Cache hit for user data',
        'Validating user input',
        'Initializing component',
        'Cleaning up resources'
      ],
      info: [
        'User logged in successfully',
        'Data synchronized',
        'Background job completed',
        'Configuration updated',
        'Feature flag toggled'
      ],
      warn: [
        'API rate limit approaching',
        'Deprecated method used',
        'Large payload detected',
        'Slow query detected',
        'Memory usage high'
      ],
      error: [
        'Failed to connect to database',
        'Authentication failed',
        'Network timeout',
        'Invalid configuration',
        'Unhandled exception occurred'
      ]
    };

    const level = levels[Math.floor(Math.random() * levels.length)];
    const source = sources[Math.floor(Math.random() * sources.length)];
    const messageOptions = messages[level];
    const message = messageOptions[Math.floor(Math.random() * messageOptions.length)];

    const metadata: Record<string, any> = {};
    
    if (source === 'network') {
      metadata.url = `https://api.example.com/v1/${Math.random().toString(36).substring(2, 10)}`;
      metadata.statusCode = Math.random() > 0.8 ? 500 : 200;
    }
    
    if (source === 'database') {
      metadata.query = `SELECT * FROM ${['users', 'posts', 'transactions'][Math.floor(Math.random() * 3)]}`;
      metadata.duration = Math.floor(Math.random() * 1000) + 'ms';
    }

    this.log(level, message, source, metadata);
  }

  private addLog(log: LogEntry): void {
    this.logs.unshift(log);
    
    // Keep only last 500 logs
    if (this.logs.length > 500) {
      this.logs = this.logs.slice(0, 500);
    }
    
    this.notifyListeners(log);
  }

  private notifyListeners(log: LogEntry): void {
    this.listeners.forEach(listener => listener(log));
  }

  // Utility methods
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['timestamp', 'level', 'source', 'message'];
      const rows = this.logs.map(log => [
        log.timestamp.toISOString(),
        log.level,
        log.source,
        log.message.replace(/"/g, '""')
      ]);
      
      return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    }
    
    return JSON.stringify(this.logs, null, 2);
  }

  getLogStats(): { total: number; byLevel: Record<LogEntry['level'], number>; bySource: Record<string, number> } {
    const stats = {
      total: this.logs.length,
      byLevel: { debug: 0, info: 0, warn: 0, error: 0 } as Record<LogEntry['level'], number>,
      bySource: {} as Record<string, number>
    };

    this.logs.forEach(log => {
      stats.byLevel[log.level]++;
      stats.bySource[log.source] = (stats.bySource[log.source] || 0) + 1;
    });

    return stats;
  }
}

export const logViewer = new LogViewer();