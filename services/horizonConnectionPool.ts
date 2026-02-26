import * as StellarSdk from '@stellar/stellar-sdk';

interface Connection {
  id: number;
  server: StellarSdk.Horizon.Server;
  healthy: boolean;
  activeRequests: number;
  lastUsed: number;
  totalRequests: number;
  errors: number;
}

class HorizonConnectionPool {
  private connections: Connection[] = [];
  private readonly poolSize = 3;
  private readonly horizonUrl = 'https://horizon-testnet.stellar.org';
  private readonly healthCheckInterval = 30000;
  private readonly maxRetries = 3;
  private currentIndex = 0;

  constructor() {
    this.initializePool();
    this.startHealthMonitoring();
  }

  private initializePool() {
    for (let i = 0; i < this.poolSize; i++) {
      this.connections.push({
        id: i,
        server: new StellarSdk.Horizon.Server(this.horizonUrl),
        healthy: true,
        activeRequests: 0,
        lastUsed: Date.now(),
        totalRequests: 0,
        errors: 0
      });
    }
  }

  private startHealthMonitoring() {
    setInterval(() => this.checkHealth(), this.healthCheckInterval);
  }

  private async checkHealth() {
    for (const conn of this.connections) {
      try {
        await conn.server.ledgers().limit(1).call();
        conn.healthy = true;
      } catch (error) {
        conn.healthy = false;
        conn.errors++;
      }
    }
  }

  private getNextConnection(): Connection {
    const healthy = this.connections.filter(c => c.healthy);
    if (healthy.length === 0) throw new Error('No healthy connections');

    // Load balancing: pick connection with least active requests
    return healthy.reduce((min, conn) => 
      conn.activeRequests < min.activeRequests ? conn : min
    );
  }

  async execute<T>(operation: (server: StellarSdk.Horizon.Server) => Promise<T>): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      const conn = this.getNextConnection();
      conn.activeRequests++;
      conn.totalRequests++;

      try {
        const result = await operation(conn.server);
        conn.lastUsed = Date.now();
        return result;
      } catch (error) {
        lastError = error as Error;
        conn.errors++;
        if (conn.errors > 5) conn.healthy = false;
      } finally {
        conn.activeRequests--;
      }
    }

    throw lastError || new Error('Operation failed');
  }

  getStats() {
    return this.connections.map(c => ({
      id: c.id,
      healthy: c.healthy,
      activeRequests: c.activeRequests,
      totalRequests: c.totalRequests,
      errors: c.errors,
      lastUsed: c.lastUsed
    }));
  }
}

export const horizonPool = new HorizonConnectionPool();
