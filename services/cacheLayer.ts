interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
}

class CacheLayer {
  private balanceCache = new Map<string, CacheEntry<any>>();
  private txHistoryCache = new Map<string, CacheEntry<any>>();
  private ipfsCache = new Map<string, CacheEntry<Blob>>();
  
  private readonly BALANCE_TTL = 30000; // 30 seconds
  private readonly TX_HISTORY_TTL = 300000; // 5 minutes
  private readonly IPFS_MAX_SIZE = 100;
  
  private stats = {
    balanceHits: 0,
    balanceMisses: 0,
    txHistoryHits: 0,
    txHistoryMisses: 0,
    ipfsHits: 0,
    ipfsMisses: 0
  };

  // Balance caching
  getBalance(key: string): any | null {
    const entry = this.balanceCache.get(key);
    if (!entry) {
      this.stats.balanceMisses++;
      return null;
    }

    if (Date.now() - entry.timestamp > this.BALANCE_TTL) {
      this.balanceCache.delete(key);
      this.stats.balanceMisses++;
      return null;
    }

    entry.hits++;
    this.stats.balanceHits++;
    return entry.data;
  }

  setBalance(key: string, data: any) {
    this.balanceCache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 0
    });
  }

  invalidateBalance(key: string) {
    this.balanceCache.delete(key);
  }

  // Transaction history caching
  getTxHistory(key: string): any | null {
    const entry = this.txHistoryCache.get(key);
    if (!entry) {
      this.stats.txHistoryMisses++;
      return null;
    }

    if (Date.now() - entry.timestamp > this.TX_HISTORY_TTL) {
      this.txHistoryCache.delete(key);
      this.stats.txHistoryMisses++;
      return null;
    }

    entry.hits++;
    this.stats.txHistoryHits++;
    return entry.data;
  }

  setTxHistory(key: string, data: any) {
    this.txHistoryCache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 0
    });
  }

  invalidateTxHistory(key: string) {
    this.txHistoryCache.delete(key);
  }

  // IPFS caching with LRU eviction
  getIPFS(cid: string): Blob | null {
    const entry = this.ipfsCache.get(cid);
    if (!entry) {
      this.stats.ipfsMisses++;
      return null;
    }

    entry.hits++;
    entry.timestamp = Date.now(); // Update for LRU
    this.stats.ipfsHits++;
    return entry.data;
  }

  setIPFS(cid: string, data: Blob) {
    if (this.ipfsCache.size >= this.IPFS_MAX_SIZE) {
      this.evictLRU();
    }

    this.ipfsCache.set(cid, {
      data,
      timestamp: Date.now(),
      hits: 0
    });
  }

  private evictLRU() {
    let oldest: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.ipfsCache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldest = key;
      }
    }

    if (oldest) this.ipfsCache.delete(oldest);
  }

  // Event-based invalidation
  onBalanceChange(publicKey: string) {
    this.invalidateBalance(publicKey);
    this.invalidateTxHistory(publicKey);
  }

  onNewTransaction(publicKey: string) {
    this.invalidateTxHistory(publicKey);
  }

  // Cache statistics
  getStats() {
    const balanceTotal = this.stats.balanceHits + this.stats.balanceMisses;
    const txTotal = this.stats.txHistoryHits + this.stats.txHistoryMisses;
    const ipfsTotal = this.stats.ipfsHits + this.stats.ipfsMisses;

    return {
      balance: {
        hits: this.stats.balanceHits,
        misses: this.stats.balanceMisses,
        hitRate: balanceTotal ? (this.stats.balanceHits / balanceTotal * 100).toFixed(2) : '0.00',
        size: this.balanceCache.size
      },
      txHistory: {
        hits: this.stats.txHistoryHits,
        misses: this.stats.txHistoryMisses,
        hitRate: txTotal ? (this.stats.txHistoryHits / txTotal * 100).toFixed(2) : '0.00',
        size: this.txHistoryCache.size
      },
      ipfs: {
        hits: this.stats.ipfsHits,
        misses: this.stats.ipfsMisses,
        hitRate: ipfsTotal ? (this.stats.ipfsHits / ipfsTotal * 100).toFixed(2) : '0.00',
        size: this.ipfsCache.size
      }
    };
  }

  clear() {
    this.balanceCache.clear();
    this.txHistoryCache.clear();
    this.ipfsCache.clear();
  }
}

export const cacheLayer = new CacheLayer();
